import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

// ✅ FUNÇÕES UTILITÁRIAS UTC PARA BACKEND
function getCurrentUTC(): Date {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
}

function addDaysToUTC(days: number, baseDate?: Date): Date {
  const base = baseDate || getCurrentUTC();
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 POST /api/launchpad/pending-images/[id]/approve chamado')
    console.log('📥 ID da imagem:', params.id)
    
    const data = await request.json();
    console.log('📥 Dados recebidos:', JSON.stringify(data, null, 2))
    
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
    
    // 2. Criar nova coleção baseada na imagem pendente
    // ✅ CORRIGIDO: Usar funções utilitárias UTC
    const nowUTC = getCurrentUTC();
    const defaultLaunchDate = addDaysToUTC(7);
    
    const newCollection = {
      name: pendingImage.name,
      description: pendingImage.description,
      image: pendingImage.imageUrl, // Campo usado pelo frontend para exibir imagem
      imageUrl: pendingImage.imageUrl, // Campo original
      category: pendingImage.category,
      price: pendingImage.price,
      maxSupply: pendingImage.maxSupply,
      totalSupply: pendingImage.maxSupply, // Campo usado pelo frontend para supply
      creator: pendingImage.creator,
      metadata: pendingImage.metadata,
      traits: pendingImage.traits,
      tags: pendingImage.tags,
      type: 'launchpad',
      status: data.status || 'upcoming',
      launchDate: data.launchDate || defaultLaunchDate.toISOString(),
      createdAt: nowUTC,
      updatedAt: nowUTC
    };
    
    console.log('💾 Criando nova coleção...')
    const collectionResult = await db.collection('collections').insertOne(newCollection);
    console.log('✅ Coleção criada com ID:', collectionResult.insertedId.toString())
    
    // 3. Remover a imagem pendente - ✅ CORRIGIDO: Usar ObjectId
    console.log('🗑️ Removendo imagem pendente...')
    await db.collection('pending_launchpad_images').deleteOne({
      _id: new ObjectId(params.id)
    });
    console.log('✅ Imagem pendente removida')
    
    const response = {
      success: true,
      collectionId: collectionResult.insertedId.toString(),
      message: 'Image approved and converted to collection'
    }
    
    console.log('📤 Retornando resposta:', response)
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error approving pending image:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to approve pending image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log('📤 Retornando erro:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 