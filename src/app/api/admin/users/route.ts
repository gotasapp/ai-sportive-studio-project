import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'users';

let db: Db;
let users: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && users) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    users = db.collection(COLLECTION_NAME);
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
    if (!users) await init();

    const allUsers = await users.find({}).toArray();

    // O MongoDB retorna _id como um objeto. Para o frontend, é melhor convertê-lo para string.
    const sanitizedUsers = allUsers.map(user => ({
        ...user,
        _id: user._id.toString(),
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    // Se o erro for de conexão, podemos retornar uma mensagem mais específica
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 }); // Service Unavailable
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 