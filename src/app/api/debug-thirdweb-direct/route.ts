import { NextResponse } from 'next/server';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

export async function GET() {
  try {
    console.log('🧪 Testing Thirdweb directly...');
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ? 'configured' : 'missing',
      nftContract: NFT_CONTRACT_ADDRESS,
      marketplaceContract: MARKETPLACE_CONTRACT_ADDRESS,
      chain: 'polygonAmoy (80002)'
    };

    // Test contract creation
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    console.log('✅ Contracts created successfully');

    // Test NFT fetching with timeout
    const nftPromise = getNFTs({ contract: nftContract, start: 0, count: 100 });
    const listingsPromise = getAllValidListings({ contract: marketplaceContract, start: 0, count: BigInt(100) });
    const auctionsPromise = getAllAuctions({ contract: marketplaceContract, start: 0, count: BigInt(100) });

    // 10 second timeout for testing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Thirdweb timeout (10s)')), 10000);
    });

    console.log('🔄 Fetching data from Thirdweb...');
    
    const [nfts, listings, auctions] = await Promise.race([
      Promise.all([nftPromise, listingsPromise, auctionsPromise]),
      timeoutPromise
    ]) as [any[], any[], any[]];

    console.log('✅ Thirdweb data fetched successfully');

    return NextResponse.json({
      success: true,
      debugInfo,
      data: {
        nfts: {
          count: nfts.length,
          sample: nfts[0] ? {
            id: nfts[0].id?.toString(),
            name: nfts[0].metadata?.name,
            hasImage: !!nfts[0].metadata?.image
          } : null
        },
        listings: {
          count: listings.length,
          sample: listings[0] ? {
            id: listings[0].id?.toString(),
            tokenId: listings[0].tokenId?.toString(),
            price: listings[0].currencyValuePerToken?.displayValue
          } : null
        },
        auctions: {
          count: auctions.length,
          sample: auctions[0] ? {
            id: auctions[0].id?.toString(),
            tokenId: auctions[0].tokenId?.toString(),
            endTime: auctions[0].endTimeInSeconds?.toString()
          } : null
        }
      }
    });

  } catch (error) {
    console.error('❌ Thirdweb direct test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debugInfo: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ? 'configured' : 'missing',
        nftContract: NFT_CONTRACT_ADDRESS,
        marketplaceContract: MARKETPLACE_CONTRACT_ADDRESS
      }
    }, { status: 500 });
  }
} 