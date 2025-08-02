import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { qty = 1 } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Atualizar o contador de minted na coleção
    const result = await db.collection('collections').updateOne(
      { _id: new (require('mongodb').ObjectId)(id) },
      { $inc: { minted: qty } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Collection not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Incremented minted count by ${qty}` 
    });

  } catch (error) {
    console.error('Error incrementing collection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to increment collection' 
    }, { status: 500 });
  }
} 