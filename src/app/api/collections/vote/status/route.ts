import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/collections/vote/status?collectionName=...&walletAddress=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collectionName');
    const walletAddress = searchParams.get('walletAddress');

    if (!collectionName || !walletAddress) {
      return NextResponse.json({ success: false, error: 'collectionName and walletAddress are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = db.collection('collections');

    const doc = await collections.findOne({ name: collectionName }, { projection: { votes: 1, votedBy: 1 } });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    const votedBy: string[] = Array.isArray(doc.votedBy) ? doc.votedBy : [];
    const userVoted = votedBy.some((w) => String(w).toLowerCase() === walletAddress.toLowerCase());
    const votes = typeof doc.votes === 'number' ? doc.votes : 0;

    return NextResponse.json({ success: true, userVoted, votes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}


