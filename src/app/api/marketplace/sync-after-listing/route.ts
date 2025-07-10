import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getListing } from 'thirdweb/extensions/marketplace';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * API para sincronizar dados do MongoDB após uma listagem bem-sucedida
 * Atualiza o NFT específico com os dados reais da blockchain
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Sync After Listing: Starting synchronization...');
    
    const body = await request.json();
    const { 
      transactionHash,
      tokenId,
      assetContract,
      userWallet,
      listingId,
      pricePerToken
    } = body;

    if (!transactionHash || !tokenId || !assetContract || !userWallet) {
      return NextResponse.json({ 
        error: 'Missing required parameters: transactionHash, tokenId, assetContract, userWallet' 
      }, { status: 400 });
    }

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
    });

    // 1. Descobrir listingId se não foi fornecido
    let actualListingId = listingId;
    if (!actualListingId) {
      console.log('🔍 ListingId not provided, using placeholder (discoverListingId temporarily disabled)');
      // TODO: Re-enable discoverListingId method after deploy works
      // actualListingId = await MarketplaceService.discoverListingId(80002, transactionHash);
      actualListingId = 'pending-discovery';
    }

    // 2. Buscar dados reais da listagem se listingId foi descoberto
    let realListingData = null;
    if (actualListingId && actualListingId !== 'pending-discovery') {
      try {
        realListingData = await getListing({
          contract: marketplaceContract,
          listingId: BigInt(actualListingId),
        });
        console.log('✅ Real listing data found:', {
          listingId: realListingData.id.toString(),
          price: realListingData.pricePerToken.toString(),
          status: realListingData.status
        });
      } catch (error) {
        console.log('⚠️ Could not fetch real listing data, using provided data');
      }
    }

    // 3. Conectar ao MongoDB
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);

    // 4. Determinar qual coleção usar baseado no assetContract
    const collections = ['jerseys', 'stadiums', 'badges'];
    let updatedNFT = null;
    let collectionUsed = null;

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Buscar NFT por múltiplos critérios
      const filters = [
        { tokenId: tokenId, 'creator.wallet': userWallet },
        { tokenId: tokenId, creatorWallet: userWallet },
        { _id: tokenId, 'creator.wallet': userWallet },
        { _id: tokenId, creatorWallet: userWallet },
        // Buscar por transactionHash se disponível
        { transactionHash: transactionHash },
        // Buscar o mais recente do usuário se nada mais funcionar
        { 'creator.wallet': userWallet },
        { creatorWallet: userWallet }
      ];

      for (const filter of filters) {
        const existingNFT = await collection.findOne(filter, { sort: { createdAt: -1 } });
        
        if (existingNFT) {
          console.log(`✅ Found NFT in ${collectionName}:`, {
            mongoId: existingNFT._id.toString(),
            name: existingNFT.name,
            currentTokenId: existingNFT.tokenId || 'MISSING',
            currentListingStatus: existingNFT.marketplace?.isListed || false
          });

          // Preparar dados de atualização
          const updateData = {
            $set: {
              // Dados da blockchain
              tokenId: tokenId,
              blockchainTokenId: tokenId,
              transactionHash: transactionHash,
              
              // Dados do marketplace
              'marketplace.isListed': true,
              'marketplace.listingId': actualListingId,
              'marketplace.price': realListingData ? realListingData.pricePerToken.toString() : pricePerToken,
              'marketplace.priceFormatted': realListingData ? 
                `${(Number(realListingData.pricePerToken) / Math.pow(10, 18)).toFixed(6)} MATIC` :
                `${pricePerToken} MATIC`,
              'marketplace.currency': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // MATIC nativo
              'marketplace.currencySymbol': 'MATIC',
              'marketplace.listedAt': new Date(),
              'marketplace.status': realListingData ? realListingData.status : 'CREATED',
              'marketplace.type': 'direct',
              'marketplace.creator': userWallet,
              'marketplace.isListable': true,
              'marketplace.canTrade': true,
              'marketplace.verified': true,
              
              // Metadados da sincronização
              'marketplace.lastSyncAt': new Date(),
              'marketplace.syncMethod': 'sync-after-listing',
              'marketplace.thirdwebData': realListingData ? {
                id: realListingData.id.toString(),
                tokenId: realListingData.tokenId.toString(),
                assetContract: realListingData.assetContractAddress,
                pricePerToken: realListingData.pricePerToken.toString()
              } : null,
              
              // Timestamp de atualização
              updatedAt: new Date()
            }
          };

          // Atualizar NFT
          const updateResult = await collection.updateOne(
            { _id: existingNFT._id },
            updateData
          );

          if (updateResult.modifiedCount > 0) {
            console.log(`✅ Successfully updated ${collectionName} NFT with listing data`);
            
            // Buscar NFT atualizado
            updatedNFT = await collection.findOne({ _id: existingNFT._id });
            collectionUsed = collectionName;
            
            return NextResponse.json({
              success: true,
              message: 'NFT updated with listing data',
              nft: {
                id: updatedNFT!._id.toString(),
                name: updatedNFT!.name,
                tokenId: updatedNFT!.tokenId,
                collection: collectionUsed,
                isListed: true,
                listingId: actualListingId,
                transactionHash: transactionHash,
                marketplace: updatedNFT!.marketplace
              }
            });
          }
        }
      }
    }

    // Se chegou aqui, não encontrou o NFT
    console.log('⚠️ NFT not found in any collection for update:', {
      tokenId,
      userWallet,
      transactionHash,
      assetContract
    });

    return NextResponse.json({
      success: false,
      error: 'NFT not found for update',
      searched: {
        tokenId,
        userWallet,
        transactionHash,
        assetContract,
        collections: collections
      }
    }, { status: 404 });

  } catch (error: any) {
    console.error('❌ Sync After Listing Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync after listing',
      details: error?.message || error
    }, { status: 500 });
  }
} 