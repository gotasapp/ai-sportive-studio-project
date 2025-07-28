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
      creatorAvatar: '/api/placeholder/40/40', // Placeholder por enquanto
      contractAddress: '0x1234...5678', // Placeholder por enquanto
      launchDate: collection.launchDate,
      endDate: collection.launchDate ? new Date(new Date(collection.launchDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null, // 30 dias após launch
      website: null,
      twitter: null,
      discord: null,
      price: collection.price,
      maxSupply: collection.maxSupply,
      type: collection.type,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      // Dados mockados para funcionalidades que ainda não implementamos
      mintStages: [
        {
          id: 'public',
          name: 'Public',
          description: 'Open to everyone',
          price: collection.price || '0.1 CHZ',
          walletLimit: 3,
          status: collection.status === 'active' ? 'live' : 'upcoming',
          startTime: collection.launchDate,
          endTime: collection.launchDate ? new Date(new Date(collection.launchDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        }
      ],
      vision: collection.description || 'A unique collection created through our AI-powered platform.',
      utility: [
        'Exclusive access to community events',
        'Priority access to future NFT drops',
        'Special discounts on merchandise',
        'Access to holder-only channels'
      ],
      team: [
        {
          name: collection.creator?.name || 'Creator',
          role: 'Creator',
          avatar: '/api/placeholder/60/60',
          bio: 'Creator of this unique collection'
        }
      ],
      roadmap: [
        {
          phase: 'Phase 1',
          title: 'Collection Launch',
          description: 'Launch of unique NFT collection',
          status: 'completed'
        },
        {
          phase: 'Phase 2',
          title: 'Utility Activation',
          description: 'Activate exclusive holder benefits',
          status: 'in-progress'
        },
        {
          phase: 'Phase 3',
          title: 'Community Expansion',
          description: 'Expand community and partnerships',
          status: 'upcoming'
        }
      ]
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