import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'logs';

let db: Db;
let logs: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && logs) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    logs = db.collection(COLLECTION_NAME);
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
    if (!logs) await init();

    // Busca os últimos 50 logs, ordenados pelo mais recente
    const allLogs = await logs.find({}).sort({ timestamp: -1 }).limit(50).toArray();

    // O MongoDB retorna _id como um objeto. Para o frontend, é melhor convertê-lo para string.
    const sanitizedLogs = allLogs.map(log => ({
        ...log,
        _id: log._id.toString(),
    }));

    return NextResponse.json(sanitizedLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
} 