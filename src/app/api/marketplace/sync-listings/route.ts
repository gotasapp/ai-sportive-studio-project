import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';
import { getSupportedContractAddressesWithDynamic } from '@/lib/marketplace-config';

const DB_NAME = 'chz-app-db';

/**
 * API OFICIAL usando getAllValidListings da Thirdweb para sincronizar dados do marketplace
 * Segue as melhores práticas da documentação oficial da Thirdweb
 */
export async function POST(request: Request) {
  try {
    console.log('🏪 OFFICIAL Marketplace Sync: Using getAllValidListings...');
    
    const body = await request.json();
    const { 
      start = 0, 
      count = 50,
      userWallet,
      forceUpdate = false
    } = body;

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
    });

    console.log(`🔍 Fetching valid listings from ${start} with count ${count}...`);

    // 🎯 USAR FUNÇÃO OFICIAL DA THIRDWEB
    const validListings = await getAllValidListings({
      contract: marketplaceContract,
      start,
      count,
    });

    console.log(`✅ Found ${validListings.length} valid listings on Thirdweb marketplace`);

    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    const syncResults = [];

    // NOVA ABORDAGEM: Aceitar TODOS os contratos válidos
    console.log('🚀 Sincronizando listagens de TODOS os contratos válidos');
    
    // Rastrear contratos únicos
    const uniqueContracts = new Set<string>();

    // Processar cada listing válido
    for (const listing of validListings) {
      console.log('🎯 Processing listing:', {
        id: listing.id.toString(),
        tokenId: listing.tokenId.toString(),
        creator: listing.creatorAddress,
        assetContract: listing.assetContractAddress,
        price: listing.pricePerToken.toString(),
        currency: listing.currencyContractAddress,
        status: listing.status
      });

      // Registrar contrato
      uniqueContracts.add(listing.assetContractAddress.toLowerCase());

      // Não filtrar por contrato - aceitar todos

      // Filtrar por usuário se especificado
      if (userWallet && listing.creatorAddress.toLowerCase() !== userWallet.toLowerCase()) {
        console.log('⏩ Skipping listing from different user');
        continue;
      }

      // Buscar NFT correspondente no MongoDB
      const collections = ['jerseys', 'stadiums', 'badges'];
      let updated = false;

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        
        // Buscar por múltiplos critérios para garantir match
        const filters = [
          // Critério 1: tokenId exato
          {
            $and: [
              { 
                $or: [
                  { tokenId: listing.tokenId.toString() },
                  { blockchainTokenId: listing.tokenId.toString() }
                ]
              },
              { owner: listing.creatorAddress.toLowerCase() }
            ]
          },
          // Critério 2: transactionHash se disponível
          ...(userWallet ? [{
            $and: [
              { owner: userWallet.toLowerCase() },
              { 'blockchain.chainId': 80002 },
              { 'blockchain.transactionHash': { $exists: true } }
            ]
          }] : [])
        ];

        for (const filter of filters) {
          const existingNFT = await collection.findOne(filter);
          
          if (existingNFT) {
            console.log(`✅ Found matching NFT in ${collectionName}:`, {
              mongoId: existingNFT._id.toString(),
              currentTokenId: existingNFT.tokenId || 'MISSING',
              currentListingId: existingNFT.marketplace?.listingId || 'MISSING'
            });

            // Dados completos do marketplace
            const marketplaceData = {
              isListed: true,
              listingId: listing.id.toString(),
              price: listing.pricePerToken.toString(),
              priceFormatted: listing.currencyValuePerToken.displayValue,
              currency: listing.currencyContractAddress,
              currencySymbol: listing.currencyValuePerToken.symbol,
              startTime: new Date(Number(listing.startTimeInSeconds) * 1000),
              endTime: new Date(Number(listing.endTimeInSeconds) * 1000),
              status: listing.status,
              type: listing.type,
              quantity: listing.quantity.toString(),
              isReserved: listing.isReservedListing,
              creator: listing.creatorAddress,
              
              // Metadados do sync
              lastSyncAt: new Date(),
              syncMethod: 'getAllValidListings',
              thirdwebData: {
                id: listing.id.toString(),
                tokenId: listing.tokenId.toString(),
                assetContract: listing.assetContractAddress
              }
            };

            // Atualizar apenas se necessário ou forçado
            const shouldUpdate = forceUpdate || 
              !existingNFT.marketplace?.listingId || 
              existingNFT.marketplace.listingId !== listing.id.toString();

            if (shouldUpdate) {
              const updateResult = await collection.updateOne(
                { _id: existingNFT._id },
                { 
                  $set: { 
                    // Corrigir tokenId se necessário
                    tokenId: listing.tokenId.toString(),
                    blockchainTokenId: listing.tokenId.toString(),
                    
                    // Dados completos do marketplace
                    marketplace: marketplaceData,
                    
                    // Timestamp de atualização
                    updatedAt: new Date()
                  } 
                }
              );

              if (updateResult.modifiedCount > 0) {
                console.log(`✅ Updated ${collectionName} NFT with listing data`);
                updated = true;
                
                syncResults.push({
                  collection: collectionName,
                  mongoId: existingNFT._id.toString(),
                  tokenId: listing.tokenId.toString(),
                  listingId: listing.id.toString(),
                  price: listing.pricePerToken.toString(),
                  action: 'updated'
                });
              }
            } else {
              console.log(`ℹ️ NFT already has correct listing data`);
              syncResults.push({
                collection: collectionName,
                mongoId: existingNFT._id.toString(),
                tokenId: listing.tokenId.toString(),
                listingId: listing.id.toString(),
                action: 'already_synced'
              });
            }
            
            break; // Found match, no need to check other filters
          }
        }
        
        if (updated) break; // Found and updated, no need to check other collections
      }

      if (!updated) {
        console.log('⚠️ No matching NFT found in MongoDB for listing:', {
          listingId: listing.id.toString(),
          tokenId: listing.tokenId.toString(),
          creator: listing.creatorAddress
        });
        
        syncResults.push({
          listingId: listing.id.toString(),
          tokenId: listing.tokenId.toString(),
          creator: listing.creatorAddress,
          action: 'no_match_found',
          issue: 'NFT not found in MongoDB'
        });
      }
    }

    return NextResponse.json({
      success: true,
      method: 'getAllValidListings',
      listingsFound: validListings.length,
      syncResults: syncResults,
      stats: {
        updated: syncResults.filter(r => r.action === 'updated').length,
        alreadySynced: syncResults.filter(r => r.action === 'already_synced').length,
        noMatchFound: syncResults.filter(r => r.action === 'no_match_found').length
      },
      contracts: {
        unique: Array.from(uniqueContracts),
        total: uniqueContracts.size
      },
      message: `Processed ${validListings.length} listings from ${uniqueContracts.size} contratos diferentes`
    });

  } catch (error) {
    console.error('❌ Official marketplace sync error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to sync marketplace using getAllValidListings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET handler para verificar status do sync
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');
    
    console.log('📊 Checking sync status...');
    
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    
    const stats: Record<string, any> = {};
    const collections = ['jerseys', 'stadiums', 'badges'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      const totalNFTs = await collection.countDocuments(
        userWallet ? { owner: userWallet.toLowerCase() } : {}
      );
      
      const mintedNFTs = await collection.countDocuments({
        'blockchain.transactionHash': { $exists: true },
        ...(userWallet && { owner: userWallet.toLowerCase() })
      });
      
      const listedNFTs = await collection.countDocuments({
        'marketplace.isListed': true,
        ...(userWallet && { owner: userWallet.toLowerCase() })
      });
      
      const syncedNFTs = await collection.countDocuments({
        'marketplace.lastSyncAt': { $exists: true },
        ...(userWallet && { owner: userWallet.toLowerCase() })
      });
      
      stats[collectionName] = {
        total: totalNFTs,
        minted: mintedNFTs,
        listed: listedNFTs,
        synced: syncedNFTs,
        needsSync: Math.max(0, mintedNFTs - syncedNFTs)
      };
    }
    
    return NextResponse.json({
      success: true,
      stats,
      userWallet,
      summary: {
        totalMinted: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.minted, 0),
        totalListed: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.listed, 0),
        totalSynced: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.synced, 0),
        needsSync: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.needsSync, 0)
      }
    });

  } catch (error) {
    console.error('❌ Sync status error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get sync status'
    }, { status: 500 });
  }
} 