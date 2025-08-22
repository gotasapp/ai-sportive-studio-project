import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Investigating collections in launchpad...');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'launchpad';
    const status = searchParams.get('status') || 'active';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Verificar coleções na collection 'launchpad_collections'
    const launchpadCollections = await db.collection('launchpad_collections')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Verificar coleções na collection 'collections'
    const allCollections = await db.collection('collections')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Filtrar coleções do launchpad
    const launchpadFromCollections = allCollections.filter(c => 
      c.type === 'launchpad' || c.status === 'active' || c.status === 'upcoming'
    );
    
    console.log(`🔍 Found ${launchpadCollections.length} collections in launchpad_collections`);
    console.log(`🔍 Found ${launchpadFromCollections.length} launchpad collections in collections`);
    
    // Identificar coleções problemáticas (sem contractAddress ou com dados inconsistentes)
    const problematicCollections = launchpadCollections.filter(c => 
      !c.contractAddress || 
      !c.name || 
      !c.image ||
      c.status === 'pending_launchpad'
    );
    
    // Estatísticas
    const stats = {
      totalLaunchpadCollections: launchpadCollections.length,
      totalCollections: allCollections.length,
      launchpadFromCollections: launchpadFromCollections.length,
      problematicCollections: problematicCollections.length,
      byStatus: launchpadCollections.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCollection: allCollections.reduce((acc, c) => {
        acc[c.type || 'unknown'] = (acc[c.type || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return NextResponse.json({
      success: true,
      count: launchpadCollections.length,
      stats,
      launchpadCollections: launchpadCollections.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        contractAddress: c.contractAddress,
        image: c.image,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      problematicCollections: problematicCollections.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        contractAddress: c.contractAddress,
        image: c.image,
        createdAt: c.createdAt
      })),
      allCollections: allCollections.map(c => ({
        _id: c._id,
        name: c.name,
        type: c.type,
        status: c.status,
        contractAddress: c.contractAddress,
        createdAt: c.createdAt
      }))
    });
    
  } catch (error) {
    console.error('❌ Error investigating collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to investigate collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Cleaning problematic collections...');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action !== 'clean') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Deletar coleções problemáticas (sem contractAddress ou com status pending_launchpad)
    const result = await db.collection('launchpad_collections').deleteMany({
      $or: [
        { contractAddress: { $exists: false } },
        { contractAddress: null },
        { contractAddress: '' },
        { status: 'pending_launchpad' },
        { name: { $exists: false } },
        { image: { $exists: false } }
      ]
    });
    
    console.log(`✅ Cleaned ${result.deletedCount} problematic collections`);
    
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned ${result.deletedCount} problematic collections`
    });
    
  } catch (error) {
    console.error('❌ Error cleaning collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean collections' },
      { status: 500 }
    );
  }
} 