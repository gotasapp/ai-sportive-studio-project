import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 POST /api/launchpad/pending-images/[id]/reject chamado')
    console.log('📥 ID da imagem:', params.id)
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 1. Buscar a imagem pendente - ✅ CORRIGIDO: Usar ObjectId
    let pendingImage;
    try {
      pendingImage = await db.collection('pending_launchpad_images').findOne({
        _id: new ObjectId(params.id)
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (!pendingImage) {
      console.log('❌ Imagem pendente não encontrada')
      return NextResponse.json(
        { success: false, error: 'Pending image not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Imagem pendente encontrada:', pendingImage.name)
    
    // 2. Remover a imagem pendente - ✅ CORRIGIDO: Usar ObjectId
    console.log('🗑️ Removendo imagem pendente...')
    await db.collection('pending_launchpad_images').deleteOne({
      _id: new ObjectId(params.id)
    });
    console.log('✅ Imagem pendente removida')
    
    const response = {
      success: true,
      message: 'Image rejected and removed'
    }
    
    console.log('📤 Retornando resposta:', response)
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error rejecting pending image:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to reject pending image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log('📤 Retornando erro:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 