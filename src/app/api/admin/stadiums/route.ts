import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'stadiums';

let db: Db;
let stadiums: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && stadiums) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    stadiums = db.collection(COLLECTION_NAME);
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
    if (!stadiums) await init();

    const allStadiums = await stadiums.find({}).sort({ createdAt: -1 }).toArray();

    // O MongoDB retorna _id como um objeto. Para o frontend, é melhor convertê-lo para string.
    const sanitizedStadiums = allStadiums.map(stadium => ({
        ...stadium,
        _id: stadium._id.toString(),
    }));

    return NextResponse.json(sanitizedStadiums);
  } catch (error) {
    console.error('Error fetching stadiums:', error);
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch stadiums' }, { status: 500 });
  }
} 