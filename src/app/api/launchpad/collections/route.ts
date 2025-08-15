import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { VISIBLE_LAUNCHPAD_STATUSES } from '@/lib/collection-config';

const DB_NAME = 'chz-app-db';

/**
 * GET - Retornar apenas coleções do launchpad visíveis para usuários
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET Launchpad Collections - Listando coleções visíveis');
    
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const status = searchParams.get('status'); // 'upcoming' | 'active' | 'all'
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Construir filtro base - buscar coleções deployadas
    const filter: any = {
      deployed: true
    };
    
    // Filtrar por status
    if (status && status !== 'all') {
      filter.status = status;
    } else {
      // Por padrão, apenas status visíveis
      filter.status = { $in: VISIBLE_LAUNCHPAD_STATUSES };
    }
    
    // Filtrar por categoria
    if (category) {
      filter.category = category;
    }
    
    // Busca por texto
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'creator.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Buscar coleções
    const collections = await db.collection('launchpad_collections')
      .find(filter)
      .sort({ 
        // Ordenar por: upcoming primeiro (por data de lançamento), depois active
        status: 1,
        launchDate: 1,
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total para paginação
    const total = await db.collection('launchpad_collections').countDocuments(filter);
    
    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Separar coleções por status para facilitar o frontend
    const activeCollections = collections.filter(c => c.status === 'active');
    const upcomingCollections = collections.filter(c => c.status === 'upcoming');
    
    // Estatísticas
    const stats = {
      total: collections.length,
      active: activeCollections.length,
      upcoming: upcomingCollections.length,
      totalPages,
      currentPage: page
    };
    
    console.log(`✅ Launchpad found ${collections.length} collections (${activeCollections.length} active, ${upcomingCollections.length} upcoming)`);
    
    return NextResponse.json({
      success: true,
      collections,
      activeCollections,
      upcomingCollections,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats,
      filters: {
        status,
        category,
        search
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching launchpad collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch launchpad collections' },
      { status: 500 }
    );
  }
} 