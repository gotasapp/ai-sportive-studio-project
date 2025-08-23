import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';

/**
 * POST handler para atualizar o status de mint de um NFT no MongoDB
 * Chamado quando uma transação é confirmada na blockchain
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Update Mint Status API: Request received');
    
    const body = await request.json();
    const { 
      jerseyId, 
      transactionHash, 
      tokenId, 
      queueId, 
      status = 'minted',
      chainId = 88888,
      blockNumber,
      userWallet
    } = body;

    if (!jerseyId && !userWallet) {
      return NextResponse.json({ 
        error: 'Jersey ID or user wallet is required' 
      }, { status: 400 });
    }

    if (!transactionHash) {
      return NextResponse.json({ 
        error: 'Transaction hash is required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    // Construir filtro para encontrar o NFT
    let filter: any = {};
    
    if (jerseyId) {
      // Se temos o ID específico do jersey
      filter._id = jerseyId;
    } else if (userWallet) {
      // Se temos apenas a carteira, buscar o último NFT não mintado deste usuário
      filter = {
        'creator.wallet': userWallet,
        $or: [
          { transactionHash: { $exists: false } },
          { transactionHash: null },
          { transactionHash: '' }
        ]
      };
    }

    // Dados para atualizar
    const updateData = {
      transactionHash,
      mintedAt: new Date(),
      mintStatus: status,
      isMinted: true,
      blockchain: {
        chainId: parseInt(chainId),
        network: chainId === 88888 ? 'CHZ Chain' : 'Polygon Amoy',
        transactionHash,
        tokenId: tokenId || null,
        blockNumber: blockNumber || null,
        explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`,
        queueId: queueId || null
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      },
      updatedAt: new Date()
    };

    let result;
    
    if (jerseyId) {
      // Atualizar NFT específico
      result = await jerseys.updateOne(filter, { $set: updateData });
    } else {
      // Atualizar o último NFT não mintado do usuário
      result = await jerseys.updateOne(filter, { $set: updateData }, { sort: { createdAt: -1 } });
    }

    if (result.matchedCount === 0) {
      console.log('⚠️ No matching NFT found for update:', { jerseyId, userWallet, filter });
      return NextResponse.json({ 
        error: 'NFT not found',
        searched: filter
      }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      console.log('⚠️ NFT found but not modified (might already be updated)');
      return NextResponse.json({ 
        success: true,
        message: 'NFT already updated',
        alreadyMinted: true
      });
    }

    console.log(`✅ NFT mint status updated successfully:`, {
      jerseyId: jerseyId || 'latest for ' + userWallet,
      transactionHash: transactionHash.slice(0, 10) + '...',
      chainId,
      explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`
    });

    // Buscar o NFT atualizado para retornar
    const updatedNFT = await jerseys.findOne(
      jerseyId ? { _id: jerseyId } : filter,
      { sort: { updatedAt: -1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Mint status updated successfully',
      nft: {
        id: updatedNFT?._id,
        name: updatedNFT?.name,
        transactionHash,
        explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`,
        mintedAt: updateData.mintedAt,
        chainId
      },
      updated: true
    });

  } catch (error) {
    console.error('❌ Error updating mint status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update mint status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 