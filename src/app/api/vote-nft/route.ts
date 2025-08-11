import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  console.log('🚀 VOTE NFT API STARTED!');
  
  try {
    console.log('🔍 Parsing request body...');
    const body = await request.json();
    const { nftId, action, contractAddress, tokenId } = body;
    
    console.log('📝 Received data:', { nftId, action });
    
    if ((!nftId && !(contractAddress && tokenId !== undefined)) || !action) {
      console.log('❌ Missing parameters:', { nftId, contractAddress, tokenId, action });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing parameters: provide nftId OR (contractAddress + tokenId), and action' 
      }, { status: 400 });
    }

    console.log('📡 Connecting to MongoDB...');
    const client = await clientPromise;
    console.log('✅ MongoDB connected!');
    
    const db = client.db('chz-app-db');
    const collection = db.collection('jerseys');
    console.log('📊 Collection obtained!');

    // Montar query por _id ou por par (contractAddress, tokenId)
    let query: any = {};
    if (nftId) {
      try {
        query._id = new ObjectId(nftId);
        console.log('🔑 Using ObjectId:', query._id);
      } catch (e) {
        console.log('🔑 Using string ID:', nftId);
        query._id = nftId;
      }
    } else if (contractAddress && tokenId !== undefined) {
      query = { contractAddress, tokenId: typeof tokenId === 'string' ? Number(tokenId) : tokenId };
      console.log('🔎 Using contractAddress + tokenId:', query);
    }

    if (action === 'upvote') {
      console.log('👍 Processing upvote...');
      // Incrementar votes
      const result = await collection.updateOne(
        query,
        {
          $inc: { votes: 1 },
          $set: { lastVoteUpdate: new Date() }
        },
        { upsert: false } // Não criar se não existir
      );

      console.log('📊 Upvote result:', result);

      if (result.matchedCount > 0) {
        // Buscar o documento atualizado
        const updatedNFT = await collection.findOne(query);
        console.log('✅ Vote added successfully!');
        return NextResponse.json({ 
          success: true, 
          message: 'Vote added!',
          votes: updatedNFT?.votes || 1,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ NFT not found for upvote');
        return NextResponse.json({ 
          success: false, 
          error: 'NFT not found' 
        }, { status: 404 });
      }
    } else if (action === 'remove') {
      console.log('👎 Processing vote removal...');
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
        console.log('✅ Vote removed successfully!');
        return NextResponse.json({ 
          success: true, 
          message: 'Vote removed!',
          votes: updatedNFT?.votes || 0,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ NFT not found or no votes to remove');
        return NextResponse.json({ 
          success: false, 
          error: 'NFT not found or no votes to remove' 
        }, { status: 404 });
      }
    } else {
      console.log('❌ Invalid action:', action);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use "upvote" or "remove"' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('❌ Vote NFT API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
