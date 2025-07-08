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

// GET user profile by wallet address
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ walletAddress: address })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate user stats
    const [jerseysCount, stadiumsCount, badgesCount] = await Promise.all([
      db.collection('jerseys').countDocuments({ creatorWallet: address }),
      db.collection('stadiums').countDocuments({ creatorWallet: address }),
      db.collection('badges').countDocuments({ creatorWallet: address })
    ])

    const userWithStats = {
      ...user,
      totalNFTs: jerseysCount + stadiumsCount + badgesCount,
      totalCreated: jerseysCount + stadiumsCount + badgesCount,
      // TODO: Add marketplace stats when marketplace is fully implemented
      totalSales: 0,
      totalPurchases: 0,
      balance: '0' // TODO: Get actual balance from blockchain
    }

    return NextResponse.json(userWithStats)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    console.log('🔄 PUT API called for address:', params.address)
    
    const { address } = params
    const body = await request.json()
    console.log('📥 Request body:', body)
    
    const { username, bio, avatar } = body

    if (!address) {
      console.log('❌ No address provided')
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    console.log('🔗 Connecting to database...')
    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    const updateData: any = {
      updatedAt: new Date()
    }

    if (username) updateData.username = username
    if (bio) updateData.bio = bio
    if (avatar) updateData.avatar = avatar

    console.log('📝 Update data:', updateData)

    console.log('🔄 Executing findOneAndUpdate...')
    
    // Check if user exists first
    const existingUser = await usersCollection.findOne({ walletAddress: address })
    
    let result
    if (existingUser) {
      // User exists - just update
      console.log('👤 User exists, updating...')
      result = await usersCollection.findOneAndUpdate(
        { walletAddress: address },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    } else {
      // User doesn't exist - create new
      console.log('➕ User doesn\'t exist, creating...')
      const newUserData = {
        walletAddress: address,
        createdAt: new Date(),
        updatedAt: new Date(),
        username: username || `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        avatar: avatar || '',
        bio: bio || '',
        isActive: true
      }
      
      result = await usersCollection.insertOne(newUserData)
      // For consistency with findOneAndUpdate, we'll fetch the created document
      result = await usersCollection.findOne({ walletAddress: address })
    }

    console.log('✅ Database operation completed')
    console.log('📄 Result:', result)

    // Extract the user data properly
    const userData = result?.value || result
    
    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('❌ Error updating user:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new user profile
export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const body = await request.json()
    const { username, bio } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ walletAddress: address })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const newUser = {
      walletAddress: address,
      username: username || `User ${address.slice(0, 6)}...${address.slice(-4)}`,
      bio: bio || '',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      settings: {
        emailNotifications: true,
        publicProfile: true,
        showWallet: false
      }
    }

    const result = await usersCollection.insertOne(newUser)

    return NextResponse.json({
      success: true,
      userId: result.insertedId,
      user: newUser,
      message: 'User profile created successfully'
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    const result = await usersCollection.deleteOne({ walletAddress: address })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User profile deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 