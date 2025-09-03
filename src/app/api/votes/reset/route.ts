import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST /api/votes/reset - Zerar todos os votos
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const votesCollection = db.collection('votes');

    console.log('🗑️ Zerando todos os votos...');

    // Zerar todos os votos e arrays votedBy
    const result = await votesCollection.updateMany(
      {}, // todos os documentos
      {
        $set: {
          votes: 0,
          votedBy: [],
          lastVoteUpdate: new Date()
        }
      }
    );

    console.log('✅ Votos zerados:', result.modifiedCount, 'documentos atualizados');

    return NextResponse.json({
      success: true,
      message: 'Todos os votos foram zerados',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao zerar votos:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET /api/votes/reset - Verificar status atual dos votos
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const votesCollection = db.collection('votes');

    const totalVotes = await votesCollection.countDocuments();
    const totalVotedItems = await votesCollection.countDocuments({ votes: { $gt: 0 } });
    
    // Buscar itens com votos
    const itemsWithVotes = await votesCollection
      .find({ votes: { $gt: 0 } })
      .sort({ votes: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        totalVotes,
        totalVotedItems,
        itemsWithVotes
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}
