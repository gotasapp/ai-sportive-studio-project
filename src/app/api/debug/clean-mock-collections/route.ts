import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * POST - Limpar coleções mock do banco
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 POST Clean Mock Collections - Limpando coleções mock');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleções mock (sem imagem ou com dados padrão)
    const mockCollections = await db.collection('collections').find({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { name: 'Jersey para Launchpad' },
        { description: 'Imagem enviada para aprovação' }
      ]
    }).toArray();
    
    console.log(`🔍 Encontradas ${mockCollections.length} coleções mock para limpar`);
    
    if (mockCollections.length > 0) {
      // Deletar coleções mock
      const result = await db.collection('collections').deleteMany({
        $or: [
          { image: { $exists: false } },
          { image: null },
          { name: 'Jersey para Launchpad' },
          { description: 'Imagem enviada para aprovação' }
        ]
      });
      
      console.log(`✅ Deletadas ${result.deletedCount} coleções mock`);
      
      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `Cleaned ${result.deletedCount} mock collections`
      });
    } else {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No mock collections found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error cleaning mock collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean mock collections' },
      { status: 500 }
    );
  }
}

/**
 * GET - Listar coleções mock para verificação
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET Clean Mock Collections - Listando coleções mock');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleções mock
    const mockCollections = await db.collection('collections').find({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { name: 'Jersey para Launchpad' },
        { description: 'Imagem enviada para aprovação' }
      ]
    }).toArray();
    
    console.log(`🔍 Encontradas ${mockCollections.length} coleções mock`);
    
    return NextResponse.json({
      success: true,
      mockCollections,
      count: mockCollections.length
    });
    
  } catch (error) {
    console.error('❌ Error listing mock collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list mock collections' },
      { status: 500 }
    );
  }
} 