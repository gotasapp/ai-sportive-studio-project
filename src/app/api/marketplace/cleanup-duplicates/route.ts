import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';

const DB_NAME = 'chz-app-db';

/**
 * API para limpar duplicatas e corrigir problemas no marketplace
 */
export async function POST(request: Request) {
  try {
    console.log('🧹 INICIANDO LIMPEZA DE DUPLICATAS DO MARKETPLACE...');
    
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // 1. CONECTAR AO MONGODB
    console.log('🗄️ Conectando ao MongoDB...');
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);

    // 2. BUSCAR TODOS OS NFTs DO MONGODB
    const jerseys = await db.collection('jerseys').find({}).toArray();
    const stadiums = await db.collection('stadiums').find({}).toArray();
    const badges = await db.collection('badges').find({}).toArray();
    
    const allNFTs = [...jerseys, ...stadiums, ...badges];
    console.log(`📊 Total de NFTs no MongoDB: ${allNFTs.length}`);

    // 3. VERIFICAR MARKETPLACE CONTRACT
    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
    });

    let validListings: any[] = [];
    
    try {
      const totalListings = await readContract({
        contract: marketplaceContract,
        method: "function totalListings() view returns (uint256)",
        params: []
      });

      console.log(`📋 Total de listagens no contrato: ${totalListings}`);

      if (Number(totalListings) > 0) {
        const startId = 0;
        const endId = Number(totalListings) - 1;

        const listings = await readContract({
          contract: marketplaceContract,
          method: "function getAllValidListings(uint256 startId, uint256 endId) view returns ((uint256 listingId, address listingCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved, uint8 tokenType, uint8 status)[])",
          params: [BigInt(startId), BigInt(endId)]
        });

        // Filtrar apenas listings do nosso contrato
        validListings = listings.filter(listing => 
          listing.assetContract.toLowerCase() === '0xff973a4afc5a96dec81366461a461824c4f80254'
        );

        console.log(`✅ Listagens válidas do nosso contrato: ${validListings.length}`);
      }
    } catch (listingError) {
      console.log('⚠️ Erro ao buscar listagens do blockchain:', listingError);
    }

    // 4. IDENTIFICAR E CORRIGIR PROBLEMAS
    const cleanupResults = {
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      invalidPricesFound: 0,
      invalidPricesFixed: 0,
      orphanedListings: 0,
      orphanedListingsRemoved: 0,
      correctionsApplied: []
    };

    // 4.1 - Identificar NFTs duplicados (mesmo nome, imagem, criador)
    const duplicateGroups = new Map();
    
    for (const nft of allNFTs) {
      const key = `${nft.name}-${nft.imageUrl}-${nft.creator?.wallet}`;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key).push(nft);
    }

    // 4.2 - Remover duplicatas (manter apenas o mais recente)
    duplicateGroups.forEach((duplicates, key) => {
      if (duplicates.length > 1) {
        cleanupResults.duplicatesFound += duplicates.length - 1;
        
        // Ordenar por data de criação (mais recente primeiro)
        duplicates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Manter apenas o primeiro (mais recente), remover o resto
        const toKeep = duplicates[0];
        const toRemove = duplicates.slice(1);
        
        toRemove.forEach(async (duplicate) => {
          // Determinar coleção
          let collectionName = 'jerseys';
          if (duplicate.type === 'stadium') collectionName = 'stadiums';
          if (duplicate.type === 'badge') collectionName = 'badges';
          
          try {
            await db.collection(collectionName).deleteOne({ _id: duplicate._id });
            cleanupResults.duplicatesRemoved++;
            
            console.log(`🗑️ Removido duplicado: ${duplicate.name} (${duplicate._id})`);
            
            cleanupResults.correctionsApplied.push({
              action: 'DELETE_DUPLICATE',
              collection: collectionName,
              id: duplicate._id.toString(),
              name: duplicate.name,
              kept: toKeep._id.toString()
            });
          } catch (deleteError) {
            console.error(`❌ Erro ao remover duplicado ${duplicate._id}:`, deleteError);
          }
        });
      }
    });

    // 4.3 - Verificar listagens com preços astronômicos
    for (const listing of validListings) {
      const priceInWei = listing.pricePerToken;
      const priceInEther = Number(priceInWei) / Math.pow(10, 18);
      
      if (priceInEther > 1000 || priceInEther <= 0 || !isFinite(priceInEther)) {
        cleanupResults.invalidPricesFound++;
        
        console.log(`🚨 PREÇO INVÁLIDO DETECTADO:`, {
          listingId: listing.listingId.toString(),
          tokenId: listing.tokenId.toString(),
          priceInWei: priceInWei.toString(),
          priceInEther,
          creator: listing.listingCreator
        });
        
        // Marcar como problemático no banco
        const tokenId = listing.tokenId.toString();
        const collections = ['jerseys', 'stadiums', 'badges'];
        
        for (const collectionName of collections) {
          try {
            const updateResult = await db.collection(collectionName).updateMany(
              { 
                $or: [
                  { tokenId: tokenId },
                  { blockchainTokenId: tokenId },
                  { _id: tokenId }
                ]
              },
              { 
                $set: { 
                  'marketplace.hasInvalidPrice': true,
                  'marketplace.invalidPriceDetectedAt': new Date(),
                  'marketplace.originalInvalidPrice': priceInWei.toString(),
                  updatedAt: new Date()
                }
              }
            );
            
            if (updateResult.modifiedCount > 0) {
              cleanupResults.invalidPricesFixed++;
              
              cleanupResults.correctionsApplied.push({
                action: 'MARK_INVALID_PRICE',
                collection: collectionName,
                tokenId: tokenId,
                listingId: listing.listingId.toString(),
                invalidPrice: priceInEther
              });
            }
          } catch (updateError) {
            console.error(`❌ Erro ao marcar preço inválido:`, updateError);
          }
        }
      }
    }

    // 4.4 - Identificar NFTs órfãos (sem correspondência no blockchain)
    const validTokenIds = validListings.map(l => l.tokenId.toString());
    
    for (const nft of allNFTs) {
      const hasValidListing = validTokenIds.includes(nft._id) || 
                             validTokenIds.includes(nft.tokenId) || 
                             validTokenIds.includes(nft.blockchainTokenId);
      
      // Se NFT não tem listing válido e está marcado como listado, corrigir
      if (!hasValidListing && nft.marketplace?.isListed) {
        cleanupResults.orphanedListings++;
        
        // Determinar coleção
        let collectionName = 'jerseys';
        if (nft.type === 'stadium') collectionName = 'stadiums';
        if (nft.type === 'badge') collectionName = 'badges';
        
        try {
          await db.collection(collectionName).updateOne(
            { _id: nft._id },
            { 
              $set: { 
                'marketplace.isListed': false,
                'marketplace.orphanedAt': new Date(),
                'marketplace.reason': 'No valid blockchain listing found',
                updatedAt: new Date()
              },
              $unset: {
                'marketplace.listingId': '',
                'marketplace.price': '',
                'marketplace.listedAt': ''
              }
            }
          );
          
          cleanupResults.orphanedListingsRemoved++;
          
          cleanupResults.correctionsApplied.push({
            action: 'UNLIST_ORPHANED',
            collection: collectionName,
            id: nft._id.toString(),
            name: nft.name
          });
          
          console.log(`🔧 Corrigido NFT órfão: ${nft.name} (${nft._id})`);
        } catch (updateError) {
          console.error(`❌ Erro ao corrigir NFT órfão:`, updateError);
        }
      }
    }

    await mongoClient.close();

    console.log('✅ LIMPEZA CONCLUÍDA!');
    console.log('📊 Resultados:', cleanupResults);

    return NextResponse.json({
      success: true,
      message: 'Limpeza de duplicatas concluída com sucesso',
      results: cleanupResults,
      summary: {
        duplicatesRemoved: cleanupResults.duplicatesRemoved,
        invalidPricesFixed: cleanupResults.invalidPricesFixed,
        orphanedListingsFixed: cleanupResults.orphanedListingsRemoved,
        totalCorrections: cleanupResults.correctionsApplied.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na limpeza de duplicatas:', error);
    return NextResponse.json({
      success: false,
      error: 'Falha na limpeza de duplicatas',
      details: error?.message || error
    }, { status: 500 });
  }
} 