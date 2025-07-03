import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';

let db: Db;
let jerseys: Collection;

async function init() {
  if (db && jerseys) return;
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    jerseys = db.collection(COLLECTION_NAME);
  } catch (error) {
    throw new Error('Failed to connect to the database.');
  }
}

(async () => {
  await init();
})();

// POST handler para criar uma nova Jersey
export async function POST(request: Request) {
  try {
    if (!jerseys) await init();

    const data = await request.json();

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
      jerseyId: result.insertedId 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating jersey:', error);
    return NextResponse.json({ error: 'Failed to create jersey' }, { status: 500 });
  }
}

// GET handler para buscar todas as Jerseys aprovadas
export async function GET() {
  try {
    if (!jerseys) await init();

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