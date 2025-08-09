import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * API para debug da estrutura das custom collections
 */
export async function GET() {
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('chz-app-db');

    console.log('🔍 Analisando estrutura das custom collections...');

    // 1. Verificar coleções existentes
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📋 Coleções no banco:', collectionNames);

    // 2. Contar documentos em cada coleção relevante
    const counts = {};
    for (const name of ['custom_collections', 'custom_collection_mints', 'jerseys', 'stadiums', 'badges']) {
      if (collectionNames.includes(name)) {
        counts[name] = await db.collection(name).countDocuments();
      }
    }
    console.log('📊 Contagem por coleção:', counts);

    // 3. Buscar algumas custom collections
    const customCollections = await db.collection('custom_collections').find({}).limit(5).toArray();
    console.log(`📋 ${customCollections.length} custom collections encontradas`);

    // 4. Buscar alguns mints de custom collections
    const customMints = await db.collection('custom_collection_mints').find({}).limit(10).toArray();
    console.log(`📋 ${customMints.length} custom collection mints encontrados`);

    // 4.1. Buscar uma NFT legacy para comparar estrutura
    const legacyNFT = await db.collection('jerseys').findOne({ tokenId: '14' });
    console.log(`📋 Legacy NFT encontrada (tokenId 14):`, legacyNFT ? 'Sim' : 'Não');

    // 5. Verificar se algum mint tem contractAddress dos contratos listados
    const listedContracts = [
      '0xcd2ac8b9b930f1d5496317328a6fc517734ae55c',
      '0x2733d52b21b305227478b0a9a1f947dfa445f0c1',
      '0xdc8ba091a1a9cc5b56be8b8873bcd31a74f5570a'
    ];

    console.log('🔍 Procurando mints dos contratos listados...');
    const matchingMints = [];
    
    for (const contract of listedContracts) {
      const mints = await db.collection('custom_collection_mints').find({
        contractAddress: { $regex: new RegExp(contract, 'i') }
      }).toArray();
      
      console.log(`📋 Contrato ${contract}: ${mints.length} mints encontrados`);
      matchingMints.push(...mints);
    }

    // 6. Estrutura de exemplo de um mint (se existir)
    let sampleMint = null;
    if (customMints.length > 0) {
      sampleMint = customMints[0];
      console.log('📋 Estrutura de exemplo de custom mint:', Object.keys(sampleMint));
    }

    // 7. Verificar se há mints com marketplace data
    const mintsWithMarketplace = await db.collection('custom_collection_mints').find({
      'marketplace.isListed': true
    }).toArray();
    
    console.log(`📋 Mints com dados de marketplace: ${mintsWithMarketplace.length}`);

    return NextResponse.json({
      success: true,
      data: {
        collections: collectionNames,
        counts,
        customCollections: customCollections.length,
        customMints: customMints.length,
        matchingContracts: matchingMints.length,
        mintsWithMarketplace: mintsWithMarketplace.length,
        listedContracts,
        
        // Estruturas para comparação
        sampleMintStructure: sampleMint ? Object.keys(sampleMint) : null,
        legacyNFTStructure: legacyNFT ? Object.keys(legacyNFT) : null,
        
        // Dados específicos
        sampleMint: sampleMint ? {
          tokenId: sampleMint.tokenId,
          contractAddress: sampleMint.contractAddress,
          minterAddress: sampleMint.minterAddress,
          hasMarketplace: !!sampleMint.marketplace,
          fullData: sampleMint
        } : null,
        
        legacyNFT: legacyNFT ? {
          tokenId: legacyNFT.tokenId,
          contractAddress: legacyNFT.contractAddress || 'N/A',
          owner: legacyNFT.owner || legacyNFT.creator?.wallet || 'N/A',
          hasMarketplace: !!legacyNFT.marketplace,
          fullData: legacyNFT
        } : null,
        
        matchingMints: matchingMints.map(mint => ({
          tokenId: mint.tokenId,
          contractAddress: mint.contractAddress,
          minterAddress: mint.minterAddress,
          transactionHash: mint.transactionHash,
          hasMarketplace: !!mint.marketplace,
          fullData: mint
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao analisar custom collections:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}