import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'minted-badges'; // Coleção separada para NFTs mintados

/**
 * GET handler para buscar badges que foram realmente mintados na blockchain
 * Usa coleção separada 'minted-badges' para performance e clareza
 */
export async function GET(request: Request) {
  try {
    console.log('✅ GET Minted Badges - Buscando da coleção minted-badges');
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const chainId = searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const mintedBadges = db.collection(COLLECTION_NAME);

    // Filtro simples - todos os NFTs nesta coleção já foram mintados
    const filter: any = {};

    // Filtrar por owner se especificado
    if (owner) {
      filter['creator.wallet'] = owner;
    }
    
    console.log('🔍 Buscando na coleção:', COLLECTION_NAME);
    console.log('🔍 Filtro aplicado:', JSON.stringify(filter, null, 2));

    // Estatísticas da coleção
    const totalMintedBadges = await mintedBadges.countDocuments({});
    const ownerMintedBadges = owner ? await mintedBadges.countDocuments(filter) : totalMintedBadges;
    
    console.log('📊 MINTED BADGES STATS:');
    console.log(`Total minted badges: ${totalMintedBadges}`);
    console.log(`Owner minted badges: ${ownerMintedBadges}`);

    // Buscar NFTs mintados
    const badges = await mintedBadges
      .find(filter)
      .sort({ mintedAt: -1, createdAt: -1 }) // Ordenar por data de mint
      .limit(50)
      .toArray();
      
    console.log(`✅ Found ${badges.length} minted badges`);

    // Processar dados para garantir consistência
    const processedBadges = badges.map(badge => ({
      ...badge,
      // Garantir que tenha informações de blockchain
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
      
      // Status confirmado (todos nesta coleção foram mintados)
      mintStatus: 'confirmed',
      isMinted: true,
      status: 'Approved',
      
      // Metadados para marketplace
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    }));

    // Log detalhado para debug
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