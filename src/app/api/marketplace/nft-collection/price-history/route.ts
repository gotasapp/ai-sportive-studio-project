import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/marketplace/nft-collection/price-history?collection=jerseys|stadiums|badges[&tokenId=...]
 * Retorna histórico de vendas: array { date, price }
 */
export async function GET(request: NextRequest) {
  try {
    const collection = request.nextUrl.searchParams.get('collection');
    const tokenId = request.nextUrl.searchParams.get('tokenId');
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Missing collection parameter' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'chz-app-db');
    const salesCollection = db.collection('sales');

    // Montar filtro
    const filter: any = { collection };
    if (tokenId) filter.tokenId = tokenId;

    // Buscar vendas ordenadas por data crescente
    const sales = await salesCollection.find(filter).sort({ date: 1 }).toArray();

    // Mapear para formato { date, price }
    const history = sales.map(sale => ({
      date: sale.date ? new Date(sale.date).toISOString().slice(0, 10) : '',
      price: Number(sale.price) || 0
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error in nft-collection price-history endpoint:', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 