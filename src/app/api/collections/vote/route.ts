import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Simple voting for collections by name
export async function POST(request: NextRequest) {
  try {
    const { collectionName, action, walletAddress } = await request.json();

    if (!collectionName || !action || !walletAddress) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = db.collection('collections');

    if (action === 'upvote') {
      const result = await collections.updateOne(
        { name: collectionName, votedBy: { $ne: walletAddress } },
        {
          $inc: { votes: 1 },
          $addToSet: { votedBy: walletAddress },
          $set: { lastVoteUpdate: new Date() }
        },
        { upsert: true }
      );

      const updated = await collections.findOne({ name: collectionName });
      const userVoted = !!updated?.votedBy?.includes?.(walletAddress);
      if (result.matchedCount > 0 || result.upsertedCount > 0) {
        return NextResponse.json({ success: true, message: 'Vote added!', votes: updated?.votes || 1, userVoted });
      }
      return NextResponse.json({ success: false, error: 'Collection not found', userVoted }, { status: 404 });
    } else if (action === 'remove') {
      const result = await collections.updateOne(
        { name: collectionName, votedBy: walletAddress, votes: { $gt: 0 } },
        {
          $inc: { votes: -1 },
          $pull: { votedBy: walletAddress },
          $set: { lastVoteUpdate: new Date() }
        }
      );

      const updated = await collections.findOne({ name: collectionName });
      const userVoted = !!updated?.votedBy?.includes?.(walletAddress);
      if (result.matchedCount > 0) {
        return NextResponse.json({ success: true, message: 'Vote removed!', votes: updated?.votes || 0, userVoted });
      }
      return NextResponse.json({ success: false, error: 'Collection not found or no votes', userVoted }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}


