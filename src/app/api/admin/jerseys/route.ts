import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';

let db: Db;
let jerseys: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && jerseys) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    jerseys = db.collection(COLLECTION_NAME);
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
    if (!jerseys) await init();

    const allJerseys = await jerseys.find({}).sort({ createdAt: -1 }).toArray();

    // O MongoDB retorna _id como um objeto. Para o frontend, é melhor converter e padronizar os campos.
    const sanitizedJerseys = allJerseys.map(jersey => ({
        id: jersey._id?.toString() || '',
        name: jersey.name || 'Unnamed',
        creator: jersey.creator || { name: '', wallet: '' },
        createdAt: jersey.createdAt || '',
        status: jersey.status || 'Minted',
        imageUrl: jersey.imageUrl || jersey.image || '',
        mintCount: jersey.mintCount || jersey.mintedCount || 0,
        editionSize: jersey.editionSize || jersey.edition_size || 1
    }));

    return NextResponse.json(sanitizedJerseys);
  } catch (error) {
    console.error('Error fetching jerseys:', error);
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch jerseys' }, { status: 500 });
  }
} 