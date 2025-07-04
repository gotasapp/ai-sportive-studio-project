import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'stadiums';

export async function POST(request: NextRequest) {
  console.log('🏟️ Stadium API: POST request received')
  
  try {
    const body = await request.json()
    console.log('📝 Stadium data received:', { 
      name: body.name, 
      imageUrl: body.imageUrl ? 'URL provided' : 'No URL',
      creatorWallet: body.creatorWallet,
      tags: body.tags 
    })

    // Conectar ao MongoDB usando a mesma configuração das jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Inserir o stadium
    const stadiumDoc = {
      name: body.name,
      prompt: body.prompt,
      imageUrl: body.imageUrl,
      cloudinaryPublicId: body.cloudinaryPublicId,
      creatorWallet: body.creatorWallet,
      tags: body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('💾 Inserting stadium in MongoDB...')
    const result = await collection.insertOne(stadiumDoc)
    console.log('✅ Stadium inserted successfully:', result.insertedId)

    return NextResponse.json({ 
      success: true, 
      stadiumId: result.insertedId.toString(),
      message: 'Stadium saved successfully'
    })

  } catch (error: any) {
    console.error('❌ Stadium API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save stadium' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Conectar ao MongoDB usando a mesma configuração das jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Buscar stadiums (ordenados por data de criação, mais recentes primeiro)
    const stadiums = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(50) // Limitar a 50 mais recentes
      .toArray()

    console.log(`✅ Found ${stadiums.length} stadiums`)

    return NextResponse.json(stadiums)

  } catch (error: any) {
    console.error('❌ Error fetching stadiums:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stadiums' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request received for stadiums collection')
    
    // Conectar ao MongoDB usando a mesma configuração das jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Deletar todos os stadiums
    const result = await collection.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} stadiums`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} stadiums`
    })

  } catch (error: any) {
    console.error('❌ Error deleting stadiums:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete stadiums' },
      { status: 500 }
    )
  }
} 