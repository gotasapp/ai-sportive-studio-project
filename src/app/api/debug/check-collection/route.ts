import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');
    
    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID required' }, { status: 400 });
    }

    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    const collection = await db.collection('launchpad_collections').findOne({
      _id: new ObjectId(collectionId)
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      collection: {
        _id: collection._id,
        name: collection.name,
        contractAddress: collection.contractAddress,
        deployed: collection.deployed,
        deployedAt: collection.deployedAt,
        priceInMatic: collection.priceInMatic,
        maxSupply: collection.maxSupply,
        status: collection.status,
        minted: collection.minted || 0,
        updatedAt: collection.updatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking collection:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check collection'
    }, { status: 500 });
  }
}
