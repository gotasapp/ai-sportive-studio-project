import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

// GET - Retrieve private wallets for a collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 GET Private Wallets for Collection:', collectionId);

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Get the collection to check if it exists
    let collection;
    try {
      collection = await db.collection('collections').findOne({
        _id: new ObjectId(collectionId),
        type: 'launchpad'
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid collection ID format' },
        { status: 400 }
      );
    }

    if (!collection) {
      console.log('❌ Coleção não encontrada');
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Get private wallets for this collection
    const privateWallets = await db.collection('private_wallets').find({
      collectionId: collectionId
    }).toArray();

    console.log(`✅ Encontradas ${privateWallets.length} wallets privadas`);

    return NextResponse.json({
      success: true,
      privateWallets: privateWallets.map(wallet => ({
        _id: wallet._id.toString(),
        collectionId: wallet.collectionId,
        walletAddress: wallet.walletAddress,
        stage: wallet.stage,
        addedAt: wallet.addedAt,
        addedBy: wallet.addedBy
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching private wallets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch private wallets' },
      { status: 500 }
    );
  }
}

// POST - Add private wallets for a collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, wallets, stage } = body;

    if (!collectionId || !wallets || !Array.isArray(wallets) || wallets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Collection ID and wallets array are required' },
        { status: 400 }
      );
    }

    console.log('➕ POST Add Private Wallets:', { collectionId, stage, walletCount: wallets.length });

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Verify collection exists
    let collection;
    try {
      collection = await db.collection('collections').findOne({
        _id: new ObjectId(collectionId),
        type: 'launchpad'
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid collection ID format' },
        { status: 400 }
      );
    }

    if (!collection) {
      console.log('❌ Coleção não encontrada');
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Validate wallet addresses format
    const validWallets = wallets.filter(wallet => 
      wallet && typeof wallet === 'string' && wallet.length === 42 && wallet.startsWith('0x')
    );

    if (validWallets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid wallet addresses provided' },
        { status: 400 }
      );
    }

    // Prepare wallet documents
    const walletDocuments = validWallets.map(walletAddress => ({
      collectionId: collectionId,
      walletAddress: walletAddress.toLowerCase(), // Normalize to lowercase
      stage: stage || 'private',
      addedAt: new Date(),
      addedBy: 'admin' // TODO: Get from auth context
    }));

    // Insert wallets
    const result = await db.collection('private_wallets').insertMany(walletDocuments);

    console.log(`✅ Adicionadas ${Object.keys(result.insertedIds).length} wallets privadas`);

    return NextResponse.json({
      success: true,
      message: `Added ${Object.keys(result.insertedIds).length} private wallets`,
      addedCount: Object.keys(result.insertedIds).length,
      collectionId: collectionId
    });

  } catch (error) {
    console.error('❌ Error adding private wallets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add private wallets' },
      { status: 500 }
    );
  }
}

// DELETE - Remove private wallets for a collection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');
    const walletAddress = searchParams.get('walletAddress');

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ DELETE Private Wallet:', { collectionId, walletAddress });

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Build query
    const query: any = { collectionId: collectionId };
    if (walletAddress) {
      query.walletAddress = walletAddress.toLowerCase();
    }

    // Delete wallets
    const result = await db.collection('private_wallets').deleteMany(query);

    console.log(`✅ Removidas ${result.deletedCount} wallets privadas`);

    return NextResponse.json({
      success: true,
      message: `Removed ${result.deletedCount} private wallets`,
      removedCount: result.deletedCount,
      collectionId: collectionId
    });

  } catch (error) {
    console.error('❌ Error removing private wallets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove private wallets' },
      { status: 500 }
    );
  }
}