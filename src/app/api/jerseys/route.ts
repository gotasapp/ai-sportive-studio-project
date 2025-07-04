import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';
const LOG_COLLECTION_NAME = 'jerseys_log'; // Nova coleção de log

// POST handler para criar uma nova Jersey
export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);
    const logs = db.collection(LOG_COLLECTION_NAME); // Instancia a coleção de log

    const data = await request.json();

    // 1. Grava um log primeiro
    const logEntry = {
      timestamp: new Date(),
      message: 'Attempting to insert jersey',
      jerseyName: data.name,
      creatorWallet: data.creatorWallet,
    };
    const logResult = await logs.insertOne(logEntry);


    // Validar dados recebidos (exemplo simples)
    if (!data.name || !data.imageUrl || !data.prompt || !data.creatorWallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newJersey = {
      name: data.name,
      prompt: data.prompt,
      imageUrl: data.imageUrl,
      creator: {
        wallet: data.creatorWallet,
        name: data.creatorName || 'Anonymous', // O nome pode ser opcional
      },
      createdAt: new Date(),
      status: 'Approved', // Alterado de 'Pending' para 'Approved'
      mintCount: 0,
      editionSize: 100, // Valor padrão
      tags: data.tags || [],
    };

    const result = await jerseys.insertOne(newJersey);

    return NextResponse.json({ 
      message: 'Jersey created successfully and is now available',
      jerseyId: result.insertedId,
      logId: logResult.insertedId // Retorna o ID do log também
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating jersey:', error);
    return NextResponse.json({ error: 'Failed to create jersey' }, { status: 500 });
  }
}

// GET handler para buscar todas as Jerseys aprovadas
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    const approvedJerseys = await jerseys
      .find({ status: 'Approved' })
      .sort({ createdAt: -1 }) // Ordenar pelas mais recentes primeiro
      .toArray();

    return NextResponse.json(approvedJerseys);

  } catch (error) {
    console.error('Error fetching jerseys:', error);
    return NextResponse.json({ error: 'Failed to fetch jerseys' }, { status: 500 });
  }
}

// DELETE handler temporário para limpar a coleção
export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    const result = await jerseys.deleteMany({});
    
    return NextResponse.json({ 
      message: `Successfully deleted ${result.deletedCount} documents from jerseys collection`,
      deletedCount: result.deletedCount
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting jerseys:', error);
    return NextResponse.json({ error: 'Failed to delete jerseys' }, { status: 500 });
  }
} 