import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

/**
 * API de diagnóstico para verificar o estado atual dos NFTs e suas listagens
 */
export async function GET(request: Request) {
  try {
    console.log('🔍 DEBUG STATUS: Starting MongoDB diagnosis...');
    
    const url = new URL(request.url);
    const userWallet = url.searchParams.get('wallet');
    
    // Buscar dados do MongoDB
    const dbClient = await clientPromise;
    const db = dbClient.db(DB_NAME);
    
    const [jerseys, stadiums, badges] = await Promise.all([
      db.collection('jerseys').find({}).toArray(),
      db.collection('stadiums').find({}).toArray(),
      db.collection('badges').find({}).toArray()
    ]);
    
    const allNFTs = [...jerseys, ...stadiums, ...badges];
    
    // Filtrar por usuário se especificado
    const userNFTs = userWallet ? 
      allNFTs.filter(nft => 
        nft.creator?.wallet?.toLowerCase() === userWallet.toLowerCase() ||
        nft.creatorWallet?.toLowerCase() === userWallet.toLowerCase()
      ) : allNFTs;
    
    // Análise detalhada
    const diagnosis = {
      mongodb: {
        totalNFTs: allNFTs.length,
        userNFTs: userNFTs.length,
        mintedNFTs: userNFTs.filter(nft => nft.isMinted || nft.transactionHash).length,
        listedInDB: userNFTs.filter(nft => nft.marketplace?.isListed).length,
        nfts: userNFTs.map(nft => ({
          id: nft._id.toString(),
          name: nft.name,
          tokenId: nft.tokenId || nft._id.toString(),
          blockchainTokenId: nft.blockchain?.tokenId || nft.blockchainTokenId,
          isMinted: nft.isMinted || !!nft.transactionHash,
          transactionHash: nft.transactionHash,
          marketplace: {
            isListed: nft.marketplace?.isListed || false,
            listingId: nft.marketplace?.listingId,
            price: nft.marketplace?.price,
            priceFormatted: nft.marketplace?.priceFormatted,
            lastSync: nft.marketplace?.lastSyncAt
          }
        }))
      },
      summary: {
        totalNFTs: allNFTs.length,
        mintedNFTs: userNFTs.filter(nft => nft.isMinted || nft.transactionHash).length,
        listedNFTs: userNFTs.filter(nft => nft.marketplace?.isListed).length,
        unlistedNFTs: userNFTs.filter(nft => 
          (nft.isMinted || nft.transactionHash) && !nft.marketplace?.isListed
        ).length
      }
    };
    
    // Recomendações baseadas no estado atual
    const recommendations = [];
    
    if (diagnosis.mongodb.listedInDB === 0 && diagnosis.mongodb.mintedNFTs > 0) {
      recommendations.push({
        action: 'CHECK_LISTING_PROCESS',
        description: 'You have minted NFTs but none are listed. Try listing one through the UI.',
        priority: 'HIGH'
      });
    }
    
    if (diagnosis.mongodb.listedInDB > 0) {
      recommendations.push({
        action: 'FORCE_REFRESH_FRONTEND',
        description: 'Listed NFTs found in DB. Try refreshing the marketplace page.',
        method: 'Reload the page or call forceRefresh()',
        priority: 'HIGH'
      });
    }
    
    console.log('✅ DEBUG STATUS: MongoDB diagnosis completed');
    console.log('📊 Summary:', diagnosis.summary);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      userWallet,
      diagnosis,
      recommendations,
      quickFixes: {
        forceRefresh: 'Reload the marketplace page',
        checkListingProcess: 'Try listing an NFT through the UI',
        checkConsole: 'Check browser console for errors'
      }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG STATUS Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to diagnose marketplace status',
      details: error?.message || error
    }, { status: 500 });
  }
} 