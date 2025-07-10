import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db'

let cachedClient: MongoClient | null = null

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  cachedClient = client
  return client
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      address: address || 'not provided',
      mongoUri: MONGODB_URI ? 'configured' : 'missing',
      dbName: DB_NAME,
      thirdwebClientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ? 'configured' : 'missing',
      marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET ? 'configured' : 'missing',
      nftContract: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET ? 'configured' : 'missing',
    }

    // Test database connection
    try {
      const client = await connectToDatabase()
      const db = client.db(DB_NAME)
      
      // Test collections
      const collections = await db.listCollections().toArray()
      debugInfo.database = {
        status: 'connected',
        collections: collections.map(col => col.name),
        collectionsCount: collections.length
      }

      // If address provided, test user lookup
      if (address) {
        const usersCollection = db.collection('users')
        const user = await usersCollection.findOne({ walletAddress: address })
        
        debugInfo.userLookup = {
          found: !!user,
          data: user ? {
            username: user.username,
            createdAt: user.createdAt,
            hasAvatar: !!user.avatar
          } : null
        }

        // Test NFT collections
        const [jerseysCount, stadiumsCount, badgesCount] = await Promise.all([
          db.collection('jerseys').countDocuments({ creatorWallet: address }),
          db.collection('stadiums').countDocuments({ creatorWallet: address }),
          db.collection('badges').countDocuments({ creatorWallet: address })
        ])

        debugInfo.nftStats = {
          jerseys: jerseysCount,
          stadiums: stadiumsCount,
          badges: badgesCount,
          total: jerseysCount + stadiumsCount + badgesCount
        }
      }

    } catch (dbError) {
      debugInfo.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({
      error: 'Debug API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 