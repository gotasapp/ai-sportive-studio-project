import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

// ✅ FUNÇÕES UTILITÁRIAS UTC PARA BACKEND
function getCurrentUTC(): Date {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
}

function addDaysToUTC(days: number, baseDate?: Date): Date {
  const base = baseDate || getCurrentUTC();
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 POST /api/launchpad/pending-images/[id]/approve chamado')
    console.log('📥 ID da imagem:', params.id)
    
    const data = await request.json();
    console.log('📥 Dados recebidos:', JSON.stringify(data, null, 2))
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 1. Buscar a imagem pendente - ✅ CORRIGIDO: Usar ObjectId
    let pendingImage;
    try {
      pendingImage = await db.collection('pending_launchpad_images').findOne({
        _id: new ObjectId(params.id)
      });
    } catch (error) {
      console.log('❌ Erro ao converter ID para ObjectId:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    if (!pendingImage) {
      console.log('❌ Imagem pendente não encontrada')
      return NextResponse.json(
        { success: false, error: 'Pending image not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Imagem pendente encontrada:', pendingImage.name)
    
    // 2. Criar nova coleção baseada na imagem pendente
    // ✅ CORRIGIDO: Usar funções utilitárias UTC
    const nowUTC = getCurrentUTC();
    const defaultLaunchDate = addDaysToUTC(7);
    
    const newCollection = {
      // Dados básicos da imagem pendente
      name: data.name || pendingImage.name,
      description: data.description || pendingImage.description,
      image: pendingImage.imageUrl, // Campo usado pelo frontend para exibir imagem
      imageUrl: pendingImage.imageUrl, // Campo original
      category: pendingImage.category,
      price: data.price || pendingImage.price,
      maxSupply: data.maxSupply || pendingImage.maxSupply,
      totalSupply: data.maxSupply || pendingImage.maxSupply, // Campo usado pelo frontend para supply
      creator: {
        name: data.creatorName || pendingImage.creator?.name || 'Creator',
        ...pendingImage.creator
      },
      metadata: pendingImage.metadata,
      traits: pendingImage.traits,
      tags: pendingImage.tags,
      type: 'launchpad',
      status: data.status || 'upcoming',
      launchDate: data.launchDate || defaultLaunchDate.toISOString(),
      
      // Dados configurados pelo admin (sem fallbacks mockados)
      creatorAvatar: data.creatorAvatar,
      contractAddress: data.contractAddress,
      website: data.website,
      twitter: data.twitter,
      discord: data.discord,
      vision: data.vision,
      utility: data.utility,
      team: data.team,
      roadmap: data.roadmap,
      mintStages: data.mintStages,
      
      // 🎯 DEPLOYMENT STATUS
      deployed: data.contractAddress ? true : false, // Se já tem contrato, já está deployada
      
      createdAt: nowUTC,
      updatedAt: nowUTC
    };
    
    console.log('💾 Criando nova coleção na tabela launchpad_collections...')
    const collectionResult = await db.collection('launchpad_collections').insertOne(newCollection);
    console.log('✅ Coleção criada com ID:', collectionResult.insertedId.toString())
    
    // 🎯 Configurar claim conditions automaticamente se habilitado
    if (data.autoConfigureClaimConditions && data.contractAddress && data.mintStages) {
      console.log('🔧 Auto-configuring claim conditions...');
      try {
        const claimConditionsResponse = await fetch(new URL('/api/launchpad/configure-claim-conditions', request.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: data.contractAddress,
            mintStages: data.mintStages,
            claimCurrency: data.claimCurrency || 'MATIC',
            maxSupplyPerPhase: data.maxSupplyPerPhase || newCollection.maxSupply
          })
        });

        const claimResult = await claimConditionsResponse.json();
        
        if (claimResult.success) {
          console.log('✅ Claim conditions configured automatically:', claimResult.queueId);
          
          // Atualizar a coleção com o queue ID das claim conditions
          await db.collection('launchpad_collections').updateOne(
            { _id: collectionResult.insertedId },
            { 
              $set: { 
                claimConditionsQueueId: claimResult.queueId,
                autoConfigured: true,
                updatedAt: nowUTC
              } 
            }
          );
        } else {
          console.warn('⚠️ Failed to auto-configure claim conditions:', claimResult.error);
        }
      } catch (claimError) {
        console.error('❌ Error auto-configuring claim conditions:', claimError);
        // Não falhar a aprovação se as claim conditions falharem
      }
    }

    // 🎨 Configurar shared metadata automaticamente para o contrato
    if (data.contractAddress) {
      console.log('🎨 Auto-configuring shared metadata...');
      try {
        const metadataResponse = await fetch(new URL('/api/launchpad/set-shared-metadata', request.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: data.contractAddress,
            name: newCollection.name,
            description: newCollection.description,
            image: newCollection.image,
            attributes: [
              { trait_type: 'Collection', value: newCollection.name },
              { trait_type: 'Type', value: 'launchpad' },
              { trait_type: 'Creator', value: newCollection.creator?.name || 'Unknown' },
              { trait_type: 'Total Supply', value: newCollection.totalSupply?.toString() || 'Unknown' }
            ]
          })
        });

        const metadataResult = await metadataResponse.json();
        
        if (metadataResult.success) {
          console.log('✅ Shared metadata configured automatically:', metadataResult.queueId);
          
          // Atualizar a coleção com o queue ID da metadata
          await db.collection('launchpad_collections').updateOne(
            { _id: collectionResult.insertedId },
            { 
              $set: { 
                sharedMetadataQueueId: metadataResult.queueId,
                metadataConfigured: true,
                updatedAt: nowUTC
              } 
            }
          );
        } else {
          console.warn('⚠️ Failed to auto-configure shared metadata:', metadataResult.error);
        }
      } catch (metadataError) {
        console.error('❌ Error auto-configuring shared metadata:', metadataError);
        // Não falhar a aprovação se a metadata falhar
      }
    }
    
    // 3. Remover a imagem pendente - ✅ CORRIGIDO: Usar ObjectId
    console.log('🗑️ Removendo imagem pendente...')
    await db.collection('pending_launchpad_images').deleteOne({
      _id: new ObjectId(params.id)
    });
    console.log('✅ Imagem pendente removida')
    
    const response = {
      success: true,
      collectionId: collectionResult.insertedId.toString(),
      message: 'Image approved and converted to collection'
    }
    
    console.log('📤 Retornando resposta:', response)
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error approving pending image:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to approve pending image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log('📤 Retornando erro:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 