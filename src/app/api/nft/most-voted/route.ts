import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('jerseys');

    // Buscar o NFT mais votado (que tenha pelo menos 1 voto)
    const mostVotedNFT = await collection
      .findOne(
        { 
          votes: { $gte: 1 } // Apenas NFTs com pelo menos 1 voto
        },
        {
          sort: { 
            votes: -1,        // Ordenar por votos (decrescente)
            lastVoteUpdate: -1 // Em caso de empate, o mais recente
          }
        }
      );

    if (!mostVotedNFT) {
      return NextResponse.json({
        success: true,
        nft: null,
        message: 'Nenhum NFT votado ainda'
      });
    }

    // Formatar resposta
    const formattedNFT = {
      _id: mostVotedNFT._id,
      name: mostVotedNFT.name,
      description: mostVotedNFT.description,
      imageUrl: mostVotedNFT.imageUrl || mostVotedNFT.cloudinaryUrl,
      votes: mostVotedNFT.votes || 0,
      category: mostVotedNFT.category,
      collection: mostVotedNFT.collection,
      creatorWallet: mostVotedNFT.creatorWallet,
      createdAt: mostVotedNFT.createdAt,
      // Dados para navegação no marketplace
      tokenId: mostVotedNFT.tokenId || '1',
      contractAddress: mostVotedNFT.contractAddress
    };

    return NextResponse.json({
      success: true,
      nft: formattedNFT,
      totalVotes: mostVotedNFT.votes || 0
    });

  } catch (error) {
    console.error('❌ Erro ao buscar NFT mais votado:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        nft: null 
      },
      { status: 500 }
    );
  }
}
