import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'badges';

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
        console.log(`📋 Badge moderation setting: ${settings.moderationEnabled ? 'ON' : 'OFF'}, status: ${status}`);
      }
    } catch (settingError) {
      console.log('⚠️ Could not fetch moderation settings, using default (Approved)');
    }

    // Insert the badge
    const badgeDoc = {
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
              { error: error instanceof Error ? error.message : 'Failed to save badge' },
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

    // Search for approved badges (ordered by creation date, most recent first)
    const badges = await collection
      .find({ status: 'Approved' })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to 50 most recent
      .toArray()

    console.log(`✅ Found ${badges.length} badges`)

    return NextResponse.json(badges)

  } catch (error: any) {
    console.error('❌ Error fetching badges:', error)
    return NextResponse.json(
              { error: error instanceof Error ? error.message : 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request received for badges collection')
    
    // Connect to MongoDB using the same configuration as jerseys
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Delete all badges
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
              { error: error instanceof Error ? error.message : 'Failed to delete badges' },
      { status: 500 }
    )
  }
} 