import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/collections/by-name?name=Some%20Collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing name query param' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = db.collection('collections');

    const doc = await collections.findOne({ name });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id: doc._id,
      name: doc.name,
      votes: doc.votes || 0,
      isFeatured: !!doc.isFeatured,
      lastVoteUpdate: doc.lastVoteUpdate || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}


