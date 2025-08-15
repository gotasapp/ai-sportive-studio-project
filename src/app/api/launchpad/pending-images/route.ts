import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/launchpad/pending-images called')
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const pendingImages = await db.collection('pending_launchpad_images')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`✅ Found ${pendingImages.length} pending images`)
    
    return NextResponse.json({
      success: true,
      pendingImages,
      count: pendingImages.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching pending images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/launchpad/pending-images called')
    const data = await request.json();
    console.log('📥 Data received:', JSON.stringify(data, null, 2))
    
    if (!data.imageUrl || !data.category) {
      console.log('❌ Required data missing:', { imageUrl: !!data.imageUrl, category: !!data.category })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: imageUrl, category' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const pendingImage = {
      imageUrl: data.imageUrl,
      category: data.category,
      name: data.name || '',
      description: data.description || '',
      price: data.price || '0.1',
      maxSupply: data.maxSupply || 100,
      creator: data.creator || {
        name: 'Admin',
        wallet: '0x0000000000000000000000000000000000000000'
      },
      metadata: data.metadata || {},
      traits: data.traits || [],
      tags: data.tags || [],
      status: 'pending_launchpad',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('💾 Saving to MongoDB...')
    const result = await db.collection('pending_launchpad_images').insertOne(pendingImage);
    console.log('✅ Saved to MongoDB with ID:', result.insertedId.toString())
    
    const response = {
      success: true,
      pendingImageId: result.insertedId.toString(),
      message: 'Image saved for admin approval'
    }
    
    console.log('📤 Returning response:', response)
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error saving pending image:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to save pending image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log('📤 Returning error:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 