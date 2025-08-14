import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Kane 2018 em todas as tabelas
    const inLaunchpadCollections = await db.collection('launchpad_collections').findOne({
      name: { $regex: /Kane.*2018/i }
    });
    
    const inCollections = await db.collection('collections').findOne({
      name: { $regex: /Kane.*2018/i }
    });

    // Verificar se existe tabela launchpad_collection_mints
    const collections = await db.listCollections().toArray();
    const hasLaunchpadMints = collections.some(c => c.name === 'launchpad_collection_mints');

    // Se existe, buscar NFTs da Kane 2018
    let launchpadMints = [];
    if (hasLaunchpadMints && inLaunchpadCollections) {
      launchpadMints = await db.collection('launchpad_collection_mints')
        .find({ collectionId: inLaunchpadCollections._id })
        .toArray();
    }

    return NextResponse.json({
      success: true,
      found: {
        inLaunchpadCollections: inLaunchpadCollections ? {
          _id: inLaunchpadCollections._id,
          name: inLaunchpadCollections.name,
          contractAddress: inLaunchpadCollections.contractAddress,
          status: inLaunchpadCollections.status,
          minted: inLaunchpadCollections.minted
        } : null,
        inCollections: inCollections ? {
          _id: inCollections._id,
          name: inCollections.name,
          contractAddress: inCollections.contractAddress,
          status: inCollections.status,
          minted: inCollections.minted
        } : null
      },
      database: {
        hasLaunchpadMintsTable: hasLaunchpadMints,
        launchpadMintsCount: launchpadMints.length,
        allCollections: collections.map(c => c.name)
      }
    });

  } catch (error: any) {
    console.error('❌ Error finding Kane collection:', error);
    return NextResponse.json({
      error: error.message || 'Failed to find Kane collection'
    }, { status: 500 });
  }
}
