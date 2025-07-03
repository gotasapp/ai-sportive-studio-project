import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'logos';

let db: Db;
let logos: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && logos) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    logos = db.collection(COLLECTION_NAME);
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
    if (!logos) await init();

    const allLogos = await logos.find({}).sort({ createdAt: -1 }).toArray();

    // O MongoDB retorna _id como um objeto. Para o frontend, é melhor convertê-lo para string.
    const sanitizedLogos = allLogos.map(logo => ({
        ...logo,
        _id: logo._id.toString(),
    }));

    return NextResponse.json(sanitizedLogos);
  } catch (error) {
    console.error('Error fetching logos:', error);
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch logos' }, { status: 500 });
  }
} 