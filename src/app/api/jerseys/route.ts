import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/mongodb';
// import { Collection, Db } from 'mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';
const LOG_COLLECTION_NAME = 'jerseys_log';

// POST handler para criar uma nova Jersey
export async function POST(request: Request) {
  try {
    console.log('🧪 POST Jersey - MongoDB temporariamente desabilitado');
    return NextResponse.json({ message: 'MongoDB temporariamente desabilitado para teste' }, { status: 503 });
    
    /* CÓDIGO ORIGINAL COMENTADO
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);
    const logs = db.collection(LOG_COLLECTION_NAME);

    const data = await request.json();

    const logEntry = {
      timestamp: new Date(),
      message: 'Attempting to insert jersey',
      jerseyName: data.name,
      creatorWallet: data.creatorWallet,
    };
    const logResult = await logs.insertOne(logEntry);

    if (!data.name || !data.imageUrl || !data.prompt || !data.creatorWallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let status = 'Approved';
    try {
      const settingsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/settings/moderation`);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        status = settings.moderationEnabled ? 'Pending' : 'Approved';
        console.log(`📋 Jersey moderation setting: ${settings.moderationEnabled ? 'ON' : 'OFF'}, status: ${status}`);
      }
    } catch (settingError) {
      console.log('⚠️ Could not fetch moderation settings, using default (Approved)');
    }

    const newJersey = {
      name: data.name,
      prompt: data.prompt,
      imageUrl: data.imageUrl,
      creator: {
        wallet: data.creatorWallet,
        name: data.creatorName || 'Anonymous',
      },
      createdAt: new Date(),
      status: status,
      mintCount: 0,
      editionSize: 100,
      tags: data.tags || [],
    };

    const result = await jerseys.insertOne(newJersey);

    return NextResponse.json({ 
      message: 'Jersey created successfully and is now available',
      jerseyId: result.insertedId,
      logId: logResult.insertedId
    }, { status: 201 });
    */

  } catch (error) {
    console.error('Error creating jersey:', error);
    return NextResponse.json({ error: 'Failed to create jersey' }, { status: 500 });
  }
}

// GET handler SIMPLIFICADO para teste
export async function GET() {
  try {
    console.log('🧪 GET Jerseys - Retornando dados mock para teste');
    
    // Dados mock para teste
    const mockJerseys = [
      {
        _id: 'mock1',
        name: 'Mock Jersey 1',
        imageUrl: 'https://via.placeholder.com/400',
        creator: { wallet: '0x123', name: 'Mock User' },
        createdAt: new Date(),
        status: 'Approved'
      },
      {
        _id: 'mock2',
        name: 'Mock Jersey 2', 
        imageUrl: 'https://via.placeholder.com/400',
        creator: { wallet: '0x456', name: 'Mock User 2' },
        createdAt: new Date(),
        status: 'Approved'
      }
    ];

    return NextResponse.json(mockJerseys);

    /* CÓDIGO ORIGINAL COMENTADO
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    const approvedJerseys = await jerseys
      .find({ status: 'Approved' })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(approvedJerseys);
    */

  } catch (error) {
    console.error('Error fetching jerseys:', error);
    return NextResponse.json({ error: 'Failed to fetch jerseys' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE() {
  try {
    console.log('🧪 DELETE Jerseys - MongoDB temporariamente desabilitado');
    return NextResponse.json({ message: 'MongoDB temporariamente desabilitado para teste' }, { status: 503 });
    
    /* CÓDIGO ORIGINAL COMENTADO
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    const result = await jerseys.deleteMany({});
    
    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} documents from jerseys collection`,
      deletedCount: result.deletedCount
    }, { status: 200 });
    */

  } catch (error) {
    console.error('Error deleting jerseys:', error);
    return NextResponse.json({ error: 'Failed to delete jerseys' }, { status: 500 });
  }
} 