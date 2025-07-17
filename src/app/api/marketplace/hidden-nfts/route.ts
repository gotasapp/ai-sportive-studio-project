import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const hiddenDocs = await db.collection('hidden_nfts').find().toArray();
    const hiddenIds = hiddenDocs.map(doc => doc.tokenId);
    return NextResponse.json({ hiddenIds });
  } catch (error) {
    return NextResponse.json({ hiddenIds: [], error: error?.message || 'Failed to fetch hidden NFTs' }, { status: 500 });
  }
} 