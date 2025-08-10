import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const MARKETPLACE_CONTRACT_ADDRESS = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

/**
 * 🧹 LIMPAR E SINCRONIZAR: Remove dados antigos do marketplace e sincroniza APENAS com blockchain
 */
export async function POST(request: Request) {
  try {
    console.log('🧹 CLEAR AND SYNC: Iniciando limpeza e sincronização...');
    
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    // 1. BUSCAR DADOS REAIS DA BLOCKCHAIN
    console.log('🔍 Buscando dados REAIS da blockchain...');
    const [validListings, validAuctions] = await Promise.all([
      getAllValidListings({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(500),
      }),
      getAllAuctions({
        contract: marketplaceContract,
        start: 0,
        count: BigInt(500),
      })
    ]);

    console.log(`📊 Dados reais da blockchain:`, {
      listings: validListings.length,
      auctions: validAuctions.length,
      total: validListings.length + validAuctions.length
    });

    // 2. CONECTAR MONGODB
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    
    // 3. LIMPAR DADOS ANTIGOS DO MARKETPLACE EM TODAS AS COLEÇÕES
    console.log('🧹 Limpando dados antigos do marketplace...');
    
    const collections = ['jerseys', 'stadiums', 'badges', 'custom_collection_mints'];
    let cleanedItems = 0;
    
    for (const collectionName of collections) {
      const result = await db.collection(collectionName).updateMany(
        {},
        {
          $unset: {
            'marketplace.isListed': '',
            'marketplace.listingId': '',
            'marketplace.price': '',
            'marketplace.priceFormatted': '',
            'marketplace.thirdwebData': '',
            'marketplace.thirdwebAuctionData': '',
            'marketplace.isAuction': '',
            'marketplace.auctionId': '',
            'marketplace.currentBid': '',
            'marketplace.endTime': ''
          }
        }
      );
      cleanedItems += result.modifiedCount;
      console.log(`✅ Limpou ${result.modifiedCount} itens de ${collectionName}`);
    }

    // 4. APLICAR APENAS DADOS REAIS DA BLOCKCHAIN
    console.log('🔄 Aplicando dados reais da blockchain...');
    
    let updatedListings = 0;
    let updatedAuctions = 0;

    // Aplicar LISTINGS reais
    for (const listing of validListings) {
      const tokenId = listing.tokenId.toString();
      const contractAddress = listing.assetContractAddress.toLowerCase();
      
      console.log(`📝 Aplicando listing real: ${contractAddress}:${tokenId}`);
      
      // Tentar encontrar NFT em todas as coleções
      for (const collectionName of collections) {
        const updateResult = await db.collection(collectionName).updateMany(
          {
            tokenId: tokenId,
            contractAddress: contractAddress
          },
          {
            $set: {
              'marketplace.isListed': true,
              'marketplace.listingId': listing.id.toString(),
              'marketplace.price': listing.currencyValuePerToken?.displayValue || listing.pricePerToken?.toString(),
              'marketplace.priceFormatted': `${listing.currencyValuePerToken?.displayValue || listing.pricePerToken?.toString()} MATIC`,
              'marketplace.thirdwebData': {
                listingId: listing.id.toString(),
                price: listing.pricePerToken?.toString(),
                currency: listing.currencyValuePerToken?.symbol || 'MATIC',
                endTime: listing.endTimeInSeconds ? listing.endTimeInSeconds.toString() : null
              },
              'marketplace.updatedAt': new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          updatedListings++;
          console.log(`✅ Aplicou listing em ${collectionName}: ${tokenId}`);
          break; // Encontrou e atualizou, sair do loop
        }
      }
    }

    // Aplicar AUCTIONS reais
    for (const auction of validAuctions) {
      const auctionData = auction as any; // Cast para any para flexibilidade de tipos
      const tokenId = auction.tokenId.toString();
      const contractAddress = auction.assetContractAddress.toLowerCase();
      
      console.log(`🏆 Aplicando auction real: ${contractAddress}:${tokenId}`);
      
      // Tentar encontrar NFT em todas as coleções
      for (const collectionName of collections) {
        const updateResult = await db.collection(collectionName).updateMany(
          {
            tokenId: tokenId,
            contractAddress: contractAddress
          },
          {
            $set: {
              'marketplace.isAuction': true,
              'marketplace.auctionId': auction.id?.toString(),
              'marketplace.currentBid': auction.minimumBidAmount?.toString(),
              'marketplace.price': `${auction.minimumBidAmount?.toString()} (Bid)`,
              'marketplace.priceFormatted': `${auction.minimumBidAmount?.toString()} MATIC (Bid)`,
              'marketplace.endTime': auctionData.endTimestamp ? new Date(Number(auctionData.endTimestamp) * 1000) : null,
              'marketplace.thirdwebAuctionData': {
                auctionId: auction.id?.toString(),
                minimumBidAmount: auction.minimumBidAmount?.toString(),
                buyoutBidAmount: auction.buyoutBidAmount?.toString(),
                currency: auction.currencyContractAddress || 'MATIC',
                endTime: auctionData.endTimestamp ? auctionData.endTimestamp.toString() : null,
                startTime: auctionData.startTimestamp ? auctionData.startTimestamp.toString() : null
              },
              'marketplace.updatedAt': new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          updatedAuctions++;
          console.log(`✅ Aplicou auction em ${collectionName}: ${tokenId}`);
          break; // Encontrou e atualizou, sair do loop
        }
      }
    }

    const stats = {
      cleanedItems,
      updatedListings,
      updatedAuctions,
      totalBlockchainData: validListings.length + validAuctions.length
    };

    console.log('🎉 CLEAR AND SYNC COMPLETO:', stats);

    return NextResponse.json({
      success: true,
      message: 'Limpeza e sincronização completa!',
      stats,
      blockchainData: {
        listings: validListings.length,
        auctions: validAuctions.length
      }
    });

  } catch (error) {
    console.error('❌ Erro no clear and sync:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}