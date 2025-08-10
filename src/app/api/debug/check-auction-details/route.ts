import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getAllAuctions } from 'thirdweb/extensions/marketplace';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const MARKETPLACE_CONTRACT_ADDRESS = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

/**
 * 🔍 DEBUG: Verificar detalhes específicos dos auctions criados
 */
export async function GET() {
  try {
    console.log('🔍 Verificando detalhes dos auctions...');
    
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    // Buscar TODOS os auctions
    const allAuctions = await getAllAuctions({
      contract: marketplaceContract,
      start: 0,
      count: BigInt(100),
    });

    console.log(`📊 Total auctions encontrados: ${allAuctions.length}`);

    // Conectar MongoDB para comparar
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);

    // Buscar custom collections e suas unidades
    const customCollections = await db.collection('custom_collections').find({}).toArray();
    const customMints = await db.collection('custom_collection_mints').find({}).toArray();

    // Analisar cada auction
    const auctionDetails = allAuctions.map(auction => {
      const tokenId = auction.tokenId.toString();
      const contractAddress = auction.assetContractAddress.toLowerCase();
      
      // Verificar se é uma unidade de custom collection
      const matchingMint = customMints.find(mint => 
        mint.tokenId === tokenId && 
        mint.contractAddress?.toLowerCase() === contractAddress
      );
      
      // Verificar se é uma collection (pela ID da collection)
      const matchingCollection = customCollections.find(col => 
        col._id.toString() === tokenId ||
        col.contractAddress?.toLowerCase() === contractAddress
      );

      return {
        auctionId: auction.auctionId?.toString(),
        tokenId,
        contractAddress,
        minimumBid: auction.minimumBidAmount?.toString(),
        creator: auction.auctionCreator,
        endTime: auction.endTimestamp ? new Date(Number(auction.endTimestamp) * 1000).toISOString() : null,
        
        // Análise do que representa
        isCustomMint: !!matchingMint,
        isCustomCollection: !!matchingCollection,
        mintDetails: matchingMint ? {
          name: matchingMint.name,
          collectionId: matchingMint.customCollectionId?.toString(),
          minterAddress: matchingMint.minterAddress
        } : null,
        collectionDetails: matchingCollection ? {
          name: matchingCollection.name,
          totalSupply: matchingCollection.totalSupply,
          minted: matchingCollection.minted
        } : null
      };
    });

    // Estatísticas
    const stats = {
      totalAuctions: allAuctions.length,
      customMintAuctions: auctionDetails.filter(a => a.isCustomMint).length,
      customCollectionAuctions: auctionDetails.filter(a => a.isCustomCollection).length,
      unknownAuctions: auctionDetails.filter(a => !a.isCustomMint && !a.isCustomCollection).length
    };

    return NextResponse.json({
      success: true,
      stats,
      auctionDetails,
      debug: {
        totalCustomCollections: customCollections.length,
        totalCustomMints: customMints.length,
        customCollectionContracts: customCollections.map(c => c.contractAddress).filter(Boolean),
        customMintContracts: [...new Set(customMints.map(m => m.contractAddress).filter(Boolean))]
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar auction details:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}