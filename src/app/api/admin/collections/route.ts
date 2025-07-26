import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { UpdateCollectionRequest } from '@/types';
import { COLLECTION_PAGINATION } from '@/lib/collection-config';
import { isAdminAddress } from '@/lib/admin-config';

const DB_NAME = 'chz-app-db';

/**
 * GET - Retornar todas as coleções do launchpad para admin (incluindo não visíveis)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 GET Admin Collections - Listando todas as coleções do launchpad');
    
    const { searchParams } = new URL(request.url);
    
    // Verificar se é admin
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const adminAddress = searchParams.get('adminAddress');
    
    if (!isAdmin || !adminAddress || !isAdminAddress(adminAddress)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Parâmetros de filtro
    const type = searchParams.get('type'); // 'launchpad' | 'marketplace' | 'all'
    const status = searchParams.get('status'); // qualquer status
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Construir filtro base
    const filter: any = {};
    
    // Filtrar por tipo
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    // Filtrar por status (admin pode ver todos os status)
    if (status && status !== 'all') {
      filter.status = status;
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
    const collections = await db.collection('collections')
      .find(filter)
      .sort({ 
        // Ordenar por: tipo, status, data de criação
        type: 1,
        status: 1,
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total para paginação
    const total = await db.collection('collections').countDocuments(filter);
    
    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Separar coleções por tipo e status
    const launchpadCollections = collections.filter(c => c.type === 'launchpad');
    const marketplaceCollections = collections.filter(c => c.type === 'marketplace');
    
    // Estatísticas por status
    const statusStats = collections.reduce((acc, collection) => {
      acc[collection.status] = (acc[collection.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Estatísticas por tipo
    const typeStats = collections.reduce((acc, collection) => {
      acc[collection.type] = (acc[collection.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`✅ Admin found ${collections.length} collections (${launchpadCollections.length} launchpad, ${marketplaceCollections.length} marketplace)`);
    
    return NextResponse.json({
      success: true,
      collections,
      launchpadCollections,
      marketplaceCollections,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        total: collections.length,
        byType: typeStats,
        byStatus: statusStats
      },
      filters: {
        type,
        status,
        category,
        search
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin collections' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualizar coleção (apenas admin)
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('🔧 PATCH Admin Collections - Atualizando coleção');
    
    const { collectionId, updates }: { collectionId: string; updates: UpdateCollectionRequest } = await request.json();
    
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Preparar dados de atualização
    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    };
    
    // Se está ativando para marketplace
    if (updates.marketplaceEnabled === true) {
      updateData.marketplaceListedAt = new Date();
    }
    
    // Se está aprovando para launchpad
    if (updates.status === 'upcoming' || updates.status === 'active') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = 'admin'; // TODO: pegar do usuário logado
    }
    
    // Se está mudando para marketplace
    if (updates.type === 'marketplace') {
      updateData.marketplaceEnabled = true;
      updateData.marketplaceListedAt = new Date();
    }
    
    // Atualizar no banco
    const result = await db.collection('collections').updateOne(
      { _id: new ObjectId(collectionId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Updated collection ${collectionId}: ${result.modifiedCount} fields modified`);
    
    // Buscar coleção atualizada
    const updatedCollection = await db.collection('collections').findOne({
      _id: new ObjectId(collectionId)
    });
    
    return NextResponse.json({
      success: true,
      updated: result.modifiedCount > 0,
      collection: updatedCollection
    });
    
  } catch (error) {
    console.error('❌ Error updating collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Deletar coleção (apenas admin)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE Admin Collections - Deletando coleção');
    
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');
    
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Verificar se a coleção existe
    const collection = await db.collection('collections').findOne({
      _id: new ObjectId(collectionId)
    });
    
    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    // Verificar se há NFTs mintados
    if (collection.minted > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete collection with minted NFTs',
          mintedCount: collection.minted
        },
        { status: 400 }
      );
    }
    
    // Deletar coleção
    const result = await db.collection('collections').deleteOne({
      _id: new ObjectId(collectionId)
    });
    
    console.log(`✅ Deleted collection ${collectionId}: ${collection.name}`);
    
    return NextResponse.json({
      success: true,
      deleted: result.deletedCount > 0,
      collectionName: collection.name
    });
    
  } catch (error) {
    console.error('❌ Error deleting collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
} 