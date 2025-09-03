import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar as 10 coleções mais recentes em launchpad_collections
    const launchpadCollections = await db.collection('launchpad_collections')
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(10)
      .toArray();

    // Buscar também na tabela collections (case antiga)
    const legacyCollections = await db.collection('collections')
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      launchpadCollections: launchpadCollections.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        contractAddress: c.contractAddress,
        deployed: c.deployed,
        priceInMatic: c.priceInMatic,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      legacyCollections: legacyCollections.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        contractAddress: c.contractAddress,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      totalLaunchpad: launchpadCollections.length,
      totalLegacy: legacyCollections.length
    });

  } catch (error: any) {
    console.error('❌ Error listing collections:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to list collections'
    }, { status: 500 });
  }
}
