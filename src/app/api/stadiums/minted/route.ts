import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'minted-stadiums'; // Separate collection for minted NFTs

/**
 * GET handler to fetch stadiums that were actually minted on blockchain
 * Uses separate 'minted-stadiums' collection for performance and clarity
 */
export async function GET(request: Request) {
  try {
    console.log('✅ GET Minted Stadiums - Fetching from minted-stadiums collection');
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const chainId = searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const mintedStadiums = db.collection(COLLECTION_NAME);

    // Simple filter - all NFTs in this collection were already minted
    const filter: any = {};

    // Filter by owner if specified
    if (owner) {
      filter['creator.wallet'] = owner;
    }
    
    console.log('🔍 Searching in collection:', COLLECTION_NAME);
    console.log('🔍 Applied filter:', JSON.stringify(filter, null, 2));

    // Collection statistics
    const totalMintedStadiums = await mintedStadiums.countDocuments({});
    const ownerMintedStadiums = owner ? await mintedStadiums.countDocuments(filter) : totalMintedStadiums;
    
    console.log('📊 MINTED STADIUMS STATS:');
    console.log(`Total minted stadiums: ${totalMintedStadiums}`);
    console.log(`Owner minted stadiums: ${ownerMintedStadiums}`);

    // Fetch minted NFTs
    const stadiums = await mintedStadiums
      .find(filter)
      .sort({ mintedAt: -1, createdAt: -1 }) // Sort by mint date
      .limit(50)
      .toArray();
      
    console.log(`✅ Found ${stadiums.length} minted stadiums`);

    // Process data to ensure consistency
    const processedStadiums = stadiums.map(stadium => ({
      ...stadium,
      // Ensure it has blockchain information
      blockchain: stadium.blockchain || {
        chainId: parseInt(chainId),
        contractAddress: chainId === '80002' 
          ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
          : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
        transactionHash: stadium.transactionHash,
        tokenId: stadium.tokenId || stadium.blockchain?.tokenId,
        explorerUrl: stadium.transactionHash 
          ? `https://amoy.polygonscan.com/tx/${stadium.transactionHash}`
          : null,
        network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain'
      },
      
      // Confirmed status (all in this collection were minted)
      mintStatus: 'confirmed',
      isMinted: true,
      status: 'Approved',
      
      // Marketplace metadata
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    }));

    // Detailed log for debugging
    if (processedStadiums.length > 0) {
      console.log('📋 Minted Stadium NFTs:');
      processedStadiums.forEach((stadium: any, index) => {
        console.log(`${index + 1}. ${stadium.name || 'Unnamed Stadium'} - Token: ${stadium.blockchain?.tokenId || 'N/A'} - TX: ${stadium.transactionHash?.slice(0, 10)}...`);
      });
    } else {
      console.log('⚠️ No minted stadiums found in minted-stadiums collection');
    }

    return NextResponse.json({
      success: true,
      total: processedStadiums.length,
      chainId: parseInt(chainId),
      network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
      data: processedStadiums,
      collection: COLLECTION_NAME,
      filters: {
        owner: owner || 'all',
        onlyMinted: true,
        separateCollection: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching minted stadiums:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch minted stadiums',
      details: error instanceof Error ? error.message : 'Unknown error',
      collection: COLLECTION_NAME
    }, { status: 500 });
  }
}

/**
 * POST handler para mover um stadium para a coleção de mintados
 * Chamado quando um NFT é mintado com sucesso
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stadiumId, transactionHash, tokenId, chainId = 80002 } = body;
    
    console.log('🔄 Movendo stadium para coleção de mintados:', {
      stadiumId,
      transactionHash,
      tokenId,
      chainId
    });

    if (!stadiumId || !transactionHash) {
      return NextResponse.json({ 
        success: false,
        error: 'stadiumId e transactionHash são obrigatórios'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const stadiumsCollection = db.collection('stadiums');
    const mintedStadiumsCollection = db.collection(COLLECTION_NAME);

    // Search for the original stadium
    const originalStadium = await stadiumsCollection.findOne({ _id: stadiumId });
    
    if (!originalStadium) {
      return NextResponse.json({ 
        success: false,
        error: 'Stadium não encontrado'
      }, { status: 404 });
    }

    // Create document for minted collection
    const mintedStadium = {
      ...originalStadium,
      // Mint information
      transactionHash,
      tokenId,
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      status: 'Approved',
      
      // Blockchain information
      blockchain: {
        chainId: parseInt(chainId),
        contractAddress: chainId === 80002 
          ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
          : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
        transactionHash,
        tokenId,
        explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`,
        network: chainId === 80002 ? 'Polygon Amoy' : 'CHZ Chain'
      }
    };

    // Insert into minted collection
    await mintedStadiumsCollection.insertOne(mintedStadium);

    // Optional: Mark as minted in original collection (for history)
    await stadiumsCollection.updateOne(
      { _id: stadiumId },
      { 
        $set: { 
          isMinted: true,
          mintedAt: new Date(),
          transactionHash,
          tokenId,
          mintStatus: 'confirmed'
        }
      }
    );

    console.log('✅ Stadium movido com sucesso para coleção de mintados');

    return NextResponse.json({
      success: true,
      message: 'Stadium movido para coleção de mintados com sucesso',
      data: {
        stadiumId,
        transactionHash,
        tokenId,
        collection: COLLECTION_NAME
      }
    });

  } catch (error) {
    console.error('❌ Error moving stadium to minted collection:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to move stadium to minted collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 