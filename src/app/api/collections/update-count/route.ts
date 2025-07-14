import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface UpdateCountRequest {
  collection: 'jerseys' | 'stadiums' | 'badges';
  increment: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateCountRequest = await request.json();
    const { collection, increment } = body;

    if (!collection || typeof increment !== 'number') {
      return NextResponse.json(
        { error: 'Collection name and increment number are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('chz-fan-token-studio');

    // Atualizar contador da coleção
    const collectionStats = db.collection('collection-stats');
    
    const result = await collectionStats.updateOne(
      { collection },
      { 
        $inc: { totalMinted: increment },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true }
    );

    console.log(`✅ Updated ${collection} count by ${increment}:`, result);

    // Buscar estatísticas atualizadas
    const updatedStats = await collectionStats.findOne({ collection });

    return NextResponse.json({
      success: true,
      collection,
      increment,
      newTotal: updatedStats?.totalMinted || increment,
      message: `${collection} count updated successfully`
    });

  } catch (error) {
    console.error('❌ Error updating collection count:', error);
    return NextResponse.json(
      { error: 'Failed to update collection count' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('chz-fan-token-studio');
    const collectionStats = db.collection('collection-stats');

    const stats = await collectionStats.find({}).toArray();

    const formattedStats = {
      jerseys: stats.find(s => s.collection === 'jerseys')?.totalMinted || 0,
      stadiums: stats.find(s => s.collection === 'stadiums')?.totalMinted || 0,
      badges: stats.find(s => s.collection === 'badges')?.totalMinted || 0,
    };

    return NextResponse.json({
      success: true,
      stats: formattedStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching collection stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection stats' },
      { status: 500 }
    );
  }
} 