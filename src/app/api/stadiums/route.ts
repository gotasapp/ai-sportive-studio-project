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

    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Check moderation configuration
    let status = 'Approved'; // Default
    try {
      const settingsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/settings/moderation`);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        status = settings.moderationEnabled ? 'Pending' : 'Approved';
        console.log(`📋 Stadium moderation setting: ${settings.moderationEnabled ? 'ON' : 'OFF'}, status: ${status}`);
      }
    } catch (settingError) {
      console.log('⚠️ Could not fetch moderation settings, using default (Approved)');
    }

    // Insert the stadium
    const stadiumDoc = {
      name: body.name,
      prompt: body.prompt,
      imageUrl: body.imageUrl,
      cloudinaryPublicId: body.cloudinaryPublicId,
      creatorWallet: body.creatorWallet,
      tags: body.tags || [],
      status: status, // Based on moderation configuration
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
              { error: error instanceof Error ? error.message : 'Failed to save stadium' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Search for approved stadiums (ordered by creation date, most recent first)
    const stadiums = await collection
      .find({ status: 'Approved' })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to 50 most recent
      .toArray()

    console.log(`✅ Found ${stadiums.length} stadiums`)

    return NextResponse.json(stadiums)

  } catch (error: any) {
    console.error('❌ Error fetching stadiums:', error)
    return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Failed to fetch stadiums' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request received for stadiums collection')
    
    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Delete all stadiums
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
              { error: error instanceof Error ? error.message : 'Failed to delete stadiums' },
      { status: 500 }
    )
  }
} 