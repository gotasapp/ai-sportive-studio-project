import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { collectionName, featured } = await request.json();
    if (!collectionName || typeof featured !== 'boolean') {
      return NextResponse.json({ success: false, error: 'collectionName and featured required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = db.collection('collections');

    const result = await collections.updateOne(
      { name: collectionName },
      { $set: { isFeatured: featured, featuredUpdatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, collectionName, featured, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

