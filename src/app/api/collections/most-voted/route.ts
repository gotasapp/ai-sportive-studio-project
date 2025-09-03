import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(_request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = db.collection('collections');

    // buscar coleção com maior número de votos
    const mostVoted = await collections.findOne(
      { votes: { $gt: 0 } },
      { sort: { votes: -1, lastVoteUpdate: -1 } }
    );

    if (!mostVoted) {
      return NextResponse.json({ success: true, collection: null });
    }

    // montar resposta básica
    const payload: any = {
      name: mostVoted.name,
      votes: mostVoted.votes || 0,
      category: mostVoted.category || 'collection',
      imageUrl: mostVoted.imageUrl || null,
      createdAt: mostVoted.createdAt || new Date().toISOString(),
    };

    // fallback de imagem: tentar pegar uma NFT dessa coleção na coleção 'jerseys'
    if (!payload.imageUrl) {
      try {
        const nfts = db.collection('jerseys');
        const nftDoc = await nfts.findOne(
          { $or: [ { collection: mostVoted.name }, { category: mostVoted.category }, { name: { $regex: mostVoted.name, $options: 'i' } } ] },
          { projection: { imageUrl: 1, cloudinaryUrl: 1 } }
        );
        if (nftDoc) {
          payload.imageUrl = nftDoc.imageUrl || nftDoc.cloudinaryUrl || null;
        }
      } catch {}
    }

    return NextResponse.json({ success: true, collection: payload });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}


