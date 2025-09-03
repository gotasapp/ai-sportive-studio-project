import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFT } from 'thirdweb/extensions/erc721';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db';
const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    
    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId parameter required' }, { status: 400 });
    }

    console.log(`🔍 Debug: Investigating NFT token ID ${tokenId}`);

    // 1. Check blockchain data
    let blockchainData = null;
    try {
      const nftContract = getContract({
        client,
        chain: polygonAmoy,
        address: NFT_CONTRACT_ADDRESS,
      });

      blockchainData = await getNFT({
        contract: nftContract,
        tokenId: BigInt(tokenId)
      });

      console.log(`📊 Blockchain data for token ${tokenId}:`, {
        id: blockchainData.id,
        metadata: blockchainData.metadata,
        hasImage: !!blockchainData.metadata?.image
      });
    } catch (error) {
      console.log(`❌ Blockchain fetch failed for token ${tokenId}:`, error);
    }

    // 2. Check MongoDB data
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db(DB_NAME);
    
    const collections = ['jerseys', 'stadiums', 'badges'];
    let mongoData = null;
    let foundInCollection = null;

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Try different ways to find the NFT
      const searches = [
        { tokenId: parseInt(tokenId) },
        { tokenId: tokenId },
        { blockchainTokenId: parseInt(tokenId) },
        { blockchainTokenId: tokenId },
        { 'blockchain.tokenId': tokenId },
        { 'blockchain.tokenId': parseInt(tokenId) }
      ];

      for (const searchQuery of searches) {
        const found = await collection.findOne(searchQuery);
        if (found) {
          mongoData = found;
          foundInCollection = collectionName;
          console.log(`📦 Found in MongoDB collection: ${collectionName}, query:`, searchQuery);
          break;
        }
      }

      if (mongoData) break;
    }

    // 3. Compare and analyze
    const analysis = {
      tokenId,
      blockchain: {
        found: !!blockchainData,
        name: blockchainData?.metadata?.name || null,
        image: blockchainData?.metadata?.image || null,
        description: blockchainData?.metadata?.description || null,
        attributes: blockchainData?.metadata?.attributes || []
      },
      mongodb: {
        found: !!mongoData,
        collection: foundInCollection,
        name: (mongoData as any)?.name || null,
        imageUrl: (mongoData as any)?.imageUrl || (mongoData as any)?.image || null,
        status: (mongoData as any)?.status || null,
        transactionHash: (mongoData as any)?.transactionHash || null,
        tokenIdField: (mongoData as any)?.tokenId || null,
        blockchainTokenId: (mongoData as any)?.blockchainTokenId || null
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on findings
    if (!blockchainData) {
      analysis.recommendations.push("NFT not found on blockchain - might not be minted yet");
    }

    if (!mongoData) {
      analysis.recommendations.push("NFT not found in MongoDB - metadata might be missing");
    }

    if (blockchainData && mongoData) {
      if (!blockchainData.metadata?.image && mongoData.imageUrl) {
        analysis.recommendations.push("Blockchain metadata missing image, but MongoDB has imageUrl - update blockchain metadata");
      }
      
      if (blockchainData.metadata?.image && !mongoData.imageUrl) {
        analysis.recommendations.push("MongoDB missing imageUrl, but blockchain has image - sync MongoDB data");
      }
      
      if (!blockchainData.metadata?.image && !mongoData.imageUrl) {
        analysis.recommendations.push("Both blockchain and MongoDB missing image - NFT needs proper metadata");
      }
    }

    if (blockchainData && !mongoData) {
      analysis.recommendations.push("NFT exists on blockchain but not in MongoDB - run sync process");
    }

    if (!blockchainData && mongoData) {
      analysis.recommendations.push("NFT exists in MongoDB but not on blockchain - check if mint was successful");
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 