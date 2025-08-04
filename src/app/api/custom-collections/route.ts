import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      imageUrl,
      category, // "jersey", "stadium", "badge"
      contractAddress, // Cada coleção tem seu próprio contrato
      totalSupply,
      price,
      creatorWallet,
      teamName,
      season,
      subcategoryType // "home", "away", "third" para jerseys
    } = body;

    // Validar campos obrigatórios
    if (!name || !description || !imageUrl || !category || !contractAddress || !creatorWallet) {
      return NextResponse.json({
        error: 'Missing required fields: name, description, imageUrl, category, contractAddress, creatorWallet'
      }, { status: 400 });
    }

    // Conectar ao banco
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');

    // Criar documento da coleção personalizada
    const customCollectionData = {
      name,
      description,
      imageUrl,
      category, // jersey, stadium, badge
      contractAddress, // Contrato único para esta coleção
      totalSupply: totalSupply || 100,
      minted: 0,
      price: price || "0",
      creatorWallet,
      teamName: teamName || '',
      season: season || new Date().getFullYear().toString(),
      subcategoryType: subcategoryType || '', // home, away, third
      status: 'active',
      type: 'custom_collection',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Salvar no MongoDB
    const result = await db.collection('custom_collections').insertOne(customCollectionData);

    console.log('✅ Coleção personalizada criada:', {
      name,
      category,
      contractAddress,
      id: result.insertedId
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      data: customCollectionData
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar coleção personalizada:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create custom collection'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category'); // jersey, stadium, badge
    const subcategoryType = request.nextUrl.searchParams.get('subcategoryType'); // home, away, third
    const teamName = request.nextUrl.searchParams.get('teamName');
    const creatorWallet = request.nextUrl.searchParams.get('creatorWallet');
    const status = request.nextUrl.searchParams.get('status');
    
    // Conectar ao banco
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');

    // Construir query de filtros
    let query: any = {};
    
    if (category) {
      query.category = category;
    }
    if (subcategoryType) {
      query.subcategoryType = subcategoryType;
    }
    if (teamName) {
      query.teamName = { $regex: teamName, $options: 'i' };
    }
    if (creatorWallet) {
      query.creatorWallet = creatorWallet;
    }
    if (status) {
      query.status = status;
    }

    // Buscar coleções personalizadas
    const customCollections = await db.collection('custom_collections')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log('📋 Coleções personalizadas encontradas:', customCollections.length);

    // Separar por categoria para facilitar uso no frontend
    const jerseyCollections = customCollections.filter(c => c.category === 'jersey');
    const stadiumCollections = customCollections.filter(c => c.category === 'stadium');
    const badgeCollections = customCollections.filter(c => c.category === 'badge');

    return NextResponse.json({
      success: true,
      data: customCollections,
      total: customCollections.length,
      categories: {
        jerseys: jerseyCollections,
        stadiums: stadiumCollections,
        badges: badgeCollections
      },
      filters: {
        category,
        subcategoryType,
        teamName,
        creatorWallet,
        status
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar coleções personalizadas:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch custom collections'
    }, { status: 500 });
  }
}