import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'chz-app-db';

/**
 * API para forçar sincronização completa de TODAS as listagens do marketplace
 * Aceita NFTs de QUALQUER contrato válido
 */
export async function POST(request: Request) {
  try {
    console.log('🚀 FORÇANDO SINCRONIZAÇÃO COMPLETA DO MARKETPLACE...');
    
    const body = await request.json();
    const { userWallet } = body;
    
    // Criar cliente Thirdweb
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Contrato do marketplace
    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
    });

    console.log('📋 Buscando TODAS as listagens ativas no blockchain...');

    // Buscar TODAS as listagens válidas (sem filtro de contrato)
    const allListings = await getAllValidListings({
      contract: marketplaceContract,
      start: 0,
      count: BigInt(1000), // Buscar até 1000 listagens
    });

    console.log(`✅ Encontradas ${allListings.length} listagens ativas no total`);

    // Rastrear contratos únicos
    const uniqueContracts = new Set<string>();
    allListings.forEach(listing => {
      uniqueContracts.add(listing.assetContractAddress.toLowerCase());
    });
    
    console.log(`📊 Contratos únicos encontrados: ${uniqueContracts.size}`);
    console.log('📋 Contratos:', Array.from(uniqueContracts));

    // Conectar ao MongoDB
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    
    let syncedCount = 0;
    let updatedCount = 0;
    let notFoundCount = 0;
    const syncResults = [];

    // Processar cada listagem
    for (const listing of allListings) {
      // Filtrar por usuário se especificado
      if (userWallet && listing.creatorAddress.toLowerCase() !== userWallet.toLowerCase()) {
        continue;
      }

      console.log(`\n🔄 Processando listagem ${listing.id}:`, {
        tokenId: listing.tokenId.toString(),
        contract: listing.assetContractAddress,
        creator: listing.creatorAddress,
        price: listing.currencyValuePerToken?.displayValue || 'Unknown'
      });

          // Tentar encontrar o NFT em todas as coleções (priorizar custom collections)
    const collections = ['jerseys', 'stadiums', 'badges']; // 🚫 Removido custom_collection_mints - NFTs de coleções não devem aparecer no marketplace
      let found = false;

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        
        // Buscar por múltiplos critérios - incluindo custom collections
        const searchCriteria = [
          // 1. Buscar por tokenId + contractAddress (mais específico)
          { 
            tokenId: listing.tokenId.toString(),
            contractAddress: listing.assetContractAddress.toLowerCase()
          },
          { 
            blockchainTokenId: listing.tokenId.toString(),
            contractAddress: listing.assetContractAddress.toLowerCase()
          },
          // 2. Buscar só por tokenId (para NFTs antigas e custom collections)
          { tokenId: listing.tokenId.toString() },
          { blockchainTokenId: listing.tokenId.toString() },
                  // 3. Buscar por _id se tokenId for um ObjectId válido
        ...(ObjectId.isValid(listing.tokenId.toString()) ? [{ _id: new ObjectId(listing.tokenId.toString()) }] : []),
          // 4. Para custom collections - buscar por minterAddress (que é o owner)
          { 
            minterAddress: listing.creatorAddress.toLowerCase(),
            tokenId: listing.tokenId.toString()
          },
          { 
            minterAddress: listing.creatorAddress.toLowerCase(),
            contractAddress: listing.assetContractAddress.toLowerCase()
          },
          // 5. Buscar por creator (último recurso para NFTs do mesmo usuário)
          { 
            'creator.wallet': listing.creatorAddress.toLowerCase(),
            tokenId: listing.tokenId.toString()
          },
          { 
            creatorWallet: listing.creatorAddress.toLowerCase(),
            tokenId: listing.tokenId.toString()
          }
        ];

        let nft = null;
        
        // Tentar cada critério até encontrar
        for (const criteria of searchCriteria) {
          try {
            nft = await collection.findOne(criteria);
            if (nft) {
              console.log(`✅ NFT encontrado com critério:`, criteria);
              break;
            }
          } catch (error) {
            // Ignorar erros de ObjectId inválido
            continue;
          }
        }

        if (nft) {
          found = true;
          console.log(`✅ NFT encontrado em ${collectionName}:`, {
            mongoId: nft._id.toString(),
            tokenId: nft.tokenId,
            type: collectionName === 'custom_collection_mints' ? 'Custom Collection' : 'Legacy Collection'
          });
          
          // Atualizar com dados da listagem
          const updateResult = await collection.updateOne(
            { _id: nft._id },
            {
              $set: {
                // Garantir que o contractAddress está atualizado
                contractAddress: listing.assetContractAddress,
                
                // Dados do marketplace
                'marketplace.isListed': true,
                'marketplace.listingId': listing.id.toString(),
                'marketplace.price': listing.pricePerToken.toString(),
                'marketplace.priceFormatted': listing.currencyValuePerToken?.displayValue || `${Number(listing.pricePerToken) / 1e18} MATIC`,
                'marketplace.currency': listing.currencyContractAddress,
                'marketplace.currencySymbol': listing.currencyValuePerToken?.symbol || 'MATIC',
                'marketplace.status': listing.status,
                'marketplace.type': 'direct',
                'marketplace.creator': listing.creatorAddress,
                'marketplace.lastSyncAt': new Date(),
                'marketplace.syncMethod': 'force-sync-all',
                
                // Atualizar owner se diferente
                owner: listing.creatorAddress.toLowerCase(),
                
                // Timestamp
                updatedAt: new Date()
              }
            }
          );

          if (updateResult.modifiedCount > 0) {
            updatedCount++;
            console.log('✅ NFT atualizado com sucesso');
          }

          syncResults.push({
            tokenId: listing.tokenId.toString(),
            contract: listing.assetContractAddress,
            collection: collectionName,
            status: 'synced',
            price: listing.currencyValuePerToken?.displayValue
          });

          break; // Não precisa verificar outras coleções
        }
      }

      if (!found) {
        notFoundCount++;
        console.log('⚠️ NFT não encontrado no MongoDB');
        console.log('🔍 Debug da busca:', {
          tokenId: listing.tokenId.toString(),
          contract: listing.assetContractAddress.toLowerCase(),
          creator: listing.creatorAddress.toLowerCase(),
          searchedIn: collections
        });
        
        // Vamos criar uma entrada básica para esta NFT listada
        console.log('🆕 Criando entrada para NFT listada não encontrada...');
        
        try {
          // Determinar categoria baseada no contrato ou criar em 'custom_collection_mints' para editores
          const targetCollection = db.collection('custom_collection_mints'); // Para NFTs dos editores
          
          const newNFT = {
            // Dados básicos da NFT
            tokenId: listing.tokenId.toString(),
            contractAddress: listing.assetContractAddress.toLowerCase(),
            
            // Campos específicos para custom collections
            minterAddress: listing.creatorAddress.toLowerCase(),
            transactionHash: `auto-detected-${listing.id}`,
            metadataUrl: '',
            imageUrl: '',
            price: "0",
            
            // Metadados da coleção (valores padrão)
            category: 'jersey', // padrão
            teamName: 'Unknown Team',
            season: new Date().getFullYear().toString(),
            subcategoryType: '',
            
            // Status e timestamps
            mintedAt: new Date(),
            mintStatus: 'confirmed',
            isMinted: true,
            status: 'Approved',
            type: 'custom_collection',
            
            // Dados do marketplace
            marketplace: {
              isListed: true,
              listingId: listing.id.toString(),
              price: listing.pricePerToken.toString(),
              priceFormatted: listing.currencyValuePerToken?.displayValue || `${Number(listing.pricePerToken) / 1e18} MATIC`,
              currency: listing.currencyContractAddress,
              currencySymbol: listing.currencyValuePerToken?.symbol || 'MATIC',
              status: listing.status,
              type: 'direct',
              creator: listing.creatorAddress,
              lastSyncAt: new Date(),
              syncMethod: 'force-sync-all-auto-create'
            },
            
            // Metadados de controle
            createdAt: new Date(),
            updatedAt: new Date(),
            autoCreated: true // Flag para identificar NFTs criadas automaticamente
          };
          
          const insertResult = await targetCollection.insertOne(newNFT);
          console.log('✅ NFT criada automaticamente:', insertResult.insertedId);
          
          updatedCount++; // Contar como atualizada já que foi criada
          
          syncResults.push({
            tokenId: listing.tokenId.toString(),
            contract: listing.assetContractAddress,
            status: 'auto_created',
            price: listing.currencyValuePerToken?.displayValue,
            mongoId: insertResult.insertedId.toString()
          });
          
        } catch (createError) {
          console.error('❌ Erro ao criar NFT automaticamente:', createError);
          
          syncResults.push({
            tokenId: listing.tokenId.toString(),
            contract: listing.assetContractAddress,
            status: 'not_found',
            price: listing.currencyValuePerToken?.displayValue,
            error: 'Failed to auto-create'
          });
        }
      }

      syncedCount++;
    }

    console.log('\n🏁 SINCRONIZAÇÃO COMPLETA!');
    console.log(`📊 Total processado: ${syncedCount}`);
    console.log(`✅ Atualizados: ${updatedCount}`);
    console.log(`⚠️ Não encontrados: ${notFoundCount}`);
    
    // Contar resultados por tipo
    const autoCreated = syncResults.filter(r => r.status === 'auto_created').length;
    const synced = syncResults.filter(r => r.status === 'synced').length;
    const notFound = syncResults.filter(r => r.status === 'not_found').length;
    
    console.log(`🆕 Auto-criadas: ${autoCreated}`);
    console.log(`🔄 Sincronizadas: ${synced}`);

    return NextResponse.json({
      success: true,
      message: `Sincronização completa! ${updatedCount} NFTs processados (${autoCreated} auto-criadas, ${synced} atualizadas)`,
      stats: {
        totalListings: allListings.length,
        processedListings: syncedCount,
        updatedNFTs: updatedCount,
        notFoundNFTs: notFound,
        autoCreatedNFTs: autoCreated,
        syncedNFTs: synced,
        uniqueContracts: uniqueContracts.size
      },
      contracts: Array.from(uniqueContracts),
      results: syncResults,
      userWallet: userWallet || 'all',
      breakdown: {
        autoCreated,
        synced,
        notFound
      }
    });

  } catch (error) {
    console.error('❌ Erro na sincronização forçada:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Falha na sincronização forçada',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}