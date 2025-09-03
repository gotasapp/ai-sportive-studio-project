import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * POST - Ativar coleção para launchpad
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST Activate Launchpad - Ativando coleção para launchpad');
    
    const { collectionId, status = 'upcoming', launchDate } = await request.json();
    
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Verificar se a coleção existe
    const existingCollection = await db.collection('collections').findOne({
      _id: new ObjectId(collectionId)
    });
    
    if (!existingCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    // Preparar dados de atualização
    const updateData: any = {
      type: 'launchpad',
      status: status,
      updatedAt: new Date()
    };
    
    // Adicionar data de lançamento se fornecida
    if (launchDate) {
      updateData.launchDate = new Date(launchDate);
    }
    
    // Se está ativando ou marcando como upcoming, registrar aprovação
    if (status === 'upcoming' || status === 'active') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = 'admin'; // TODO: pegar do usuário logado
    }
    
    // Se está ativando, definir data de lançamento como agora se não foi fornecida
    if (status === 'active' && !launchDate) {
      updateData.launchDate = new Date();
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
    
    console.log(`✅ Activated collection ${collectionId} for launchpad (status: ${status})`);
    
    // Buscar coleção atualizada
    const updatedCollection = await db.collection('collections').findOne({
      _id: new ObjectId(collectionId)
    });
    
    return NextResponse.json({
      success: true,
      updated: result.modifiedCount > 0,
      collection: updatedCollection,
      message: `Collection activated for launchpad with status: ${status}`
    });
    
  } catch (error) {
    console.error('❌ Error activating collection for launchpad:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate collection for launchpad' },
      { status: 500 }
    );
  }
}

/**
 * GET - Verificar status de ativação de uma coleção
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');
    
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
    
    // Verificar se está no launchpad
    const isLaunchpad = collection.type === 'launchpad';
    const isVisible = isLaunchpad && (collection.status === 'upcoming' || collection.status === 'active');
    
    return NextResponse.json({
      success: true,
      collection: {
        id: collection._id,
        name: collection.name,
        type: collection.type,
        status: collection.status,
        isLaunchpad,
        isVisible,
        launchDate: collection.launchDate,
        approvedAt: collection.approvedAt,
        approvedBy: collection.approvedBy
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking collection launchpad status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check collection status' },
      { status: 500 }
    );
  }
} 