import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * API para verificar se as custom collections estão realmente listadas no marketplace
 */
export async function GET() {
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('chz-app-db');

    console.log('🔍 Verificando custom collections e seus contratos...');

    // 1. Buscar custom collections
    const customCollections = await db.collection('custom_collections').find({}).toArray();
    console.log(`📋 Encontradas ${customCollections.length} custom collections`);

    // 2. Buscar custom collection mints
    const customMints = await db.collection('custom_collection_mints').find({}).toArray();
    console.log(`📋 Encontrados ${customMints.length} custom collection mints`);

    // 3. Verificar quais custom collections têm contractAddress
    const collectionsWithContracts = customCollections.filter(col => col.contractAddress);
    console.log(`📊 Collections com contratos: ${collectionsWithContracts.length}`);

    // 4. Verificar quais mints têm contractAddress  
    const mintsWithContracts = customMints.filter(mint => mint.contractAddress);
    console.log(`📊 Mints com contratos: ${mintsWithContracts.length}`);

    // 5. Agrupar contratos únicos
    const allContracts = [
      ...collectionsWithContracts.map(col => col.contractAddress?.toLowerCase()),
      ...mintsWithContracts.map(mint => mint.contractAddress?.toLowerCase())
    ].filter(Boolean);
    
    const uniqueContracts = [...new Set(allContracts)];
    console.log(`🔗 Contratos únicos das custom collections:`, uniqueContracts);

    // 6. Contratos encontrados no marketplace (do log anterior)
    const marketplaceContracts = [
      '0xcD2aC8b9B930f1d5496317328a6Fc517734aE55C',
      '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      '0x2733d52b21B305227478b0A9A1F947DfA445f0c1',
      '0xdC8ba091A1a9Cc5b56be8B8873BCD31a74F5570A'
    ].map(addr => addr.toLowerCase());

    // 7. Verificar se há intersecção
    const matchingContracts = uniqueContracts.filter(contract => 
      marketplaceContracts.includes(contract)
    );

    console.log(`🎯 Contratos que coincidem:`, matchingContracts);

    // 8. Detalhes das custom collections
    const collectionDetails = customCollections.map(col => ({
      name: col.name,
      contractAddress: col.contractAddress,
      category: col.category,
      status: col.status,
      createdAt: col.createdAt,
      isInMarketplace: col.contractAddress ? 
        marketplaceContracts.includes(col.contractAddress.toLowerCase()) : false
    }));

    // 9. Detalhes dos mints
    const mintDetails = customMints.slice(0, 10).map(mint => ({
      tokenId: mint.tokenId,
      contractAddress: mint.contractAddress,
      minterAddress: mint.minterAddress,
      category: mint.category,
      teamName: mint.teamName,
      isInMarketplace: mint.contractAddress ? 
        marketplaceContracts.includes(mint.contractAddress.toLowerCase()) : false
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalCustomCollections: customCollections.length,
        totalCustomMints: customMints.length,
        collectionsWithContracts: collectionsWithContracts.length,
        mintsWithContracts: mintsWithContracts.length,
        uniqueCustomContracts: uniqueContracts,
        marketplaceContracts,
        matchingContracts,
        hasMatches: matchingContracts.length > 0,
        collectionDetails,
        mintDetails,
        conclusion: matchingContracts.length > 0 ? 
          'Custom collections ESTÃO no marketplace' : 
          'Custom collections NÃO ESTÃO no marketplace'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar custom collections:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar custom collections' },
      { status: 500 }
    );
  }
}