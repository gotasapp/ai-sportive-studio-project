import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collection = db.collection('jerseys');

    const doc = await collection.findOne({}, { projection: { _id: 1, name: 1, votes: 1 } });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Nenhum documento encontrado na coleção jerseys.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: doc._id, name: doc.name, votes: doc.votes ?? 0 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}


