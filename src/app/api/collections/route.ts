import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, CreateCollectionRequest } from '@/types';
import { validateCreateCollectionData, isLaunchpadVisible, isMarketplaceVisible } from '@/lib/collection-utils';
import { COLLECTION_PAGINATION, COLLECTION_SORT_OPTIONS } from '@/lib/collection-config';

const DB_NAME = 'chz-app-db';

/**
 * GET - Listar coleções com filtros
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET Collections - Listando coleções');
    
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const type = searchParams.get('type'); // 'marketplace' | 'launchpad'
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const creatorWallet = searchParams.get('creatorWallet');
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || COLLECTION_PAGINATION.DEFAULT_LIMIT.toString()),
      COLLECTION_PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    
    // Parâmetros de ordenação
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Construir filtro
    const filter: any = {};
    
    // Filtrar por tipo
    if (type) {
      filter.type = type;
    }
    
    // Filtrar por status
    if (status) {
      filter.status = status;
    }
    
    // Filtrar por categoria
    if (category) {
      filter.category = category;
    }
    
    // Filtrar por criador
    if (creatorWallet) {
      filter['creator.wallet'] = creatorWallet.toLowerCase();
    }
    
    // Se não for admin, aplicar filtros de visibilidade
    if (!isAdmin) {
      if (type === 'launchpad') {
        // Para launchpad: apenas upcoming e active
        filter.status = { $in: ['upcoming', 'active'] };
      } else if (type === 'marketplace') {
        // Para marketplace: apenas active
        filter.status = 'active';
      } else {
        // Se não especificou tipo, incluir ambos com filtros de visibilidade
        filter.$or = [
          { type: 'launchpad', status: { $in: ['upcoming', 'active'] } },
          { type: 'marketplace', status: 'active' }
        ];
      }
    }
    
    // Construir ordenação
    const sort: any = {};
    if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'launchDate') {
      sort.launchDate = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'minted') {
      sort.minted = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default
    }
    
    // Buscar coleções
    const collections = await db.collection('collections')
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total para paginação
    const total = await db.collection('collections').countDocuments(filter);
    
    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    console.log(`✅ Found ${collections.length} collections (page ${page}/${totalPages})`);
    
    return NextResponse.json({
      success: true,
      collections,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        type,
        status,
        category,
        creatorWallet
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar nova coleção
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST Collections - Criando nova coleção');
    
    const data: CreateCollectionRequest = await request.json();
    
    // Validar dados
    const validation = validateCreateCollectionData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid collection data',
          details: validation.errors 
        },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Preparar documento da coleção (sem _id para que MongoDB gere automaticamente)
    const collectionData = {
      ...data,
      type: data.type || 'marketplace',
      status: data.type === 'launchpad' ? 'pending_launchpad' : 'draft',
      minted: 0,
      marketplaceEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Inserir no banco
    const result = await db.collection('collections').insertOne(collectionData);
    
    console.log(`✅ Created collection: ${collectionData.name} (ID: ${result.insertedId})`);
    
    return NextResponse.json({
      success: true,
      collectionId: result.insertedId.toString(),
      collection: {
        ...collectionData,
        _id: result.insertedId.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    );
  }
} 