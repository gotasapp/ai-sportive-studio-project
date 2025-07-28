import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 GET Launchpad Collection by ID:', params.id);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleção específica
    let collection;
    try {
      collection = await db.collection('collections').findOne({
        _id: new ObjectId(params.id),
        type: 'launchpad'
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
    
    // Formatar dados para o frontend
    const formattedCollection = {
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      image: collection.image,
      imageUrl: collection.imageUrl,
      bannerImage: collection.image, // Usar a mesma imagem como banner por enquanto
      status: collection.status,
      category: collection.category,
      totalSupply: collection.totalSupply || collection.maxSupply,
      minted: collection.minted || 0,
      creator: collection.creator?.name || 'Unknown',
      creatorAvatar: collection.creatorAvatar,
      contractAddress: collection.contractAddress,
      launchDate: collection.launchDate,
      endDate: collection.launchDate ? new Date(new Date(collection.launchDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null, // 30 dias após launch
      website: collection.website,
      twitter: collection.twitter,
      discord: collection.discord,
      price: collection.price,
      maxSupply: collection.maxSupply,
      type: collection.type,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      // Dados reais do banco (sem fallbacks mockados)
      mintStages: collection.mintStages,
      vision: collection.vision,
      utility: collection.utility,
      team: collection.team,
      roadmap: collection.roadmap
    };
    
    return NextResponse.json({
      success: true,
      collection: formattedCollection
    });
    
  } catch (error) {
    console.error('❌ Error fetching collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
} 