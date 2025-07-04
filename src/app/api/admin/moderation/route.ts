import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Db } from 'mongodb';

// Coleções que podem ter itens para moderação
const MODERATION_COLLECTIONS = ['jerseys', 'stadiums', 'badges', 'logos'];

async function getPendingItems(limit = 50) {
  const client = await clientPromise;
  const db = client.db('chz-app-db');
  
  let allPendingItems: any[] = [];

  // Usar Promise.all para buscar de todas as coleções em paralelo
  const collectionPromises = MODERATION_COLLECTIONS.map(async (collectionName) => {
    const collection = db.collection(collectionName);
    
    // Otimização: apenas campos necessários e limite
    const pendingItems = await collection.find(
      { status: 'Pending' },
      { 
        projection: {
          _id: 1,
          name: 1,
          imageUrl: 1,
          image: 1,
          creator: 1,
          submittedAt: 1,
          createdAt: 1,
          status: 1
        },
        limit: Math.ceil(limit / MODERATION_COLLECTIONS.length)
      }
    ).sort({ createdAt: -1 }).toArray();
    
    // Mapear com tipo
    return pendingItems.map(item => ({
      id: item._id.toString(),
      type: collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1),
      name: item.name || 'Unnamed',
      imageUrl: item.imageUrl || item.image || '/placeholder.png',
      creator: item.creator || { name: 'Unknown', wallet: 'Unknown' },
      submittedAt: item.submittedAt || item.createdAt || new Date().toISOString(),
      status: item.status,
      details: {} // Simplificado
    }));
  });

  // Executar todas as queries em paralelo
  const results = await Promise.all(collectionPromises);
  allPendingItems = results.flat();

  // Ordenar por data mais recente primeiro
  allPendingItems.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return allPendingItems.slice(0, limit);
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

export async function POST(request: Request) {
  try {
    const { itemId, action, type } = await request.json();
    
    if (!itemId || !action || !type) {
      return NextResponse.json({ error: 'Missing required fields: itemId, action, type' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    
    // Determinar nome da coleção baseado no tipo
    const collectionMap: { [key: string]: string } = {
      'Jersey': 'jerseys',
      'Stadium': 'stadiums', 
      'Badge': 'badges',
      'Logo': 'logos'
    };

    const collectionName = collectionMap[type];
    if (!collectionName) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    const collection = db.collection(collectionName);
    
    // Atualizar status do item
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const { ObjectId } = require('mongodb');
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(itemId) },
      { 
        $set: { 
          status: newStatus,
          moderatedAt: new Date(),
          moderatedBy: 'admin' // Em produção, pegar do token de auth
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    console.log(`✅ ${action}d ${type} item ${itemId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Item ${action}d successfully`,
      itemId,
      newStatus
    });

  } catch (error) {
    console.error('Error moderating item:', error);
    return NextResponse.json({ error: 'Failed to moderate item' }, { status: 500 });
  }
} 