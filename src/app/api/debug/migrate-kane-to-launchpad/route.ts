import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Kane 2018 na tabela collections
    const kaneInCollections = await db.collection('collections').findOne({
      name: { $regex: /Kane.*2018/i }
    });

    if (!kaneInCollections) {
      return NextResponse.json({
        error: 'Kane 2018 not found in collections table'
      }, { status: 404 });
    }

    // Migrar para launchpad_collections
    const launchpadData = {
      name: kaneInCollections.name,
      description: kaneInCollections.description || 'Bayern Munich Kane',
      image: kaneInCollections.image || kaneInCollections.imageUrl,
      contractAddress: kaneInCollections.contractAddress,
      status: 'active',
      minted: 1, // Você mintou 1 NFT
      totalSupply: 100,
      priceInMatic: 0.1,
      category: 'jersey',
      creator: {
        name: 'Admin',
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56'
      },
      deployed: true,
      deployedAt: new Date(),
      createdAt: kaneInCollections.createdAt || new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('launchpad_collections').insertOne(launchpadData);

    console.log('✅ Kane 2018 migrated to launchpad_collections:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'Kane 2018 migrated successfully',
      originalId: kaneInCollections._id,
      newId: result.insertedId,
      migratedData: launchpadData
    });

  } catch (error: any) {
    console.error('❌ Error migrating Kane collection:', error);
    return NextResponse.json({
      error: error.message || 'Failed to migrate Kane collection'
    }, { status: 500 });
  }
}
