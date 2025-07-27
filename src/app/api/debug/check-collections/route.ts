import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET Check Collections - Verificando coleções no banco');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar todas as coleções do launchpad
    const collections = await db.collection('collections').find({
      type: 'launchpad'
    }).toArray();
    
    console.log(`🔍 Encontradas ${collections.length} coleções do launchpad`);
    
    // Mostrar detalhes de cada coleção
    const details = collections.map(col => ({
      _id: col._id.toString(),
      name: col.name,
      description: col.description,
      status: col.status,
      image: col.image,
      imageUrl: col.imageUrl,
      price: col.price,
      maxSupply: col.maxSupply,
      totalSupply: col.totalSupply,
      type: col.type,
      launchDate: col.launchDate,
      createdAt: col.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      count: collections.length,
      collections: details
    });
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check collections' },
      { status: 500 }
    );
  }
} 