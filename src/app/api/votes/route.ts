import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST /api/votes - Votar ou remover voto
export async function POST(request: NextRequest) {
  try {
    const { itemId, itemType, itemName, action, walletAddress } = await request.json();

    console.log('🗳️ Vote request:', { itemId, itemType, itemName, action, walletAddress });

    if (!itemId || !itemType || !itemName || !action || !walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing parameters: itemId, itemType, itemName, action, walletAddress' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const votes = db.collection('votes');

    if (action === 'upvote') {
      const result = await votes.updateOne(
        { itemId, itemType, votedBy: { $ne: walletAddress } },
        {
          $inc: { votes: 1 },
          $addToSet: { votedBy: walletAddress },
          $set: { 
            itemName,
            lastVoteUpdate: new Date(),
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      const updated = await votes.findOne({ itemId, itemType });
      const userVoted = !!updated?.votedBy?.includes?.(walletAddress);
      console.log('✅ Upvote result:', { itemId, itemType, votes: updated?.votes, userVoted, result });
      
      if (result.matchedCount > 0 || result.upsertedCount > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Vote added!', 
          votes: updated?.votes || 1, 
          userVoted 
        });
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add vote', 
        userVoted 
      }, { status: 500 });

    } else if (action === 'remove') {
      const result = await votes.updateOne(
        { itemId, itemType, votedBy: walletAddress, votes: { $gt: 0 } },
        {
          $inc: { votes: -1 },
          $pull: { votedBy: walletAddress },
          $set: { lastVoteUpdate: new Date() }
        }
      );

      const updated = await votes.findOne({ itemId, itemType });
      const userVoted = !!updated?.votedBy?.includes?.(walletAddress);
      console.log('❌ Remove vote result:', { itemId, itemType, votes: updated?.votes, userVoted, result });
      
      if (result.matchedCount > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Vote removed!', 
          votes: updated?.votes || 0, 
          userVoted 
        });
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Item not found or no votes', 
        userVoted 
      }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Vote API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// GET /api/votes - Buscar mais votados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const itemType = searchParams.get('itemType'); // opcional - filtrar por tipo

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const votes = db.collection('votes');

    const filter = itemType ? { itemType } : {};
    const mostVoted = await votes
      .find(filter)
      .sort({ votes: -1, lastVoteUpdate: -1 })
      .limit(limit)
      .toArray();

    console.log('🏆 Most voted items:', mostVoted.length);

    return NextResponse.json({ 
      success: true, 
      data: mostVoted 
    });
  } catch (error: any) {
    console.error('❌ Get votes error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
