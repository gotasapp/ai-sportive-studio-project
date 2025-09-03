import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * GET /api/marketplace/sales?collection=jerseys|stadiums|badges[&tokenId=...]
 * Retorna dados de vendas reais para price history e activity
 */
export async function GET(request: NextRequest) {
  try {
    const collection = request.nextUrl.searchParams.get('collection');
    const tokenId = request.nextUrl.searchParams.get('tokenId');
    
    console.log('💰 Sales API:', { collection, tokenId });

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // 1. Buscar dados da collection 'sales' se existir
    let salesData: any[] = [];
    
    try {
      const salesCollection = db.collection('sales');
      
      // Montar filtro
      const salesFilter: any = {};
      if (collection) salesFilter.collection = collection;
      if (tokenId) salesFilter.tokenId = tokenId;

      const sales = await salesCollection
        .find(salesFilter)
        .sort({ timestamp: -1, date: -1 })
        .limit(20)
        .toArray();

      salesData = sales.map(sale => ({
        price: sale.price || '0.025',
        date: sale.date || new Date().toISOString(),
        timestamp: sale.timestamp || new Date(sale.date || new Date()).getTime(),
        buyer: sale.buyer || sale.to || '',
        seller: sale.seller || sale.from || '',
        transactionHash: sale.transactionHash || sale.txHash || '',
        volume: sale.volume || '1.0',
        currency: sale.currency || 'CHZ'
      }));

      console.log(`📊 Found ${sales.length} sales records in 'sales' collection`);

    } catch (salesError) {
      console.log('⚠️ Sales collection not found or empty, checking other sources...');
    }

    // 2. Se não houver dados de vendas, buscar transações/listings da própria collection
    if (salesData.length === 0 && collection && tokenId) {
      try {
        const nftCollection = db.collection(collection);
        
        // Buscar NFT específica para verificar transações
        const nft = await nftCollection.findOne({
          $or: [
            { tokenId: tokenId },
            { tokenId: parseInt(tokenId) },
            { blockchainTokenId: tokenId },
            { blockchainTokenId: parseInt(tokenId) }
          ]
        });

        if (nft) {
          // Verificar se tem dados de marketplace
          if (nft.marketplace?.isListed && nft.marketplace?.price) {
            salesData.push({
              price: parseFloat(nft.marketplace.price) / Math.pow(10, 18), // Convert from Wei
              date: nft.marketplace.listedAt || nft.createdAt || new Date().toISOString(),
              timestamp: new Date(nft.marketplace.listedAt || nft.createdAt || new Date()).getTime(),
              buyer: '',
              seller: nft.creator?.wallet || nft.creatorWallet || '',
              transactionHash: nft.transactionHash || '',
              volume: '1.0',
              currency: 'CHZ',
              type: 'listing'
            });
          }

          // Verificar se tem transactionHash (mint)
          if (nft.transactionHash) {
            salesData.push({
              price: '0.0', // Mint is free or low cost
              date: nft.createdAt || new Date().toISOString(),
              timestamp: new Date(nft.createdAt || new Date()).getTime(),
              buyer: nft.creator?.wallet || nft.creatorWallet || '',
              seller: '0x0000000000000000000000000000000000000000',
              transactionHash: nft.transactionHash,
              volume: '1.0',
              currency: 'CHZ',
              type: 'mint'
            });
          }

          console.log(`📊 Generated ${salesData.length} transaction records from NFT data`);
        }
      } catch (nftError) {
        console.log('⚠️ Could not fetch NFT transaction data:', nftError);
      }
    }

    // 3. Se ainda não houver dados, gerar dados mock realísticos baseados na collection
    if (salesData.length === 0) {
      console.log('📊 No real sales data found, generating enhanced mock data...');
      
      // Dados mock mais realísticos baseados no padrão do projeto
      const mockSales = [];
      const now = Date.now();
      const basePrices = {
        jerseys: 0.025,
        stadiums: 0.045,
        badges: 0.015
      };
      
      const basePrice = basePrices[collection as keyof typeof basePrices] || 0.025;
      
      for (let i = 0; i < 5; i++) {
        const daysAgo = i * 3 + Math.random() * 2;
        const saleDate = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));
        const priceVariation = (Math.random() - 0.5) * 0.01; // ±0.005
        const salePrice = Math.max(0.01, basePrice + priceVariation + (i * 0.002));
        
        mockSales.push({
          price: salePrice.toFixed(4),
          date: saleDate.toISOString(),
          timestamp: saleDate.getTime(),
          buyer: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
          seller: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          volume: (1 + Math.random() * 2).toFixed(1),
          currency: 'CHZ',
          type: 'mock_sale'
        });
      }
      
      salesData = mockSales;
      console.log(`📊 Generated ${mockSales.length} mock sales records`);
    }

    // Ordenar por timestamp decrescente
    salesData.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      data: salesData,
      count: salesData.length,
      filters: {
        collection: collection || 'all',
        tokenId: tokenId || 'all'
      },
      source: salesData.length > 0 && salesData[0].type !== 'mock_sale' ? 'database' : 'mock',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in sales API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST para adicionar nova venda (para futuro uso)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, tokenId, price, buyer, seller, transactionHash } = body;

    if (!collection || !tokenId || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: collection, tokenId, price' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const salesCollection = db.collection('sales');

    const saleRecord = {
      collection,
      tokenId: tokenId.toString(),
      price: price.toString(),
      buyer: buyer || '',
      seller: seller || '',
      transactionHash: transactionHash || '',
      date: new Date().toISOString(),
      timestamp: Date.now(),
      currency: 'CHZ',
      createdAt: new Date()
    };

    const result = await salesCollection.insertOne(saleRecord);

    console.log('💰 New sale record created:', {
      id: result.insertedId,
      collection,
      tokenId,
      price
    });

    return NextResponse.json({
      success: true,
      saleId: result.insertedId.toString(),
      data: saleRecord
    });

  } catch (error) {
    console.error('❌ Error creating sale record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create sale record',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 