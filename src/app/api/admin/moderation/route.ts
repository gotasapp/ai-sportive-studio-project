import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Db } from 'mongodb';

// Coleções que podem ter itens para moderação
const MODERATION_COLLECTIONS = ['jerseys', 'stadiums', 'badges', 'logos'];

async function getPendingItems() {
  const client = await clientPromise;
  const db = client.db('chz-app-db');
  
  let allPendingItems: any[] = [];

  for (const collectionName of MODERATION_COLLECTIONS) {
    const collection = db.collection(collectionName);
    const pendingItems = await collection.find({ status: 'Pending' }).toArray();
    
    // Adiciona um campo 'type' para o frontend saber qual o tipo do item
    const itemsWithType = pendingItems.map(item => ({
      ...item,
      type: collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1), // Transforma "jerseys" em "Jersey"
      _id: item._id.toString()
    }));

    allPendingItems = allPendingItems.concat(itemsWithType);
  }

  // Ordena todos os itens pendentes pela data de criação/submissão
  allPendingItems.sort((a, b) => new Date(a.createdAt || a.submittedAt).getTime() - new Date(b.createdAt || b.submittedAt).getTime());

  return allPendingItems;
}


export async function GET() {
  try {
    const pendingItems = await getPendingItems();
    return NextResponse.json(pendingItems);
  } catch (error) {
    console.error('Error fetching moderation items:', error);
    return NextResponse.json({ error: 'Failed to fetch items for moderation' }, { status: 500 });
  }
}

// Futuramente, podemos adicionar um handler POST para aprovar/rejeitar
// export async function POST(request: Request) { ... } 