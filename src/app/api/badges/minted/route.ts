import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'minted-badges'; // Separate collection for minted NFTs

/**
 * GET handler to fetch badges that were actually minted on blockchain
 * Uses separate 'minted-badges' collection for performance and clarity
 */
export async function GET(request: Request) {
  try {
    console.log('✅ GET Minted Badges - Fetching from minted-badges collection');
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const chainId = searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const mintedBadges = db.collection(COLLECTION_NAME);

    // Simple filter - all NFTs in this collection were already minted
    const filter: any = {};

    // Filter by owner if specified
    if (owner) {
      filter['creator.wallet'] = owner;
    }
    
    console.log('🔍 Searching in collection:', COLLECTION_NAME);
    console.log('🔍 Applied filter:', JSON.stringify(filter, null, 2));

    // Collection statistics
    const totalMintedBadges = await mintedBadges.countDocuments({});
    const ownerMintedBadges = owner ? await mintedBadges.countDocuments(filter) : totalMintedBadges;
    
    console.log('📊 MINTED BADGES STATS:');
    console.log(`Total minted badges: ${totalMintedBadges}`);
    console.log(`Owner minted badges: ${ownerMintedBadges}`);

    // Fetch minted NFTs
    const badges = await mintedBadges
      .find(filter)
      .sort({ mintedAt: -1, createdAt: -1 }) // Sort by mint date
      .limit(50)
      .toArray();
      
    console.log(`✅ Found ${badges.length} minted badges`);

    // Process data to ensure consistency
    const processedBadges = badges.map(badge => ({
      ...badge,
      // Ensure it has blockchain information
      blockchain: badge.blockchain || {
        chainId: parseInt(chainId),
        contractAddress: chainId === '80002' 
          ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
          : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
        transactionHash: badge.transactionHash,
        tokenId: badge.tokenId || badge.blockchain?.tokenId,
        explorerUrl: badge.transactionHash 
          ? `https://amoy.polygonscan.com/tx/${badge.transactionHash}`
          : null,
        network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain'
      },
      
      // Confirmed status (all in this collection were minted)
      mintStatus: 'confirmed',
      isMinted: true,
      status: 'Approved',
      
      // Marketplace metadata
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    }));

    // Detailed log for debugging
    if (processedBadges.length > 0) {
      console.log('📋 Minted Badge NFTs:');
      processedBadges.forEach((badge: any, index) => {
        console.log(`${index + 1}. ${badge.name || 'Unnamed Badge'} - Token: ${badge.blockchain?.tokenId || 'N/A'} - TX: ${badge.transactionHash?.slice(0, 10)}...`);
      });
    } else {
      console.log('⚠️ No minted badges found in minted-badges collection');
    }

    return NextResponse.json({
      success: true,
      total: processedBadges.length,
      chainId: parseInt(chainId),
      network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
      data: processedBadges,
      collection: COLLECTION_NAME,
      filters: {
        owner: owner || 'all',
        onlyMinted: true,
        separateCollection: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching minted badges:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch minted badges',
      details: error instanceof Error ? error.message : 'Unknown error',
      collection: COLLECTION_NAME
    }, { status: 500 });
  }
}

/**
 * POST handler para mover um badge para a coleção de mintados
 * Chamado quando um NFT é mintado com sucesso
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { badgeId, transactionHash, tokenId, chainId = 80002 } = body;
    
    console.log('🔄 Movendo badge para coleção de mintados:', {
      badgeId,
      transactionHash,
      tokenId,
      chainId
    });

    if (!badgeId || !transactionHash) {
      return NextResponse.json({ 
        success: false,
        error: 'badgeId e transactionHash são obrigatórios'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const badgesCollection = db.collection('badges');
    const mintedBadgesCollection = db.collection(COLLECTION_NAME);

    // Buscar o badge original
    const originalBadge = await badgesCollection.findOne({ _id: badgeId });
    
    if (!originalBadge) {
      return NextResponse.json({ 
        success: false,
        error: 'Badge não encontrado'
      }, { status: 404 });
    }

    // Criar documento para coleção de mintados
    const mintedBadge = {
      ...originalBadge,
      // Informações de mint
      transactionHash,
      tokenId,
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      status: 'Approved',
      
      // Informações de blockchain
      blockchain: {
        chainId: parseInt(chainId),
        contractAddress: chainId === 80002 
          ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
          : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
        transactionHash,
        tokenId,
        explorerUrl: `https://amoy.polygonscan.com/tx/${transactionHash}`,
        network: chainId === 80002 ? 'Polygon Amoy' : 'CHZ Chain'
      }
    };

    // Inserir na coleção de mintados
    await mintedBadgesCollection.insertOne(mintedBadge);

    // Opcional: Marcar como mintado na coleção original (para histórico)
    await badgesCollection.updateOne(
      { _id: badgeId },
      { 
        $set: { 
          isMinted: true,
          mintedAt: new Date(),
          transactionHash,
          tokenId,
          mintStatus: 'confirmed'
        }
      }
    );

    console.log('✅ Badge movido com sucesso para coleção de mintados');

    return NextResponse.json({
      success: true,
      message: 'Badge movido para coleção de mintados com sucesso',
      data: {
        badgeId,
        transactionHash,
        tokenId,
        collection: COLLECTION_NAME
      }
    });

  } catch (error) {
    console.error('❌ Error moving badge to minted collection:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to move badge to minted collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 