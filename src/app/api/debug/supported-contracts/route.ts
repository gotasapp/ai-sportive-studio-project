import { NextResponse } from 'next/server';
import { polygonAmoy } from 'thirdweb/chains';
import { getSupportedContractAddresses, getSupportedContractAddressesWithDynamic, getAllSupportedContractsUnified } from '@/lib/marketplace-config';
import { DynamicContractRegistry } from '@/lib/dynamic-contract-registry';
import clientPromise from '@/lib/mongodb';

/**
 * API de debug para verificar quais contratos estão sendo suportados pelo marketplace
 */
export async function GET() {
  try {
    console.log('🔍 Debug: Verificando contratos suportados...');
    
    // Contratos estáticos
    const staticContracts = getSupportedContractAddresses(polygonAmoy.id);
    console.log('📋 Contratos estáticos:', staticContracts);
    
    // Conectar ao MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db('chz-app-db');
    
    // Buscar coleções do launchpad com contratos
    const launchpadCollections = await db.collection('collections').find({
      type: 'launchpad',
      contractAddress: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`📊 Encontradas ${launchpadCollections.length} coleções launchpad com contratos`);
    
    // Contratos dinâmicos (incluindo launchpad)
    const allContractsOld = await getSupportedContractAddressesWithDynamic(polygonAmoy.id, db);
    console.log('📋 Todos os contratos (método antigo):', allContractsOld);
    
    // Detectar contratos do marketplace
    const marketplaceContracts = await DynamicContractRegistry.detectContractsFromMarketplace();
    console.log('🏪 Contratos detectados do marketplace:', marketplaceContracts);
    
    // Obter todos os contratos unificados
    const allContractsUnified = await getAllSupportedContractsUnified(polygonAmoy.id, db);
    console.log('🌟 Todos os contratos (método unificado):', allContractsUnified);
    
    // Detalhes das coleções
    const collectionDetails = launchpadCollections.map(col => ({
      name: col.name,
      contractAddress: col.contractAddress,
      status: col.status,
      minted: col.minted,
      totalSupply: col.totalSupply,
      createdAt: col.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        staticContracts,
        dynamicContractsFromDB: launchpadCollections.map(col => col.contractAddress),
        contractsFromMarketplace: marketplaceContracts,
        allSupportedContracts: allContractsUnified,
        totalContracts: allContractsUnified.length,
        launchpadCollections: collectionDetails,
        message: 'NOVA ABORDAGEM: O marketplace agora aceita QUALQUER contrato válido!'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar contratos suportados:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar contratos' },
      { status: 500 }
    );
  }
}