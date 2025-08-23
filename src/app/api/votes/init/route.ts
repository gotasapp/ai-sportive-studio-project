import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST /api/votes/init - Inicializar coleção votes e migrar dados existentes
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    
    console.log('🔧 Inicializando coleção votes...');

    // 1. Verificar se a coleção votes existe
    const collections = await db.listCollections({ name: 'votes' }).toArray();
    const votesExists = collections.length > 0;

    if (!votesExists) {
      console.log('📝 Criando coleção votes...');
      await db.createCollection('votes');
    }

    const votesCollection = db.collection('votes');
    const oldCollectionsCollection = db.collection('collections');

    // 2. Migrar dados existentes da coleção 'collections' para 'votes'
    console.log('🔄 Migrando dados existentes...');
    
    const existingVotes = await oldCollectionsCollection.find({}).toArray();
    let migratedCount = 0;

    for (const vote of existingVotes) {
      if (vote.name && (vote.votes || vote.votedBy)) {
        // Verificar se já existe na nova coleção
        const existing = await votesCollection.findOne({ 
          itemId: vote.name, 
          itemType: 'custom_collection' 
        });

        if (!existing) {
          await votesCollection.insertOne({
            itemId: vote.name,
            itemType: 'custom_collection',
            itemName: vote.name,
            votes: vote.votes || 0,
            votedBy: vote.votedBy || [],
            lastVoteUpdate: vote.lastVoteUpdate || new Date(),
            createdAt: vote.createdAt || new Date()
          });
          migratedCount++;
        }
      }
    }

    // 3. Criar índices para performance
    console.log('📊 Criando índices...');
    await votesCollection.createIndex({ itemId: 1, itemType: 1 }, { unique: true });
    await votesCollection.createIndex({ votes: -1, lastVoteUpdate: -1 });
    await votesCollection.createIndex({ votedBy: 1 });

    // 4. Estatísticas
    const totalVotes = await votesCollection.countDocuments();
    const totalVotedItems = await votesCollection.countDocuments({ votes: { $gt: 0 } });

    console.log('✅ Inicialização concluída:', {
      votesExists,
      migratedCount,
      totalVotes,
      totalVotedItems
    });

    return NextResponse.json({
      success: true,
      message: 'Coleção votes inicializada com sucesso',
      data: {
        votesExists,
        migratedCount,
        totalVotes,
        totalVotedItems
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao inicializar votes:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// GET /api/votes/init - Verificar status da coleção
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    
    const votesCollection = db.collection('votes');
    const totalVotes = await votesCollection.countDocuments();
    const totalVotedItems = await votesCollection.countDocuments({ votes: { $gt: 0 } });
    
    // Buscar alguns exemplos
    const examples = await votesCollection
      .find({ votes: { $gt: 0 } })
      .sort({ votes: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        totalVotes,
        totalVotedItems,
        examples
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
