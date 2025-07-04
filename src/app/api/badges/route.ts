import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!

let clientPromise: Promise<MongoClient>

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise

export async function POST(request: NextRequest) {
  console.log('🏆 Badge API: POST request received')
  
  try {
    const body = await request.json()
    console.log('📝 Badge data received:', { 
      name: body.name, 
      imageUrl: body.imageUrl ? 'URL provided' : 'No URL',
      creatorWallet: body.creatorWallet,
      tags: body.tags 
    })

    // Conectar ao MongoDB
    const client = await clientPromise
    const db = client.db(dbName)
    const collection = db.collection('badges')

    // Inserir o badge
    const badgeDoc = {
      name: body.name,
      prompt: body.prompt,
      imageUrl: body.imageUrl,
      cloudinaryPublicId: body.cloudinaryPublicId,
      creatorWallet: body.creatorWallet,
      tags: body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('💾 Inserting badge in MongoDB...')
    const result = await collection.insertOne(badgeDoc)
    console.log('✅ Badge inserted successfully:', result.insertedId)

    return NextResponse.json({ 
      success: true, 
      badgeId: result.insertedId.toString(),
      message: 'Badge saved successfully'
    })

  } catch (error: any) {
    console.error('❌ Badge API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save badge' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Conectar ao MongoDB
    const client = await clientPromise
    const db = client.db(dbName)
    const collection = db.collection('badges')

    // Buscar badges (ordenados por data de criação, mais recentes primeiro)
    const badges = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(50) // Limitar a 50 mais recentes
      .toArray()

    console.log(`✅ Found ${badges.length} badges`)

    return NextResponse.json(badges)

  } catch (error: any) {
    console.error('❌ Error fetching badges:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request received for badges collection')
    
    // Conectar ao MongoDB
    const client = await clientPromise
    const db = client.db(dbName)
    const collection = db.collection('badges')

    // Deletar todos os badges
    const result = await collection.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} badges`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} badges`
    })

  } catch (error: any) {
    console.error('❌ Error deleting badges:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete badges' },
      { status: 500 }
    )
  }
} 