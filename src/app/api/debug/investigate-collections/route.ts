import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * GET - Investigar coleções ativas para debug
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET Investigate Collections - Analisando coleções ativas');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'launchpad';
    const status = searchParams.get('status') || 'active';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleções com filtros específicos
    const collections = await db.collection('collections').find({
      type: type,
      status: status
    }).toArray();
    
    console.log(`🔍 Encontradas ${collections.length} coleções ${type} com status ${status}`);
    
    // Analisar cada coleção
    const analysis = collections.map(collection => ({
      _id: collection._id,
      name: collection.name,
      description: collection.description,
      hasImage: !!collection.image,
      hasImageUrl: !!collection.imageUrl,
      image: collection.image,
      imageUrl: collection.imageUrl,
      price: collection.price,
      maxSupply: collection.maxSupply,
      totalSupply: collection.totalSupply,
      minted: collection.minted,
      type: collection.type,
      status: collection.status,
      launchDate: collection.launchDate,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      // Verificar campos críticos
      issues: {
        missingImage: !collection.image,
        missingImageUrl: !collection.imageUrl,
        missingPrice: !collection.price,
        missingSupply: !collection.maxSupply,
        missingTotalSupply: !collection.totalSupply,
        zeroSupply: collection.maxSupply === 0,
        zeroTotalSupply: collection.totalSupply === 0,
        defaultName: collection.name === 'Jersey para Launchpad',
        defaultDescription: collection.description === 'Imagem enviada para aprovação'
      }
    }));
    
    // Estatísticas
    const stats = {
      total: collections.length,
      withImage: collections.filter(c => c.image).length,
      withImageUrl: collections.filter(c => c.imageUrl).length,
      withPrice: collections.filter(c => c.price).length,
      withSupply: collections.filter(c => c.maxSupply).length,
      withTotalSupply: collections.filter(c => c.totalSupply).length,
      zeroSupply: collections.filter(c => c.maxSupply === 0).length,
      defaultName: collections.filter(c => c.name === 'Jersey para Launchpad').length,
      defaultDescription: collections.filter(c => c.description === 'Imagem enviada para aprovação').length
    };
    
    // Identificar coleções problemáticas
    const problematicCollections = analysis.filter(c => 
      c.issues.missingImage || 
      c.issues.missingImageUrl || 
      c.issues.missingPrice || 
      c.issues.missingSupply ||
      c.issues.zeroSupply ||
      c.issues.defaultName ||
      c.issues.defaultDescription
    );
    
    return NextResponse.json({
      success: true,
      analysis,
      stats,
      problematicCollections,
      count: collections.length,
      message: `Analisadas ${collections.length} coleções ${type} com status ${status}`
    });
    
  } catch (error) {
    console.error('❌ Error investigating collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to investigate collections' },
      { status: 500 }
    );
  }
}

/**
 * POST - Limpar coleções problemáticas específicas
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 POST Investigate Collections - Limpando coleções problemáticas');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'clean';
    const type = searchParams.get('type') || 'launchpad';
    const status = searchParams.get('status') || 'active';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    if (action === 'clean') {
      // Buscar coleções problemáticas
      const problematicCollections = await db.collection('collections').find({
        type: type,
        status: status,
        $or: [
          { image: { $exists: false } },
          { image: null },
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { name: 'Jersey para Launchpad' },
          { description: 'Imagem enviada para aprovação' },
          { maxSupply: 0 },
          { totalSupply: 0 }
        ]
      }).toArray();
      
      console.log(`🔍 Encontradas ${problematicCollections.length} coleções problemáticas para limpar`);
      
      if (problematicCollections.length > 0) {
        // Deletar coleções problemáticas
        const result = await db.collection('collections').deleteMany({
          type: type,
          status: status,
          $or: [
            { image: { $exists: false } },
            { image: null },
            { imageUrl: { $exists: false } },
            { imageUrl: null },
            { name: 'Jersey para Launchpad' },
            { description: 'Imagem enviada para aprovação' },
            { maxSupply: 0 },
            { totalSupply: 0 }
          ]
        });
        
        console.log(`✅ Deletadas ${result.deletedCount} coleções problemáticas`);
        
        return NextResponse.json({
          success: true,
          deletedCount: result.deletedCount,
          message: `Cleaned ${result.deletedCount} problematic collections`
        });
      } else {
        return NextResponse.json({
          success: true,
          deletedCount: 0,
          message: 'No problematic collections found'
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error cleaning problematic collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean collections' },
      { status: 500 }
    );
  }
} 