import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'badges';

let db: Db;
let badges: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && badges) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    badges = db.collection(COLLECTION_NAME);
  } catch (error) {
    throw new Error('Failed to connect to the database.');
  }
}

// Inicializa a conexão
(async () => {
  await init();
})();


export async function GET() {
  try {
    // Garante que a conexão está ativa
    if (!badges) await init();

    const allBadges = await badges.find({}).sort({ createdAt: -1 }).toArray();

    // O MongoDB retorna _id como um objeto. Para o frontend, é melhor convertê-lo para string.
    const sanitizedBadges = allBadges.map(badge => ({
        ...badge,
        _id: badge._id.toString(),
    }));

    return NextResponse.json(sanitizedBadges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
} 