import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { nftId, action } = await request.json();
    
    console.log('🗳️ Vote API called:', { nftId, action });
    
    if (!nftId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing parameters' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collection = db.collection('jerseys');

    // Converter para ObjectId se necessário
    let query: any = {};
    try {
      query._id = new ObjectId(nftId);
    } catch (e) {
      // Se falhar, tentar como string
      query._id = nftId;
    }

    if (action === 'upvote') {
      // Incrementar votes
      const result = await collection.updateOne(
        query,
        {
          $inc: { votes: 1 },
          $set: { lastVoteUpdate: new Date() }
        }
      );

      console.log('📊 Upvote result:', result);

      if (result.matchedCount > 0) {
        // Buscar o documento atualizado para retornar o total de votos
        const updatedNFT = await collection.findOne(query);
        return NextResponse.json({ 
          success: true, 
          message: 'Voto adicionado!',
          votes: updatedNFT?.votes || 1
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'NFT não encontrado' 
        }, { status: 404 });
      }
    } else if (action === 'remove') {
      // Decrementar votes (não deixar negativo)
      const result = await collection.updateOne(
        { ...query, votes: { $gt: 0 } }, // Só decrementa se votes > 0
        {
          $inc: { votes: -1 },
          $set: { lastVoteUpdate: new Date() }
        }
      );

      console.log('📊 Remove vote result:', result);

      if (result.matchedCount > 0) {
        const updatedNFT = await collection.findOne(query);
        return NextResponse.json({ 
          success: true, 
          message: 'Voto removido!',
          votes: updatedNFT?.votes || 0
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'NFT não encontrado ou sem votos' 
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Vote API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}