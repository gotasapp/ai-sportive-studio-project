import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGGING AUTO-DEPLOY FLOW');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 1. Verificar se há imagens pendentes que deveriam ter virado coleções
    const pendingImages = await db.collection('pending_launchpad_images')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // 2. Verificar coleções criadas recentemente
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentCollections = await db.collection('launchpad_collections')
      .find({ createdAt: { $gte: yesterday } })
      .sort({ createdAt: -1 })
      .toArray();
    
    // 3. Verificar logs de deployment (se existir tabela de logs)
    let deploymentLogs: any[] = [];
    try {
      deploymentLogs = await db.collection('deployment_logs')
        .find({})
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray();
    } catch (e) {
      // Tabela pode não existir
    }
    
    // 4. Verificar se há coleções sem contractAddress (não deployadas)
    const undeployedCollections = await db.collection('launchpad_collections')
      .find({ 
        $or: [
          { contractAddress: { $exists: false } },
          { contractAddress: null },
          { contractAddress: "" },
          { deployed: { $ne: true } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    // 5. Verificar estrutura de uma coleção típica
    const sampleCollection = await db.collection('launchpad_collections')
      .findOne({}, { sort: { createdAt: -1 } });
    
    // 6. Verificar o fluxo completo: pending -> collection -> deployed
    const flowAnalysis = {
      step1_pendingImages: pendingImages.length,
      step2_undeployedCollections: undeployedCollections.length,
      step3_deployedCollections: recentCollections.filter(c => c.deployed).length,
      step4_withContract: recentCollections.filter(c => c.contractAddress).length
    };
    
    return NextResponse.json({
      success: true,
      autoDeployFlow: {
        pendingImages: {
          count: pendingImages.length,
          recent: pendingImages.map(img => ({
            _id: img._id,
            imageUrl: img.imageUrl ? 'EXISTS' : 'MISSING',
            category: img.category,
            status: img.status,
            createdAt: img.createdAt,
            metadata: img.metadata ? Object.keys(img.metadata) : []
          }))
        },
        
        recentCollections: {
          count: recentCollections.length,
          collections: recentCollections.map(c => ({
            _id: c._id,
            name: c.name,
            contractAddress: c.contractAddress || 'NOT_DEPLOYED',
            deployed: c.deployed || false,
            status: c.status,
            createdAt: c.createdAt,
            deployedAt: c.deployedAt || null
          }))
        },
        
        undeployedCollections: {
          count: undeployedCollections.length,
          collections: undeployedCollections.map(c => ({
            _id: c._id,
            name: c.name,
            status: c.status,
            createdAt: c.createdAt,
            hasContract: !!c.contractAddress,
            deployed: c.deployed || false
          }))
        },
        
        flowAnalysis,
        
        sampleCollectionStructure: sampleCollection ? {
          fields: Object.keys(sampleCollection),
          hasRequiredFields: {
            name: !!sampleCollection.name,
            contractAddress: !!sampleCollection.contractAddress,
            deployed: !!sampleCollection.deployed,
            status: !!sampleCollection.status,
            image: !!sampleCollection.image
          }
        } : null,
        
        deploymentLogs: deploymentLogs.length > 0 ? deploymentLogs : 'NO_LOGS_TABLE'
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging auto-deploy flow:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
