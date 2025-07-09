import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, getContractEvents } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { newListingEvent } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * API para monitorar eventos NewListing do Marketplace V3
 * Atualiza MongoDB automaticamente quando NFTs são listados
 */
export async function POST(request: Request) {
  try {
    console.log('🏪 Marketplace Monitor: Checking for new listings...');
    
    const body = await request.json();
    const { 
      userWallet, 
      contractAddress = '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      marketplaceAddress = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
      fromBlock = 'latest' 
    } = body;

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: marketplaceAddress,
    });

    console.log('🔍 Searching for NewListing events...');

    // Buscar eventos NewListing recentes
    const events = await getContractEvents({
      contract: marketplaceContract,
      events: [
        newListingEvent({
          listingCreator: userWallet ? userWallet : undefined,
          assetContract: contractAddress,
        })
      ],
      fromBlock: fromBlock === 'latest' ? undefined : BigInt(fromBlock),
    });

    console.log(`📋 Found ${events.length} NewListing events`);

    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    const updatedNFTs = [];

    for (const event of events) {
      const { listingCreator, listingId, assetContract } = event.args;
      const listing = event.args.listing;
      
      console.log('🎯 Processing listing:', {
        listingId: listingId.toString(),
        tokenId: listing.tokenId.toString(),
        creator: listingCreator,
        price: listing.pricePerToken.toString()
      });

      // Identificar qual coleção (jerseys, stadiums, badges)
      const collections = ['jerseys', 'stadiums', 'badges'];
      let updatedCount = 0;

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        
        // Buscar NFT pelo tokenId e owner
        const filter = {
          $and: [
            { 
              $or: [
                { tokenId: listing.tokenId.toString() },
                { blockchainTokenId: listing.tokenId.toString() }
              ]
            },
            { owner: listingCreator.toLowerCase() },
            { 'blockchain.chainId': 80002 }
          ]
        };

        const updateData = {
          $set: {
            // Dados do marketplace
            'marketplace.isListed': true,
            'marketplace.listingId': listingId.toString(),
            'marketplace.price': listing.pricePerToken.toString(),
            'marketplace.currency': listing.currency,
            'marketplace.listedAt': new Date(),
            'marketplace.endTimestamp': new Date(Number(listing.endTimestamp) * 1000),
            
            // TokenId correto da blockchain
            tokenId: listing.tokenId.toString(),
            blockchainTokenId: listing.tokenId.toString(),
            
            // Metadados do evento
            'marketplace.listingEvent': {
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber.toString(),
              logIndex: event.logIndex,
              eventName: 'NewListing'
            },
            
            updatedAt: new Date()
          }
        };

        const result = await collection.updateMany(filter, updateData);
        updatedCount += result.modifiedCount;

        if (result.modifiedCount > 0) {
          console.log(`✅ Updated ${result.modifiedCount} ${collectionName} with listing data`);
          
          updatedNFTs.push({
            collection: collectionName,
            tokenId: listing.tokenId.toString(),
            listingId: listingId.toString(),
            price: listing.pricePerToken.toString(),
            modified: result.modifiedCount
          });
        }
      }

      if (updatedCount === 0) {
        console.log('⚠️ No matching NFT found for listing:', {
          tokenId: listing.tokenId.toString(),
          creator: listingCreator
        });
      }
    }

    return NextResponse.json({
      success: true,
      eventsFound: events.length,
      nftsUpdated: updatedNFTs.length,
      details: updatedNFTs,
      message: `Processed ${events.length} listing events, updated ${updatedNFTs.length} NFTs`
    });

  } catch (error) {
    console.error('❌ Marketplace monitor error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to monitor marketplace listings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET handler para verificar status de monitoramento
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');
    
    console.log('📊 Marketplace Monitor: Getting status...');
    
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    
    // Contar NFTs listados por coleção
    const stats = {};
    const collections = ['jerseys', 'stadiums', 'badges'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      const listedCount = await collection.countDocuments({
        'marketplace.isListed': true,
        ...(userWallet && { owner: userWallet.toLowerCase() })
      });
      
      const totalMinted = await collection.countDocuments({
        'blockchain.transactionHash': { $exists: true },
        ...(userWallet && { owner: userWallet.toLowerCase() })
      });
      
      stats[collectionName] = {
        listed: listedCount,
        minted: totalMinted,
        unlisted: Math.max(0, totalMinted - listedCount)
      };
    }
    
    return NextResponse.json({
      success: true,
      stats,
      userWallet,
      totalListed: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.listed, 0),
      totalMinted: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.minted, 0)
    });

  } catch (error) {
    console.error('❌ Marketplace status error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get marketplace status'
    }, { status: 500 });
  }
} 