import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

// ✅ FUNÇÕES UTILITÁRIAS UTC PARA BACKEND
function getCurrentUTC(): Date {
  const now = new Date();
  return new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
}

function getCurrentLocalFormatted(): string {
  const now = new Date();
  return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/launchpad/auto-update-status chamado')
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ✅ CORRIGIDO: Usar funções utilitárias UTC
    const nowUTC = getCurrentUTC();
    console.log('⏰ Verificando status em (local):', getCurrentLocalFormatted())
    console.log('⏰ Verificando status em (UTC):', nowUTC.toISOString())
    
    // Buscar coleções upcoming que precisam ser ativadas
    const collectionsToUpdate = await db.collection('collections').find({
      type: 'launchpad',
      status: 'upcoming',
      launchDate: { $lte: nowUTC.toISOString() }
    }).toArray();
    
    console.log(`📋 Encontradas ${collectionsToUpdate.length} coleções para ativar`)
    
    const updatedCollections = [];
    
    for (const collection of collectionsToUpdate) {
      try {
        // Atualizar status para active
        const result = await db.collection('collections').updateOne(
          { _id: collection._id },
          { 
            $set: { 
              status: 'active',
              updatedAt: nowUTC
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          updatedCollections.push({
            id: collection._id.toString(),
            name: collection.name,
            oldStatus: 'upcoming',
            newStatus: 'active',
            launchDate: collection.launchDate
          });
          
          console.log(`✅ Coleção "${collection.name}" ativada automaticamente`)
        }
      } catch (error) {
        console.error(`❌ Erro ao ativar coleção ${collection.name}:`, error)
      }
    }
    
    const response = {
      success: true,
      updatedCount: updatedCollections.length,
      updatedCollections,
      checkedAt: nowUTC.toISOString(),
      checkedAtLocal: getCurrentLocalFormatted()
    }
    
    console.log('📤 Retornando resposta:', response)
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error auto-updating collection statuses:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to auto-update collection statuses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log('📤 Retornando erro:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET endpoint para verificar status manualmente
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/launchpad/auto-update-status chamado')
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ✅ CORRIGIDO: Usar funções utilitárias UTC
    const nowUTC = getCurrentUTC();
    
    // Buscar coleções upcoming que precisam ser ativadas
    const collectionsToUpdate = await db.collection('collections').find({
      type: 'launchpad',
      status: 'upcoming',
      launchDate: { $lte: nowUTC.toISOString() }
    }).toArray();
    
    const response = {
      success: true,
      pendingUpdates: collectionsToUpdate.length,
      collections: collectionsToUpdate.map(c => ({
        id: c._id.toString(),
        name: c.name,
        launchDate: c.launchDate,
        daysUntilLaunch: Math.ceil((new Date(c.launchDate).getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24))
      })),
      checkedAt: nowUTC.toISOString(),
      checkedAtLocal: getCurrentLocalFormatted()
    }
    
    console.log('📤 Retornando status:', response)
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error checking collection statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check collection statuses' },
      { status: 500 }
    );
  }
} 