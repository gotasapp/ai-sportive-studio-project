import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';
import { getNFT } from 'thirdweb/extensions/erc721';
import clientPromise from '@/lib/mongodb';

/**
 * API para verificar se as listagens são NFTs individuais ou coleções inteiras
 */
export async function GET() {
  try {
    console.log('🔍 Investigando NFTs vs Coleções...');

    // 1. Conectar ao blockchain
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET!,
    });

    // 2. Buscar listagens ativas
    const validListings = await getAllValidListings({
      contract: marketplaceContract,
      start: 0,
      count: BigInt(20),
    });

    console.log(`📋 Encontradas ${validListings.length} listagens para análise`);

    // 3. Conectar ao MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db('chz-app-db');

    // 4. Analisar cada listagem
    const listingAnalysis = [];

    for (const listing of validListings.slice(0, 5)) { // Apenas primeiras 5 para análise
      console.log(`\n🔍 Analisando listagem ${listing.id}:`);
      console.log(`- Contract: ${listing.assetContractAddress}`);
      console.log(`- TokenId: ${listing.tokenId}`);

      const analysis: any = {
        listingId: listing.id.toString(),
        contractAddress: listing.assetContractAddress,
        tokenId: listing.tokenId.toString(),
        creator: listing.creatorAddress,
        price: listing.currencyValuePerToken?.displayValue,
      };

      try {
        // 5. Verificar se é um contrato NFT válido
        const nftContract = getContract({
          client,
          chain: polygonAmoy,
          address: listing.assetContractAddress,
        });

        // 6. Tentar buscar a NFT específica
        try {
          const nftData = await getNFT({
            contract: nftContract,
            tokenId: listing.tokenId,
          });

          analysis.nftExists = true;
          analysis.nftName = nftData.metadata.name;
          analysis.nftDescription = nftData.metadata.description;
          analysis.nftImage = nftData.metadata.image;
          analysis.owner = nftData.owner;

          console.log(`✅ NFT individual encontrada: ${nftData.metadata.name}`);
        } catch (nftError: any) {
          analysis.nftExists = false;
          analysis.nftError = nftError?.message || 'Erro desconhecido';
          console.log(`❌ NFT individual não encontrada:`, nftError?.message || nftError);
        }

        // 7. Verificar no MongoDB se é custom collection
        const customCollection = await db.collection('custom_collections').findOne({
          contractAddress: listing.assetContractAddress.toLowerCase()
        });

        if (customCollection) {
          analysis.isCustomCollection = true;
          analysis.collectionName = customCollection.name;
          analysis.collectionType = customCollection.category;

          // 8. Verificar mints dessa collection
          const mints = await db.collection('custom_collection_mints').find({
            contractAddress: listing.assetContractAddress.toLowerCase()
          }).toArray();

          analysis.totalMints = mints.length;
          analysis.mintTokenIds = mints.map(m => m.tokenId);

          console.log(`📦 Custom Collection: ${customCollection.name}`);
          console.log(`📊 Total mints: ${mints.length}`);
          console.log(`🏷️ Token IDs: ${mints.map(m => m.tokenId).join(', ')}`);
        } else {
          analysis.isCustomCollection = false;
        }

        // 9. Verificar se tokenId corresponde a um mint específico
        if (analysis.isCustomCollection) {
          const specificMint = await db.collection('custom_collection_mints').findOne({
            contractAddress: listing.assetContractAddress.toLowerCase(),
            tokenId: listing.tokenId.toString()
          });

          if (specificMint) {
            analysis.hasSpecificMint = true;
            analysis.mintDetails = {
              minterAddress: specificMint.minterAddress,
              category: specificMint.category,
              teamName: specificMint.teamName,
              mintedAt: specificMint.mintedAt
            };
            console.log(`✅ Mint específico encontrado no MongoDB`);
          } else {
            analysis.hasSpecificMint = false;
            console.log(`❌ Mint específico NÃO encontrado no MongoDB`);
          }
        }

      } catch (contractError: any) {
        analysis.contractError = contractError?.message || 'Erro desconhecido';
        console.log(`❌ Erro ao acessar contrato:`, contractError?.message || contractError);
      }

      listingAnalysis.push(analysis);
    }

    // 10. Resumo da análise
    const summary = {
      totalListings: validListings.length,
      analyzedListings: listingAnalysis.length,
      nftsWithValidMetadata: listingAnalysis.filter(a => a.nftExists).length,
      customCollectionListings: listingAnalysis.filter(a => a.isCustomCollection).length,
      specificMintsFound: listingAnalysis.filter(a => a.hasSpecificMint).length,
    };

    console.log('\n📊 RESUMO DA ANÁLISE:');
    console.log(`- Total de listagens: ${summary.totalListings}`);
    console.log(`- NFTs com metadata válida: ${summary.nftsWithValidMetadata}`);
    console.log(`- Listagens de custom collections: ${summary.customCollectionListings}`);
    console.log(`- Mints específicos encontrados: ${summary.specificMintsFound}`);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        listingAnalysis,
        conclusion: summary.specificMintsFound > 0 ? 
          'LISTAGENS SÃO NFTs INDIVIDUAIS VÁLIDAS' : 
          'PROBLEMA: Listagens podem ser de coleções inteiras ou NFTs inválidas'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na análise NFT vs Collection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro na análise' },
      { status: 500 }
    );
  }
}