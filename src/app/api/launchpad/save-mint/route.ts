import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      collectionId,
      tokenId,
      metadataUrl,
      imageUrl,
      transactionHash,
      minterAddress,
      price
    } = body;

    // Validate required fields
    if (!collectionId || !tokenId || !metadataUrl || !imageUrl || !transactionHash || !minterAddress) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Connect to database
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(collectionId);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid collection ID format'
      }, { status: 400 });
    }

    // Save mint data to database
    const mintData = {
      collectionId: objectId,
      tokenId,
      metadataUrl,
      imageUrl,
      transactionHash,
      minterAddress,
      price: price || "0",
      mintedAt: new Date(),
      type: 'launchpad'
    };

    await db.collection('mints').insertOne(mintData);

    // Update collection mint count
    await db.collection('collections').updateOne(
      { _id: objectId },
      { $inc: { minted: 1 } }
    );

    console.log('✅ Mint saved to database:', {
      collectionId,
      tokenId,
      transactionHash
    });

    return NextResponse.json({
      success: true,
      message: 'Mint saved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error saving mint:', error);
    return NextResponse.json({
      error: error.message || 'Failed to save mint'
    }, { status: 500 });
  }
} 