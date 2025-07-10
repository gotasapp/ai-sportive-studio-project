import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs } from 'thirdweb/extensions/erc721';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';

/**
 * API de diagnóstico para testar conectividade da Thirdweb em produção
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {} as any
  };

  try {
    // 1. Testar Client Thirdweb
    results.tests.client = { status: 'testing' };
    
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });
    
    results.tests.client = { 
      status: 'success', 
      hasSecretKey: !!process.env.THIRDWEB_SECRET_KEY,
      secretKeyLength: process.env.THIRDWEB_SECRET_KEY?.length || 0
    };

    // 2. Testar NFT Contract
    results.tests.nftContract = { status: 'testing' };
    
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET!,
    });
    
    results.tests.nftContract = { 
      status: 'success',
      address: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET,
      chain: 'polygonAmoy'
    };

    // 3. Testar Marketplace Contract
    results.tests.marketplaceContract = { status: 'testing' };
    
    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET!,
    });
    
    results.tests.marketplaceContract = { 
      status: 'success',
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET,
      chain: 'polygonAmoy'
    };

    // 4. Testar busca de NFTs (limitado)
    results.tests.nftFetch = { status: 'testing' };
    
    const nfts = await getNFTs({
      contract: nftContract,
      start: 0,
      count: 5, // Apenas 5 para teste
    });
    
    results.tests.nftFetch = { 
      status: 'success',
      count: nfts.length,
      firstNFT: nfts[0] ? {
        id: nfts[0].id.toString(),
        name: nfts[0].metadata?.name || 'No name',
        hasImage: !!nfts[0].metadata?.image
      } : null
    };

    // 5. Testar marketplace listings (limitado)
    results.tests.marketplaceFetch = { status: 'testing' };
    
    const listings = await getAllValidListings({
      contract: marketplaceContract,
      start: 0,
      count: BigInt(5), // Apenas 5 para teste
    });
    
    results.tests.marketplaceFetch = { 
      status: 'success',
      count: listings.length,
      firstListing: listings[0] ? {
        id: listings[0].id.toString(),
        tokenId: listings[0].tokenId.toString(),
        price: listings[0].currencyValuePerToken?.displayValue || 'No price',
        creator: listings[0].creatorAddress
      } : null
    };

    // 6. Resumo final
    results.summary = {
      allTestsPassed: Object.values(results.tests).every((test: any) => test.status === 'success'),
      totalNFTs: results.tests.nftFetch?.count || 0,
      totalListings: results.tests.marketplaceFetch?.count || 0,
      environment: process.env.NODE_ENV,
      hasRequiredEnvVars: !!(
        process.env.THIRDWEB_SECRET_KEY &&
        process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET &&
        process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET
      )
    };

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error: any) {
    console.error('❌ Thirdweb Debug Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      ...results
    }, { status: 500 });
  }
} 