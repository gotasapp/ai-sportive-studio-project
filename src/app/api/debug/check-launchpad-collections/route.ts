import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET Debug Check Launchpad Collections - Verificando estado das coleções');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar todas as coleções do launchpad
    const collections = await db.collection('collections')
      .find({ type: 'launchpad' })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`🔍 Encontradas ${collections.length} coleções do launchpad`);
    
    // Analisar cada coleção
    const analysis = collections.map(collection => {
      const issues = [];
      
      // Verificar campos obrigatórios
      if (!collection.image && !collection.imageUrl) {
        issues.push('❌ Campo image/imageUrl ausente');
      }
      
      if (!collection.name) {
        issues.push('❌ Campo name ausente');
      }
      
      if (!collection.description) {
        issues.push('❌ Campo description ausente');
      }
      
      if (!collection.totalSupply && !collection.maxSupply) {
        issues.push('❌ Campo totalSupply/maxSupply ausente');
      }
      
      if (collection.totalSupply === 0 || collection.maxSupply === 0) {
        issues.push('⚠️ Supply é zero');
      }
      
      if (!collection.status) {
        issues.push('❌ Campo status ausente');
      }
      
      if (!collection.type) {
        issues.push('❌ Campo type ausente');
      }
      
      // Verificar dados específicos
      if (!collection.creatorAvatar) {
        issues.push('⚠️ Campo creatorAvatar ausente');
      }
      
      if (!collection.contractAddress) {
        issues.push('⚠️ Campo contractAddress ausente');
      }
      
      if (!collection.vision) {
        issues.push('⚠️ Campo vision ausente');
      }
      
      if (!collection.utility || collection.utility.length === 0) {
        issues.push('⚠️ Campo utility ausente ou vazio');
      }
      
      if (!collection.team || collection.team.length === 0) {
        issues.push('⚠️ Campo team ausente ou vazio');
      }
      
      if (!collection.roadmap || collection.roadmap.length === 0) {
        issues.push('⚠️ Campo roadmap ausente ou vazio');
      }
      
      if (!collection.mintStages || collection.mintStages.length === 0) {
        issues.push('⚠️ Campo mintStages ausente ou vazio');
      }
      
      return {
        _id: collection._id.toString(),
        name: collection.name,
        status: collection.status,
        category: collection.category,
        image: collection.image,
        imageUrl: collection.imageUrl,
        totalSupply: collection.totalSupply,
        maxSupply: collection.maxSupply,
        minted: collection.minted,
        creator: collection.creator,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        issues: issues,
        hasIssues: issues.length > 0
      };
    });
    
    // Estatísticas
    const stats = {
      total: collections.length,
      withIssues: analysis.filter(a => a.hasIssues).length,
      active: collections.filter(c => c.status === 'active').length,
      upcoming: collections.filter(c => c.status === 'upcoming').length,
      pending: collections.filter(c => c.status === 'pending_launchpad').length,
      hidden: collections.filter(c => c.status === 'hidden').length,
      ended: collections.filter(c => c.status === 'ended').length
    };
    
    // Problemas mais comuns
    const commonIssues = {
      missingImage: analysis.filter(a => !a.image && !a.imageUrl).length,
      missingName: analysis.filter(a => !a.name).length,
      missingDescription: analysis.filter(a => !a.description).length,
      missingSupply: analysis.filter(a => !a.totalSupply && !a.maxSupply).length,
      zeroSupply: analysis.filter(a => a.totalSupply === 0 || a.maxSupply === 0).length,
      missingStatus: analysis.filter(a => !a.status).length,
      missingType: analysis.filter(a => !a.type).length
    };
    
    console.log('📊 Estatísticas:', stats);
    console.log('🚨 Problemas comuns:', commonIssues);
    
    return NextResponse.json({
      success: true,
      message: 'Launchpad collections analysis completed',
      stats,
      commonIssues,
      collections: analysis,
      rawCollections: collections
    });
    
  } catch (error) {
    console.error('❌ Error analyzing launchpad collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze launchpad collections' },
      { status: 500 }
    );
  }
} 