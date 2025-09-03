import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET /api/votes/most-voted - Buscar o item mais votado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('itemType'); // opcional - filtrar por tipo

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const votes = db.collection('votes');

    const filter = itemType ? { itemType } : {};
    const mostVoted = await votes
      .find(filter)
      .sort({ votes: -1, lastVoteUpdate: -1 })
      .limit(1)
      .toArray();

    if (mostVoted.length === 0) {
      console.log('❌ No voted items found');
      return NextResponse.json({ 
        success: false, 
        error: 'No voted items found' 
      }, { status: 404 });
    }

    const topItem = mostVoted[0];
    console.log('🏆 Most voted item:', { 
      itemId: topItem.itemId, 
      itemType: topItem.itemType, 
      itemName: topItem.itemName, 
      votes: topItem.votes 
    });

    return NextResponse.json({ 
      success: true, 
      data: topItem 
    });
  } catch (error: any) {
    console.error('❌ Most voted error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
