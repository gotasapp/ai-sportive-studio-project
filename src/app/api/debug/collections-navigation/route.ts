import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar dados que apareceriam no CollectionsTable
    const launchpadCollections = await db.collection('launchpad_collections').find({
      status: 'active'
    }).toArray();
    
    const collections = await db.collection('collections').find({
      status: { $in: ['active', 'upcoming'] }
    }).toArray();
    
    const collectionMints = await db.collection('launchpad_collection_mints').find({}).toArray();

    // Analisar como cada item seria navegado
    const navigationAnalysis = [];
    
    // Launchpad Collections
    launchpadCollections.forEach(item => {
      const analysis = {
        source: 'launchpad_collections',
        _id: item._id,
        name: item.name,
        type: 'launchpad',
        status: item.status,
        contractAddress: item.contractAddress,
        // Detectar como seria navegado
        navigation: {
          isLaunchpad: true,
          shouldGoTo: `/launchpad/${item._id}`,
          category: 'launchpad',
          collectionId: item._id,
          isCustomCollection: true,
          contractType: 'launchpad'
        },
        // Problemas potenciais
        issues: []
      };
      
      if (!item.contractAddress) {
        analysis.issues.push('Sem contractAddress - pode causar problemas');
      }
      
      navigationAnalysis.push(analysis);
    });
    
    // Collections (legacy)
    collections.forEach(item => {
      const analysis = {
        source: 'collections',
        _id: item._id,
        name: item.name,
        type: 'legacy',
        status: item.status,
        contractAddress: item.contractAddress,
        description: item.description,
        // Detectar como seria navegado
        navigation: {
          isLaunchpad: false,
          shouldGoTo: `PROBLEMA: depende da lógica confusa`,
          category: item.category || 'jersey',
          collectionId: item._id,
          tokenId: item.tokenId,
          contractType: 'legacy'
        },
        // Problemas potenciais
        issues: []
      };
      
      if (item.contractAddress?.includes('1234') || item.contractAddress?.includes('5678')) {
        analysis.issues.push('Contrato fake/placeholder - vai dar 404');
      }
      
      if (item.status === 'upcoming') {
        analysis.issues.push('Status upcoming - não deveria aparecer no marketplace?');
      }
      
      navigationAnalysis.push(analysis);
    });

    return NextResponse.json({
      success: true,
      summary: {
        launchpadCollections: launchpadCollections.length,
        legacyCollections: collections.length,
        collectionMints: collectionMints.length,
        totalIssues: navigationAnalysis.reduce((sum, item) => sum + item.issues.length, 0)
      },
      navigationAnalysis,
      recommendations: [
        "1. Launchpad collections devem SEMPRE ir para /launchpad/{id}",
        "2. Collections legacy com contractAddress fake devem ser removidas",
        "3. Status 'upcoming' não deveria aparecer no marketplace table",
        "4. Simplificar a lógica de navegação em navigateToCollection()"
      ]
    });

  } catch (error: any) {
    console.error('❌ Error analyzing navigation:', error);
    return NextResponse.json({
      error: error.message || 'Analysis failed'
    }, { status: 500 });
  }
}
