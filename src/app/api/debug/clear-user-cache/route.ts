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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    if (!userAddress) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    console.log('🗑️ Clearing cache for user:', userAddress);

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const cacheCollection = db.collection('nft_cache');

    // Limpar cache específico do usuário
    const cacheKey = `user_nfts_${userAddress.toLowerCase()}`;
    const result = await cacheCollection.deleteOne({ key: cacheKey });

    console.log(`✅ Cache cleared for ${userAddress}, deleted: ${result.deletedCount} documents`);

    return NextResponse.json({
      success: true,
      message: `Cache cleared for user ${userAddress}`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const cacheCollection = db.collection('nft_cache');

    if (userAddress) {
      // Verificar cache específico do usuário
      const cacheKey = `user_nfts_${userAddress.toLowerCase()}`;
      const cached = await cacheCollection.findOne({ key: cacheKey });
      
      return NextResponse.json({
        success: true,
        userAddress,
        cacheExists: !!cached,
        cacheData: cached ? {
          createdAt: cached.createdAt,
          expiresAt: cached.expiresAt,
          isExpired: cached.expiresAt < new Date(),
          totalNFTs: cached.data?.totalNFTs || 0
        } : null
      });
    } else {
      // Listar todos os caches
      const allCaches = await cacheCollection.find({}).toArray();
      
      return NextResponse.json({
        success: true,
        totalCaches: allCaches.length,
        caches: allCaches.map(cache => ({
          key: cache.key,
          createdAt: cache.createdAt,
          expiresAt: cache.expiresAt,
          isExpired: cache.expiresAt < new Date(),
          totalNFTs: cache.data?.totalNFTs || 0
        }))
      });
    }

  } catch (error) {
    console.error('❌ Error checking cache:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 