import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * POST - Salvar imagem pendente para o Launchpad
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST Pending Images - Salvando imagem para aprovação do Launchpad');
    
    const data = await request.json();
    
    // Validar dados obrigatórios
    if (!data.imageUrl || !data.category || !data.metadata) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: imageUrl, category, metadata' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Preparar documento da imagem pendente
    const pendingImage = {
      imageUrl: data.imageUrl,
      category: data.category, // 'jerseys' | 'stadiums' | 'badges'
      metadata: data.metadata, // Dados da geração (team, player, style, etc.)
      status: 'pending_launchpad',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Campos opcionais
      description: data.description || '',
      price: data.price || '0.1',
      maxSupply: data.maxSupply || 100,
      creator: data.creator || {
        name: 'Admin',
        wallet: '0x0000000000000000000000000000000000000000'
      }
    };
    
    // Inserir no banco
    const result = await db.collection('pending_launchpad_images').insertOne(pendingImage);
    
    console.log(`✅ Saved pending image for launchpad: ${data.category} (ID: ${result.insertedId})`);
    
    return NextResponse.json({
      success: true,
      pendingImageId: result.insertedId.toString(),
      message: 'Image saved for admin approval'
    });
    
  } catch (error) {
    console.error('❌ Error saving pending image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save pending image' },
      { status: 500 }
    );
  }
}

/**
 * GET - Listar imagens pendentes (apenas para admin)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET Pending Images - Listando imagens pendentes para admin');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Construir filtro
    const filter: any = { status: 'pending_launchpad' };
    if (category) {
      filter.category = category;
    }
    
    // Buscar imagens pendentes
    const pendingImages = await db.collection('pending_launchpad_images')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total para paginação
    const total = await db.collection('pending_launchpad_images').countDocuments(filter);
    
    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    console.log(`✅ Found ${pendingImages.length} pending images (page ${page}/${totalPages})`);
    
    return NextResponse.json({
      success: true,
      pendingImages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching pending images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending images' },
      { status: 500 }
    );
  }
} 