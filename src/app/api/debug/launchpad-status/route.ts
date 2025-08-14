import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');
    
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    if (collectionId) {
      // Buscar coleção específica
      const collection = await db.collection('launchpad_collections').findOne({ 
        _id: new (require('mongodb').ObjectId)(collectionId) 
      });
      
      return NextResponse.json({
        success: true,
        collection,
        hasCollection: !!collection,
        minted: collection?.minted || 0,
        status: collection?.status || 'unknown'
      });
    }
    
    // Buscar todas as coleções launchpad
    const allCollections = await db.collection('launchpad_collections').find({}).toArray();
    
    // Coleções que deveriam aparecer no marketplace
    const validForMarketplace = await db.collection('launchpad_collections').find({
      status: { $in: ['active', 'upcoming', 'approved'] },
      minted: { $gt: 0 }
    }).toArray();
    
    return NextResponse.json({
      success: true,
      total: allCollections.length,
      validForMarketplace: validForMarketplace.length,
      collections: allCollections.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        minted: c.minted || 0,
        totalSupply: c.totalSupply,
        contractAddress: c.contractAddress
      })),
      validOnes: validForMarketplace.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        minted: c.minted,
        contractAddress: c.contractAddress
      }))
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to check launchpad status' 
    }, { status: 500 });
  }
}
