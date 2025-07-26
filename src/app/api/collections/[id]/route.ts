import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * GET - Buscar coleção por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const isAdmin = request.nextUrl.searchParams.get('isAdmin') === 'true';
    
    console.log(`📋 GET Collection by ID: ${collectionId}`);
    
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleção
    const collection = await db.collection('collections').findOne({
      _id: new ObjectId(collectionId)
    });
    
    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    // Se não for admin, verificar se a coleção está visível
    if (!isAdmin) {
      const isVisible = 
        (collection.type === 'launchpad' && ['upcoming', 'active'].includes(collection.status)) ||
        (collection.type === 'marketplace' && collection.status === 'active');
      
      if (!isVisible) {
        return NextResponse.json(
          { success: false, error: 'Collection not available' },
          { status: 403 }
        );
      }
    }
    
    console.log(`✅ Found collection: ${collection.name}`);
    
    return NextResponse.json({
      success: true,
      collection
    });
    
  } catch (error) {
    console.error('❌ Error fetching collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualizar coleção por ID (apenas admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const updates = await request.json();
    
    console.log(`🔧 PATCH Collection by ID: ${collectionId}`);
    
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