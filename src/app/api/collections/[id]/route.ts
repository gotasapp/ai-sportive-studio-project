import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getCurrentUTC } from '@/lib/collection-utils';

const DB_NAME = 'chz-app-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 GET Collection by ID:', params.id);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    let collection;
    try {
      collection = await db.collection('collections').findOne({
        _id: new ObjectId(params.id)
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (!collection) {
      console.log('❌ Coleção não encontrada');
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Coleção encontrada:', collection.name);
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 PUT Update Collection:', params.id);
    
    const data = await request.json();
    console.log('📥 Dados recebidos:', JSON.stringify(data, null, 2));
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Verificar se a coleção existe
    let existingCollection;
    try {
      existingCollection = await db.collection('collections').findOne({
        _id: new ObjectId(params.id)
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (!existingCollection) {
      console.log('❌ Coleção não encontrada');
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }
    
    // Preparar dados para atualização
    const updateData = {
      ...data,
      updatedAt: getCurrentUTC()
    };
    
    // Remover campos que não devem ser atualizados
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.type;
    
    console.log('💾 Atualizando coleção...');
    const result = await db.collection('collections').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      console.log('⚠️ Nenhuma alteração foi feita');
      return NextResponse.json({
        success: true,
        message: 'No changes were made',
        collectionId: params.id
      });
    }
    
    console.log('✅ Coleção atualizada com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Collection updated successfully',
      collectionId: params.id
    });
    
  } catch (error) {
    console.error('❌ Error updating collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update collection' },
      { status: 500 }
    );
  }
} 