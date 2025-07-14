import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getContract, readContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';

// Mapear endereço do contrato por coleção
const CONTRACT_ADDRESSES: Record<string, string> = {
  jerseys: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  stadiums: process.env.NEXT_PUBLIC_STADIUMS_CONTRACT_POLYGON_TESTNET || '',
  badges: process.env.NEXT_PUBLIC_BADGES_CONTRACT_POLYGON_TESTNET || ''
};

/**
 * GET /api/marketplace/nft-collection/stats?collection=jerseys|stadiums|badges
 * Retorna stats agregados: totalSupply, mintedNFTs, activity (salesVolume, transactions)
 */
export async function GET(request: NextRequest) {
  try {
    const collection = request.nextUrl.searchParams.get('collection');
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Missing collection parameter' }, { status: 400 });
    }

    // 1. Buscar totalSupply do contrato
    let totalSupply = 0;
    const contractAddress = CONTRACT_ADDRESSES[collection];
    if (contractAddress) {
      try {
        const contract = getContract({
          address: contractAddress,
          chain: polygonAmoy
        });
        const supply = await readContract({
          contract,
          method: 'function totalSupply() view returns (uint256)',
          params: []
        });
        totalSupply = Number(supply);
      } catch (err) {
        console.error(`Erro ao buscar totalSupply do contrato para ${collection}:`, err);
        totalSupply = 0;
      }
    }

    // 2. Contar NFTs mintadas (MongoDB)
    let mintedNFTs = 0;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'chz-app-db');
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

    return NextResponse.json({
      totalSupply,
      mintedNFTs,
      activity: {
        salesVolume,
        transactions
      }
    });
  } catch (error) {
    console.error('Error in nft-collection stats endpoint:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 