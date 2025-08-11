import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Simple voting for collections by name
export async function POST(request: NextRequest) {
  try {
    const { collectionName, action } = await request.json();

    if (!collectionName || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = db.collection('collections');

    if (action === 'upvote') {
      const result = await collections.updateOne(
        { name: collectionName },
        {
          $inc: { votes: 1 },
          $set: { lastVoteUpdate: new Date() }
        },
        { upsert: true }
      );

      if (result.matchedCount > 0 || result.upsertedCount > 0) {
        const updated = await collections.findOne({ name: collectionName });
        return NextResponse.json({ success: true, message: 'Vote added!', votes: updated?.votes || 1 });
      }
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    } else if (action === 'remove') {
      const result = await collections.updateOne(
        { name: collectionName, votes: { $gt: 0 } },
        {
          $inc: { votes: -1 },
          $set: { lastVoteUpdate: new Date() }
        }
      );

      if (result.matchedCount > 0) {
        const updated = await collections.findOne({ name: collectionName });
        return NextResponse.json({ success: true, message: 'Vote removed!', votes: updated?.votes || 0 });
      }
      return NextResponse.json({ success: false, error: 'Collection not found or no votes' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}


