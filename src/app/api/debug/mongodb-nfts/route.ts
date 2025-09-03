import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    console.log('🔍 Debug: Checking MongoDB NFTs for user:', userAddress);

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    
    // Buscar todas as NFTs em todas as coleções
    const [jerseys, stadiums, badges] = await Promise.all([
      db.collection('jerseys').find({}).toArray(),
      db.collection('stadiums').find({}).toArray(),
      db.collection('badges').find({}).toArray()
    ]);

    const allNFTs = [
      ...jerseys.map(j => ({ ...j, collection: 'jerseys' })),
      ...stadiums.map(s => ({ ...s, collection: 'stadiums' })),
      ...badges.map(b => ({ ...b, collection: 'badges' }))
    ];

    console.log(`📊 Total NFTs in MongoDB: ${allNFTs.length}`);

    // Filtrar NFTs mintadas
    const mintedNFTs = allNFTs.filter((nft: any) => 
      nft.status === 'minted' || 
      nft.status === 'Approved' ||
      nft.isMinted ||
      nft.transactionHash ||
      nft.tokenId
    );

    console.log(`📊 Minted NFTs: ${mintedNFTs.length}`);

    // Se foi especificado um usuário, filtrar por ele
    let userNFTs = mintedNFTs;
    if (userAddress) {
      userNFTs = mintedNFTs.filter((nft: any) => 
        nft.ownerAddress?.toLowerCase() === userAddress.toLowerCase() ||
        nft.creator?.wallet?.toLowerCase() === userAddress.toLowerCase() ||
        nft.creatorWallet?.toLowerCase() === userAddress.toLowerCase()
      );
      console.log(`📊 User NFTs: ${userNFTs.length}`);
    }

    // Preparar dados para visualização
    const debugData = {
      summary: {
        totalNFTs: allNFTs.length,
        mintedNFTs: mintedNFTs.length,
        userNFTs: userAddress ? userNFTs.length : null,
        byCollection: {
          jerseys: jerseys.length,
          stadiums: stadiums.length,
          badges: badges.length
        },
        mintedByCollection: {
          jerseys: mintedNFTs.filter(n => n.collection === 'jerseys').length,
          stadiums: mintedNFTs.filter(n => n.collection === 'stadiums').length,
          badges: mintedNFTs.filter(n => n.collection === 'badges').length
        }
      },
      nfts: (userAddress ? userNFTs : mintedNFTs).slice(0, 10).map((nft: any) => ({
        id: nft._id?.toString(),
        name: nft.name,
        collection: nft.collection,
        tokenId: nft.tokenId,
        status: nft.status,
        isMinted: nft.isMinted,
        transactionHash: nft.transactionHash?.slice(0, 10) + (nft.transactionHash ? '...' : ''),
        imageUrl: nft.imageUrl || nft.image,
        ownerAddress: nft.ownerAddress,
        creatorWallet: nft.creator?.wallet || nft.creatorWallet,
        createdAt: nft.createdAt
      })),
      userFilters: userAddress ? {
        address: userAddress,
        foundByOwnerAddress: mintedNFTs.filter((n: any) => n.ownerAddress?.toLowerCase() === userAddress.toLowerCase()).length,
        foundByCreatorWallet: mintedNFTs.filter((n: any) => n.creator?.wallet?.toLowerCase() === userAddress.toLowerCase()).length,
        foundByCreatorField: mintedNFTs.filter((n: any) => n.creatorWallet?.toLowerCase() === userAddress.toLowerCase()).length
      } : null
    };

    return NextResponse.json({
      success: true,
      data: debugData
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 