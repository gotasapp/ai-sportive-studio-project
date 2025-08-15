import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Lorem na tabela collections
    const loremInCollections = await db.collection('collections').findOne({
      name: { $regex: /^Lorem/i }
    });

    if (!loremInCollections) {
      return NextResponse.json({
        error: 'Lorem collection not found in collections table'
      }, { status: 404 });
    }

    console.log('🔍 Found Lorem collection:', loremInCollections);

    // Verificar se já existe na launchpad_collections
    const existsInLaunchpad = await db.collection('launchpad_collections').findOne({
      contractAddress: loremInCollections.contractAddress
    });

    if (existsInLaunchpad) {
      return NextResponse.json({
        success: false,
        message: 'Lorem collection already exists in launchpad_collections',
        existingId: existsInLaunchpad._id
      });
    }

    // Migrar para launchpad_collections
    const launchpadData = {
      name: loremInCollections.name,
      description: loremInCollections.description || 'Lorem collection description',
      image: loremInCollections.image || loremInCollections.imageUrl,
      imageUrl: loremInCollections.image || loremInCollections.imageUrl,
      contractAddress: loremInCollections.contractAddress,
      status: 'active', // Forçar como ativo já que tem contract
      minted: loremInCollections.minted || 0,
      totalSupply: loremInCollections.totalSupply || loremInCollections.maxSupply || 100,
      maxSupply: loremInCollections.maxSupply || loremInCollections.totalSupply || 100,
      priceInMatic: loremInCollections.priceInMatic || loremInCollections.price || 0.1,
      price: loremInCollections.price || loremInCollections.priceInMatic || 0.1,
      category: loremInCollections.category || 'jersey',
      creator: loremInCollections.creator || {
        name: 'Admin',
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56'
      },
      deployed: true, // Tem contractAddress então está deployed
      deployedAt: loremInCollections.deployedAt || loremInCollections.updatedAt || new Date(),
      type: 'launchpad',
      
      // Copiar outros campos se existirem
      website: loremInCollections.website,
      twitter: loremInCollections.twitter,
      discord: loremInCollections.discord,
      vision: loremInCollections.vision,
      utility: loremInCollections.utility,
      team: loremInCollections.team,
      roadmap: loremInCollections.roadmap,
      mintStages: loremInCollections.mintStages,
      
      createdAt: loremInCollections.createdAt || new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('launchpad_collections').insertOne(launchpadData);

    console.log('✅ Lorem collection migrated to launchpad_collections:', result.insertedId);

    // Opcional: marcar a coleção original como migrada
    await db.collection('collections').updateOne(
      { _id: loremInCollections._id },
      { 
        $set: { 
          migratedToLaunchpad: true,
          migratedAt: new Date(),
          migratedId: result.insertedId
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Lorem collection migrated successfully to launchpad_collections',
      originalId: loremInCollections._id,
      newId: result.insertedId,
      migratedData: {
        name: launchpadData.name,
        contractAddress: launchpadData.contractAddress,
        status: launchpadData.status,
        deployed: launchpadData.deployed
      }
    });

  } catch (error: any) {
    console.error('❌ Error migrating Lorem collection:', error);
    return NextResponse.json({
      error: error.message || 'Failed to migrate Lorem collection'
    }, { status: 500 });
  }
}

// GET para verificar o status da migração
export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Lorem em ambas as tabelas
    const loremInCollections = await db.collection('collections').findOne({
      name: { $regex: /^Lorem/i }
    });
    
    const loremInLaunchpad = await db.collection('launchpad_collections').findOne({
      name: { $regex: /^Lorem/i }
    });

    return NextResponse.json({
      success: true,
      status: {
        inCollections: loremInCollections ? {
          _id: loremInCollections._id,
          name: loremInCollections.name,
          contractAddress: loremInCollections.contractAddress,
          status: loremInCollections.status,
          migratedToLaunchpad: loremInCollections.migratedToLaunchpad
        } : null,
        inLaunchpad: loremInLaunchpad ? {
          _id: loremInLaunchpad._id,
          name: loremInLaunchpad.name,
          contractAddress: loremInLaunchpad.contractAddress,
          status: loremInLaunchpad.status,
          deployed: loremInLaunchpad.deployed
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking Lorem migration status:', error);
    return NextResponse.json({
      error: error.message || 'Failed to check migration status'
    }, { status: 500 });
  }
}
