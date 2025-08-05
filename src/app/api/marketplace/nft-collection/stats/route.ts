import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getContract, readContract } from 'thirdweb';
import { thirdwebClient } from '@/lib/thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { ObjectId } from 'mongodb';

// Mapear endereço do contrato por coleção
// 🎯 SOLUÇÃO SEGURA: Tentar ambas as variáveis para máxima compatibilidade
const CONTRACT_ADDRESSES: Record<string, string> = {
  jerseys: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || 
           process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || 
           '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  stadiums: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || 
            process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || 
            '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  badges: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || 
          process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || 
          '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
};

// Função para verificar se é um ObjectId válido
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * GET /api/marketplace/nft-collection/stats?collection=jerseys|stadiums|badges|{customCollectionId}
 * Retorna stats agregados: totalSupply, mintedNFTs, activity (salesVolume, transactions)
 * Agora suporta custom collections por ID
 */
export async function GET(request: NextRequest) {
  try {
    const collection = request.nextUrl.searchParams.get('collection');
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Missing collection parameter' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'chz-app-db');

    // Verificar se é um custom collection ID
    if (isValidObjectId(collection)) {
      return await getCustomCollectionStats(db, collection);
    }

    // Caso contrário, continuar com a lógica original para standard collections
    return await getStandardCollectionStats(db, collection);
  } catch (error) {
    console.error('Error in nft-collection stats endpoint:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

// Função para buscar stats de custom collection
async function getCustomCollectionStats(db: any, customCollectionId: string) {
  try {
    console.log('🔍 Buscando stats para custom collection:', customCollectionId);

    // Buscar a custom collection
    const customCollection = await db.collection('custom_collections').findOne({
      _id: new ObjectId(customCollectionId)
    });

    if (!customCollection) {
      return NextResponse.json({ success: false, error: 'Custom collection not found' }, { status: 404 });
    }

    // Buscar NFTs mintadas desta coleção
    const mintedNFTs = await db.collection('custom_collection_mints')
      .find({ customCollectionId: new ObjectId(customCollectionId) })
      .toArray();

    // Calcular stats
    const totalSupply = customCollection.totalSupply || 0;
    const mintedCount = mintedNFTs.length;
    const uniqueOwners = [...new Set(mintedNFTs.map(nft => nft.minterAddress))].length;
    const contractsUsed = [...new Set(mintedNFTs.map(nft => nft.contractAddress))].length;

    console.log('✅ Custom collection stats calculadas:', {
      name: customCollection.name,
      totalSupply,
      mintedCount,
      uniqueOwners
    });

    return NextResponse.json({
      success: true,
      totalSupply,
      mintedNFTs: mintedCount,
      activity: {
        salesVolume: 0, // TODO: Implementar quando houver sistema de vendas para custom collections
        transactions: mintedCount
      },
      // Dados extras específicos para custom collections
      customCollection: {
        name: customCollection.name,
        description: customCollection.description,
        image: customCollection.imageUrl,
        category: customCollection.category,
        teamName: customCollection.teamName,
        uniqueOwners,
        contractsUsed,
        mintedNFTs: mintedNFTs.map(nft => ({
          tokenId: nft.tokenId,
          owner: nft.minterAddress,
          contractAddress: nft.contractAddress,
          mintedAt: nft.mintedAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching custom collection stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch custom collection stats' }, { status: 500 });
  }
}

// Função para buscar stats de standard collection (lógica original)
async function getStandardCollectionStats(db: any, collection: string) {
  try {
    // 1. Buscar totalSupply do contrato (com fallback inteligente)
    let totalSupply = 0;
    const contractAddress = CONTRACT_ADDRESSES[collection];
    
    console.log(`🔧 Debug contractAddress for ${collection}:`, {
      contractAddress,
      hasAddress: !!contractAddress,
      addressLength: contractAddress?.length,
      env_NFT_COLLECTION: !!process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS,
      env_NFT_DROP: !!process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET
    });

    if (contractAddress && contractAddress !== '') {
      try {
        console.log(`🔗 Connecting to contract ${contractAddress} for ${collection}`);
        const contract = getContract({
          address: contractAddress,
          chain: polygonAmoy,
          client: thirdwebClient
        });
        const supply = await readContract({
          contract,
          method: 'function totalSupply() view returns (uint256)',
          params: []
        });
        totalSupply = Number(supply);
        console.log(`✅ Contract totalSupply for ${collection}: ${totalSupply}`);
      } catch (err) {
        console.error(`⚠️ Erro ao buscar totalSupply do contrato para ${collection}:`, err);
        console.log(`🔄 Usando fallback MongoDB para ${collection}`);
        totalSupply = 0; // Será definido pelo fallback abaixo
      }
    } else {
      console.log(`⚠️ Contrato não configurado para ${collection}, usando dados MongoDB`);
    }

    // 2. Contar NFTs mintadas (MongoDB)
    let mintedNFTs = 0;
    const nftCollection = db.collection(collection);
    const mintedFilter = {
      status: 'Approved',
      $or: [
        { transactionHash: { $exists: true, $nin: [null, ''] } },
        { isMinted: true },
        { mintStatus: 'minted' },
        { mintStatus: 'success' }
      ]
    };
    mintedNFTs = await nftCollection.countDocuments(mintedFilter);

    // 3. Calcular activity (volume de vendas e número de transações, MongoDB)
    let salesVolume = 0;
    let transactions = 0;
    try {
      const salesCollection = db.collection('sales');
      // Filtrar vendas pela coleção
      const salesFilter = { collection };
      // Buscar todas as vendas da coleção
      const sales = await salesCollection.find(salesFilter).toArray();
      transactions = sales.length;
      salesVolume = sales.reduce((sum, sale) => sum + (Number(sale.price) || 0), 0);
    } catch (err) {
      console.error(`Erro ao buscar activity (sales) para ${collection}:`, err);
      salesVolume = 0;
      transactions = 0;
    }

    console.log(`📊 MongoDB count results for ${collection}:`, {
      mintedNFTs,
      totalSupply: totalSupply,
      needsFallback: totalSupply === 0 && mintedNFTs > 0
    });

    // 🔄 FALLBACK INTELIGENTE: Se totalSupply é 0, usar dados do MongoDB
    if (totalSupply === 0 && mintedNFTs > 0) {
      // Para coleções sem contrato ou com erro, usar mintedNFTs como base para totalSupply
      totalSupply = mintedNFTs;
      console.log(`🔄 Fallback totalSupply para ${collection}: ${totalSupply} (baseado em mintedNFTs)`);
    } else if (totalSupply === 0 && mintedNFTs === 0) {
      console.log(`⚠️ PROBLEMA: Tanto totalSupply quanto mintedNFTs são 0 para ${collection}`);
    }

    return NextResponse.json({
      success: true,
      totalSupply,
      mintedNFTs,
      activity: {
        salesVolume,
        transactions
      }
    });

  } catch (error) {
    console.error('❌ Error fetching standard collection stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch standard collection stats' }, { status: 500 });
  }
} 