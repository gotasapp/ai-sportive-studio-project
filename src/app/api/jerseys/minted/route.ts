import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'jerseys';

/**
 * GET handler para buscar apenas jerseys que foram realmente mintados na blockchain
 * Filtra apenas NFTs com transactionHash (confirmação de mint)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('✅ GET Minted Jerseys - Buscando apenas NFTs mintados');
    
    const owner = request.nextUrl.searchParams.get('owner');
    const chainId = request.nextUrl.searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const jerseys = db.collection(COLLECTION_NAME);

    // Filtros obrigatórios para NFTs mintados
    const filter: any = {
      // Status deve ser Approved
      status: 'Approved',
      
      // Deve ter transactionHash (prova de mint)
      $or: [
        { transactionHash: { $exists: true, $nin: [null, ''] } },
        { mintedAt: { $exists: true, $ne: null } },
        { isMinted: true },
        { mintStatus: 'success' },
        { mintStatus: 'mined' }
      ]
    };

    // Filtrar por owner se especificado
    if (owner) {
      filter['creator.wallet'] = owner;
    }

    // Buscar apenas NFTs mintados
    const mintedJerseys = await jerseys
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Adicionar informações de blockchain para cada NFT
    const processedJerseys = mintedJerseys.map(jersey => ({
      ...jersey,
      // Informações de blockchain
      blockchain: {
        chainId: parseInt(chainId),
        contractAddress: chainId === '80002' 
          ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
          : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
        transactionHash: jersey.transactionHash,
        explorerUrl: jersey.transactionHash 
          ? `https://amoy.polygonscan.com/tx/${jersey.transactionHash}`
          : null,
        network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain'
      },
      
      // Status de mint confirmado
      mintStatus: jersey.transactionHash ? 'confirmed' : 'pending',
      isMinted: !!jersey.transactionHash,
      
      // Metadados para marketplace
      marketplace: {
        isListable: !!jersey.transactionHash, // Só pode listar se foi mintado
        canTrade: !!jersey.transactionHash,
        verified: !!jersey.transactionHash
      }
    }));

    console.log(`✅ Found ${processedJerseys.length} minted jerseys for ${owner ? `owner ${owner}` : 'all users'} on chain ${chainId}`);
    
    // Log detalhado para debug
    if (processedJerseys.length > 0) {
      console.log('📋 Minted NFTs details:');
      processedJerseys.forEach((jersey: any, index) => {
        console.log(`${index + 1}. ${jersey.name || 'Unnamed Jersey'} - TX: ${jersey.transactionHash?.slice(0, 10)}...`);
      });
    } else {
      console.log('⚠️ No minted NFTs found. Users need to mint NFTs first.');
    }

    return NextResponse.json({
      success: true,
      total: processedJerseys.length,
      chainId: parseInt(chainId),
      network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
      data: processedJerseys,
      filters: {
        owner: owner || 'all',
        onlyMinted: true,
        requiresTransactionHash: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching minted jerseys:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch minted jerseys',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 