import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar coleção Paris específica
    const parisCollection = await db.collection('launchpad_collections').findOne({ 
      name: 'Paris' 
    });
    
    // Buscar todas as coleções launchpad
    const allLaunchpadCollections = await db.collection('launchpad_collections').find({}).toArray();
    
    // Coleções que deveriam aparecer no marketplace (minted > 0)
    const validForMarketplace = await db.collection('launchpad_collections').find({
      status: { $in: ['active', 'upcoming', 'approved'] },
      minted: { $gt: 0 }
    }).toArray();
    
    return NextResponse.json({
      success: true,
      parisCollection: parisCollection ? {
        _id: parisCollection._id,
        name: parisCollection.name,
        status: parisCollection.status,
        minted: parisCollection.minted || 0,
        contractAddress: parisCollection.contractAddress
      } : null,
      allLaunchpadCollections: allLaunchpadCollections.map((c: any) => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        minted: c.minted || 0,
        contractAddress: c.contractAddress
      })),
      validForMarketplace: validForMarketplace.map((c: any) => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        minted: c.minted,
        contractAddress: c.contractAddress
      })),
      counts: {
        total: allLaunchpadCollections.length,
        validForMarketplace: validForMarketplace.length
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to check launchpad status' 
    }, { status: 500 });
  }
}
