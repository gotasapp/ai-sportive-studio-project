import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'badges';

/**
 * POST handler para atualizar o status de mint de um Badge NFT no MongoDB
 * Chamado quando uma transação é confirmada na blockchain
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Update Badge Mint Status API: Request received');
    
    const body = await request.json();
    const { 
      badgeId, 
      transactionHash, 
      tokenId, 
      queueId, 
      status = 'minted',
      chainId = 80002,
      blockNumber,
      userWallet
    } = body;

    if (!badgeId && !userWallet) {
      return NextResponse.json({ 
        error: 'Badge ID or user wallet is required' 
      }, { status: 400 });
    }

    if (!transactionHash) {
      return NextResponse.json({ 
        error: 'Transaction hash is required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const badges = db.collection(COLLECTION_NAME);

    // Construir filtro para encontrar o NFT
    let filter: any = {};
    
    if (badgeId) {
      filter._id = badgeId;
    } else if (userWallet) {
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
        network: chainId === 80002 ? 'Polygon Amoy' : 'CHZ Chain',
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
    
    if (badgeId) {
      result = await badges.updateOne(filter, { $set: updateData });
    } else {
      result = await badges.updateOne(filter, { $set: updateData }, { sort: { createdAt: -1 } });
    }

    if (result.matchedCount === 0) {
      console.log('⚠️ No matching badge found for update:', { badgeId, userWallet, filter });
      return NextResponse.json({ 
        error: 'Badge NFT not found',
        searched: filter
      }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      console.log('⚠️ Badge found but not modified (might already be updated)');
      return NextResponse.json({ 
        success: true,
        message: 'Badge already updated',
        alreadyMinted: true
      });
    }

    console.log(`✅ Badge NFT mint status updated successfully:`, {
      badgeId: badgeId || 'latest for ' + userWallet,
      transactionHash: transactionHash.slice(0, 10) + '...',
      chainId,
      explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`
    });

    // Buscar o NFT atualizado para retornar
    const updatedNFT = await badges.findOne(
      badgeId ? { _id: badgeId } : filter,
      { sort: { updatedAt: -1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Badge mint status updated successfully',
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
    console.error('❌ Error updating badge mint status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update badge mint status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 