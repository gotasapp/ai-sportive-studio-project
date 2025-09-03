import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, getContractEvents } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { newListingEvent } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * API DEBUG para analisar eventos NewListing e verificar dados no MongoDB
 */
export async function POST(request: Request) {
  try {
    console.log('🔍 DEBUG: Analyzing NewListing events and MongoDB data...');
    
    const body = await request.json();
    const { 
      userWallet, 
      contractAddress = '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      marketplaceAddress = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d'
    } = body;

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: marketplaceAddress,
    });

    // 1. Buscar eventos NewListing
    console.log('🔍 1. Searching for NewListing events...');
    const events = await getContractEvents({
      contract: marketplaceContract,
      events: [
        newListingEvent({
          listingCreator: userWallet ? userWallet : undefined,
          assetContract: contractAddress,
        })
      ],
    });

    console.log(`📋 Found ${events.length} NewListing events`);

    // 2. Analisar cada evento
    const eventDetails: any[] = [];
    for (const event of events) {
      const { listingCreator, listingId, assetContract } = event.args;
      const listing = event.args.listing;
      
      const eventInfo = {
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber.toString(),
        listingId: listingId.toString(),
        tokenId: listing.tokenId.toString(),
        creator: listingCreator,
        assetContract: assetContract,
        price: listing.pricePerToken.toString(),
        currency: listing.currency,
        startTimestamp: listing.startTimestamp.toString(),
        endTimestamp: listing.endTimestamp.toString()
      };
      
      eventDetails.push(eventInfo);
      console.log('🎯 Event details:', eventInfo);
    }

    // 3. Verificar dados no MongoDB
    console.log('🔍 2. Checking MongoDB data...');
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    
    const mongoAnalysis: any[] = [];
    const collections = ['jerseys', 'stadiums', 'badges'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Buscar NFTs do usuário
      const userNFTs = await collection.find({
        owner: userWallet?.toLowerCase()
      }).toArray();
      
      console.log(`📦 ${collectionName}: Found ${userNFTs.length} NFTs for user`);
      
      for (const nft of userNFTs) {
        const nftInfo = {
          collection: collectionName,
          mongoId: nft._id.toString(),
          tokenId: nft.tokenId || 'MISSING',
          blockchainTokenId: nft.blockchainTokenId || 'MISSING',
          owner: nft.owner,
          transactionHash: nft.blockchain?.transactionHash || 'MISSING',
          chainId: nft.blockchain?.chainId || 'MISSING',
          isListed: nft.marketplace?.isListed || false,
          listingId: nft.marketplace?.listingId || 'MISSING'
        };
        
        mongoAnalysis.push(nftInfo);
        console.log('💾 MongoDB NFT:', nftInfo);
      }
    }

    // 4. Tentar fazer match manual
    console.log('🔍 3. Attempting manual matching...');
    const matches: any[] = [];
    
    for (const event of eventDetails) {
      const eventTokenId = event.tokenId;
      const eventCreator = event.creator.toLowerCase();
      
      for (const nft of mongoAnalysis) {
        const isTokenMatch = 
          nft.tokenId === eventTokenId || 
          nft.blockchainTokenId === eventTokenId;
        const isOwnerMatch = nft.owner === eventCreator;
        
        if (isTokenMatch && isOwnerMatch) {
          matches.push({
            event: {
              listingId: event.listingId,
              tokenId: event.tokenId,
              creator: event.creator
            },
            nft: {
              collection: nft.collection,
              mongoId: nft.mongoId,
              tokenId: nft.tokenId,
              blockchainTokenId: nft.blockchainTokenId
            },
            matchReason: 'tokenId + owner match'
          });
        }
      }
    }

    console.log(`🎯 Found ${matches.length} potential matches`);

    // 5. Diagnóstico de problemas
    const diagnosis = {
      eventsFound: events.length,
      nftsInMongo: mongoAnalysis.length,
      potentialMatches: matches.length,
      issues: [] as string[]
    };

    // Verificar problemas comuns
    if (events.length > 0 && mongoAnalysis.length > 0 && matches.length === 0) {
      diagnosis.issues.push('No matches found between events and MongoDB NFTs');
      
      // Verificar se tokenIds estão corretos
      const eventTokenIds = eventDetails.map(e => e.tokenId);
      const mongoTokenIds = mongoAnalysis.map(n => n.tokenId).filter(t => t !== 'MISSING');
      const mongoBlockchainTokenIds = mongoAnalysis.map(n => n.blockchainTokenId).filter(t => t !== 'MISSING');
      
      diagnosis.issues.push(`Event tokenIds: [${eventTokenIds.join(', ')}]`);
      diagnosis.issues.push(`MongoDB tokenIds: [${mongoTokenIds.join(', ')}]`);
      diagnosis.issues.push(`MongoDB blockchainTokenIds: [${mongoBlockchainTokenIds.join(', ')}]`);
      
      // Verificar owners
      const eventCreators = eventDetails.map(e => e.creator.toLowerCase());
      const mongoOwners = mongoAnalysis.map(n => n.owner);
      
      diagnosis.issues.push(`Event creators: [${eventCreators.join(', ')}]`);
      diagnosis.issues.push(`MongoDB owners: [${mongoOwners.join(', ')}]`);
    }

    return NextResponse.json({
      success: true,
      debug: {
        events: eventDetails,
        mongoNFTs: mongoAnalysis,
        matches: matches,
        diagnosis: diagnosis
      },
      summary: {
        eventsFound: events.length,
        nftsInMongo: mongoAnalysis.length,
        matchesFound: matches.length,
        collections: Object.fromEntries(
          collections.map(name => [
            name, 
            mongoAnalysis.filter(n => n.collection === name).length
          ])
        )
      }
    });

  } catch (error) {
    console.error('❌ Debug listings error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to debug marketplace listings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 