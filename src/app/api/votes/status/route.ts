import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/votes/status?itemId=...&itemType=...&walletAddress=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');
    const walletAddress = searchParams.get('walletAddress');

    console.log('🔍 Vote status request:', { itemId, itemType, walletAddress });

    if (!itemId || !itemType || !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'itemId, itemType and walletAddress are required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const votesCollection = db.collection('votes');

    const doc = await votesCollection.findOne({ itemId, itemType }, { projection: { votes: 1, votedBy: 1 } });
    if (!doc) {
      console.log('❌ Vote record not found:', { itemId, itemType });
      return NextResponse.json({ 
        success: true, 
        userVoted: false, 
        votes: 0 
      });
    }

    const votedBy: string[] = Array.isArray(doc.votedBy) ? doc.votedBy : [];
    const userVoted = votedBy.some((w) => String(w).toLowerCase() === walletAddress.toLowerCase());
    const voteCount = typeof doc.votes === 'number' ? doc.votes : 0;

    console.log('✅ Vote status result:', { itemId, itemType, userVoted, voteCount, votedBy });

    return NextResponse.json({ 
      success: true, 
      userVoted, 
      votes: voteCount
    });
  } catch (error: any) {
    console.error('❌ Vote status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
