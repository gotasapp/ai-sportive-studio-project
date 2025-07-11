import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs } from 'thirdweb/extensions/erc721';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

// Function to convert IPFS URLs to HTTP
function convertIpfsToHttp(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  
  if (ipfsUrl.startsWith('ipfs://')) {
    // Try multiple gateways for better reliability
    const hash = ipfsUrl.replace('ipfs://', '');
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://gateway.ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`
    ];
    
    // Return the first gateway (Pinata - most reliable)
    return gateways[0];
  }
  
  return ipfsUrl;
}

// Function to test image accessibility
async function testImageAccessibility(imageUrl: string): Promise<{
  url: string;
  accessible: boolean;
  status?: number;
  error?: string;
  responseTime?: number;
}> {
  if (!imageUrl) {
    return { url: imageUrl, accessible: false, error: 'No URL provided' };
  }

  const startTime = Date.now();
  
  try {
    // Test with a simple HEAD request to check if image is accessible
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      url: imageUrl,
      accessible: response.ok,
      status: response.status,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      url: imageUrl,
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    const testImages = searchParams.get('testImages') === 'true';
    
    if (!userAddress) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    console.log('🔍 [DEBUG] Testing profile images for:', userAddress);
    console.log('🔍 [DEBUG] Environment:', {
      isProduction: process.env.NODE_ENV === 'production',
      hasThirdwebClient: !!process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
      hasMongoDB: !!process.env.MONGODB_URI
    });

    // Get NFTs from contract
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    console.log('📋 [DEBUG] Fetching NFTs from contract...');
    const allNFTs = await getNFTs({ contract: nftContract, start: 0, count: 100 });
    console.log(`📋 [DEBUG] Found ${allNFTs.length} total NFTs in contract`);

    const debugResults = [];

    for (const nft of allNFTs.slice(0, 20)) { // Test first 20 NFTs
      const tokenId = nft.id?.toString();
      const metadata = nft.metadata || {};
      
      const originalImageUrl = metadata.image || '';
      const convertedImageUrl = convertIpfsToHttp(originalImageUrl);
      
      const nftDebugInfo: any = {
        tokenId,
        name: metadata.name || `NFT #${tokenId}`,
        originalImageUrl,
        convertedImageUrl,
        isIpfs: originalImageUrl.startsWith('ipfs://'),
        hasImage: !!originalImageUrl
      };

      // Test image accessibility if requested
      if (testImages && convertedImageUrl) {
        console.log(`🔍 [DEBUG] Testing image access for NFT #${tokenId}...`);
        const imageTest = await testImageAccessibility(convertedImageUrl);
        nftDebugInfo.imageAccessibility = imageTest;
      }

      debugResults.push(nftDebugInfo);
    }

    // Check MongoDB data for comparison
    let mongoDebugInfo = null;
    try {
      const mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      
      const jerseys = await db.collection('jerseys').find({}).limit(5).toArray();
      const stadiums = await db.collection('stadiums').find({}).limit(5).toArray();
      const badges = await db.collection('badges').find({}).limit(5).toArray();
      
      mongoDebugInfo = {
        jerseysCount: jerseys.length,
        stadiumsCount: stadiums.length,
        badgesCount: badges.length,
        jerseySample: jerseys.map(j => ({
          name: j.name,
          imageUrl: j.imageUrl,
          hasImage: !!j.imageUrl
        })),
        stadiumSample: stadiums.map(s => ({
          name: s.name,
          imageUrl: s.imageUrl,
          hasImage: !!s.imageUrl
        })),
        badgeSample: badges.map(b => ({
          name: b.name,
          imageUrl: b.imageUrl,
          hasImage: !!b.imageUrl
        }))
      };
      
      await mongoClient.close();
    } catch (error) {
      console.error('❌ [DEBUG] MongoDB connection failed:', error);
      mongoDebugInfo = { error: 'MongoDB connection failed' };
    }

    // Summary statistics
    const summary = {
      totalNFTs: debugResults.length,
      nftsWithImages: debugResults.filter(nft => nft.hasImage).length,
      ipfsImages: debugResults.filter(nft => nft.isIpfs).length,
      httpImages: debugResults.filter(nft => nft.hasImage && !nft.isIpfs).length,
      imagesWithoutUrls: debugResults.filter(nft => !nft.hasImage).length
    };

    if (testImages) {
      const accessibleImages = debugResults.filter(nft => 
        nft.imageAccessibility?.accessible
      ).length;
      const inaccessibleImages = debugResults.filter(nft => 
        nft.imageAccessibility && !nft.imageAccessibility.accessible
      ).length;
      
      summary.accessibleImages = accessibleImages;
      summary.inaccessibleImages = inaccessibleImages;
    }

    return NextResponse.json({
      success: true,
      userAddress,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        vercel: !!process.env.VERCEL,
        vercelUrl: process.env.VERCEL_URL
      },
      summary,
      nftDebugData: debugResults,
      mongoDebugInfo,
      recommendations: [
        testImages ? null : 'Add ?testImages=true to test image accessibility',
        summary.ipfsImages > 0 ? 'Some images use IPFS - ensure gateways are accessible' : null,
        summary.imagesWithoutUrls > 0 ? 'Some NFTs missing image URLs' : null
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error in profile images debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 