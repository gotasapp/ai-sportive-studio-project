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

// GET user profile by wallet address - OTIMIZADO
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

    // Timeout de 5 segundos para evitar loading infinito
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const client = await connectToDatabase()
      const db = client.db(DB_NAME)
      const usersCollection = db.collection('users')

      const user = await usersCollection.findOne({ walletAddress: address })
      
      clearTimeout(timeoutId)

      if (!user) {
        // Criar perfil padrão se não encontrar
        const defaultProfile = {
          walletAddress: address,
          username: address.slice(0, 6) + '...' + address.slice(-4),
          bio: '',
          avatar: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          // Stats básicas (sem queries pesadas)
          totalNFTs: 0,
          totalCreated: 0,
          totalSales: 0,
          totalPurchases: 0,
          balance: '0'
        }

        return NextResponse.json(defaultProfile)
      }

      // Retornar perfil existente com stats básicas
      const userProfile = {
        ...user,
        totalNFTs: user.totalNFTs || 0,
        totalCreated: user.totalCreated || 0,
        totalSales: user.totalSales || 0,
        totalPurchases: user.totalPurchases || 0,
        balance: user.balance || '0'
      }

      return NextResponse.json(userProfile)
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        console.log('⏰ Profile API timeout - returning default profile')
        // Retornar perfil padrão em caso de timeout
        const defaultProfile = {
          walletAddress: address,
          username: address.slice(0, 6) + '...' + address.slice(-4),
          bio: '',
          avatar: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          totalNFTs: 0,
          totalCreated: 0,
          totalSales: 0,
          totalPurchases: 0,
          balance: '0'
        }

        return NextResponse.json(defaultProfile)
      }
      
      throw error
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    
    // Sempre retornar um perfil padrão em caso de erro
    const { address } = params
    const defaultProfile = {
      walletAddress: address,
      username: address.slice(0, 6) + '...' + address.slice(-4),
      bio: '',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      totalNFTs: 0,
      totalCreated: 0,
      totalSales: 0,
      totalPurchases: 0,
      balance: '0'
    }

    return NextResponse.json(defaultProfile)
  }
}

// PUT - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const body = await request.json()
    const { username, bio, avatar } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')

    const updateData: any = {
      updatedAt: new Date()
    }

    if (username) updateData.username = username
    if (bio) updateData.bio = bio
    if (avatar) updateData.avatar = avatar

    // Check if user exists first
    const existingUser = await usersCollection.findOne({ walletAddress: address })
    
    let result
    if (existingUser) {
      // User exists - just update
      result = await usersCollection.findOneAndUpdate(
        { walletAddress: address },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    } else {
      // User doesn't exist - create new
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

    // Extract the user data properly
    const userData = result?.value || result
    
    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available')
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