import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'Collection name required' }, { status: 400 });
    }

    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar por nome exato
    let collection = await db.collection('launchpad_collections').findOne({
      name: { $regex: new RegExp(name, 'i') } // Case insensitive
    });

    if (!collection) {
      return NextResponse.json({ 
        error: `Collection "${name}" not found`,
        suggestion: 'Check if the name is correct or if the collection exists'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      collection: {
        _id: collection._id,
        name: collection.name,
        description: collection.description,
        contractAddress: collection.contractAddress,
        deployed: collection.deployed,
        deployedAt: collection.deployedAt,
        priceInMatic: collection.priceInMatic,
        maxSupply: collection.maxSupply,
        status: collection.status,
        minted: collection.minted || 0,
        image: collection.image,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt
      },
      deployStatus: {
        hasContract: !!collection.contractAddress,
        isDeployed: !!collection.deployed,
        readyForMint: !!(collection.contractAddress && collection.deployed)
      }
    });

  } catch (error: any) {
    console.error('❌ Error finding collection:', error);
    return NextResponse.json({
      error: error.message || 'Failed to find collection'
    }, { status: 500 });
  }
}
