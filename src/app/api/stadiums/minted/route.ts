import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'minted-stadiums'; // Coleção separada para NFTs mintados

/**
 * GET handler para buscar stadiums que foram realmente mintados na blockchain
 * Usa coleção separada 'minted-stadiums' para performance e clareza
 */
export async function GET(request: Request) {
  try {
    console.log('✅ GET Minted Stadiums - Buscando da coleção minted-stadiums');
    
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const chainId = searchParams.get('chainId') || '80002'; // Default: Polygon Amoy
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const mintedStadiums = db.collection(COLLECTION_NAME);

    // Filtro simples - todos os NFTs nesta coleção já foram mintados
    const filter: any = {};

    // Filtrar por owner se especificado
    if (owner) {
      filter['creator.wallet'] = owner;
    }
    
    console.log('🔍 Buscando na coleção:', COLLECTION_NAME);
    console.log('🔍 Filtro aplicado:', JSON.stringify(filter, null, 2));

    // Estatísticas da coleção
    const totalMintedStadiums = await mintedStadiums.countDocuments({});
    const ownerMintedStadiums = owner ? await mintedStadiums.countDocuments(filter) : totalMintedStadiums;
    
    console.log('📊 MINTED STADIUMS STATS:');
    console.log(`Total minted stadiums: ${totalMintedStadiums}`);
    console.log(`Owner minted stadiums: ${ownerMintedStadiums}`);

    // Buscar NFTs mintados
    const stadiums = await mintedStadiums
      .find(filter)
      .sort({ mintedAt: -1, createdAt: -1 }) // Ordenar por data de mint
      .limit(50)
      .toArray();
      
    console.log(`✅ Found ${stadiums.length} minted stadiums`);

    // Processar dados para garantir consistência
    const processedStadiums = stadiums.map(stadium => ({
      ...stadium,
      // Garantir que tenha informações de blockchain
      blockchain: stadium.blockchain || {
        chainId: parseInt(chainId),
        contractAddress: chainId === '80002' 
          ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET 
          : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ,
        transactionHash: stadium.transactionHash,
        tokenId: stadium.tokenId || stadium.blockchain?.tokenId,
        explorerUrl: stadium.transactionHash 
          ? `https://amoy.polygonscan.com/tx/${stadium.transactionHash}`
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
    if (processedStadiums.length > 0) {
      console.log('📋 Minted Stadium NFTs:');
      processedStadiums.forEach((stadium: any, index) => {
        console.log(`${index + 1}. ${stadium.name || 'Unnamed Stadium'} - Token: ${stadium.blockchain?.tokenId || 'N/A'} - TX: ${stadium.transactionHash?.slice(0, 10)}...`);
      });
    } else {
      console.log('⚠️ No minted stadiums found in minted-stadiums collection');
    }

    return NextResponse.json({
      success: true,
      total: processedStadiums.length,
      chainId: parseInt(chainId),
      network: chainId === '80002' ? 'Polygon Amoy' : 'CHZ Chain',
      data: processedStadiums,
      collection: COLLECTION_NAME,
      filters: {
        owner: owner || 'all',
        onlyMinted: true,
        separateCollection: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching minted stadiums:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch minted stadiums',
      details: error instanceof Error ? error.message : 'Unknown error',
      collection: COLLECTION_NAME
    }, { status: 500 });
  }
}

/**
 * POST handler para mover um stadium para a coleção de mintados
 * Chamado quando um NFT é mintado com sucesso
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stadiumId, transactionHash, tokenId, chainId = 80002 } = body;
    
    console.log('🔄 Movendo stadium para coleção de mintados:', {
      stadiumId,
      transactionHash,
      tokenId,
      chainId
    });

    if (!stadiumId || !transactionHash) {
      return NextResponse.json({ 
        success: false,
        error: 'stadiumId e transactionHash são obrigatórios'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const stadiumsCollection = db.collection('stadiums');
    const mintedStadiumsCollection = db.collection(COLLECTION_NAME);

    // Buscar o stadium original
    const originalStadium = await stadiumsCollection.findOne({ _id: stadiumId });
    
    if (!originalStadium) {
      return NextResponse.json({ 
        success: false,
        error: 'Stadium não encontrado'
      }, { status: 404 });
    }

    // Criar documento para coleção de mintados
    const mintedStadium = {
      ...originalStadium,
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
    await mintedStadiumsCollection.insertOne(mintedStadium);

    // Opcional: Marcar como mintado na coleção original (para histórico)
    await stadiumsCollection.updateOne(
      { _id: stadiumId },
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

    console.log('✅ Stadium movido com sucesso para coleção de mintados');

    return NextResponse.json({
      success: true,
      message: 'Stadium movido para coleção de mintados com sucesso',
      data: {
        stadiumId,
        transactionHash,
        tokenId,
        collection: COLLECTION_NAME
      }
    });

  } catch (error) {
    console.error('❌ Error moving stadium to minted collection:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to move stadium to minted collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 