#!/usr/bin/env node

const fetch = require('node-fetch');

// Test specific wallet address that might have issues
const TEST_WALLET = "0x742d35Cc6634C0532925a3b8D72B8DAaA01A6D49"; // Replace with your wallet

// IPFS gateways to test
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://hardbin.com/ipfs/',
  'https://infura-ipfs.io/ipfs/'
];

// Function to test image accessibility
async function testImageUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return {
      url,
      accessible: response.ok,
      status: response.status,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        lastModified: response.headers.get('last-modified')
      }
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      url,
      accessible: false,
      error: error.message
    };
  }
}

// Main test function
async function testProductionImages() {
  console.log('🔍 Testing Production Image Issues');
  console.log('=====================================\n');
  
  // Test 1: Fetch user NFTs from production API
  console.log('📋 Step 1: Fetching user NFTs from API...');
  try {
    const apiUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/profile/user-nfts?address=${TEST_WALLET}`
      : `http://localhost:3000/api/profile/user-nfts?address=${TEST_WALLET}`;
      
    console.log(`API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API request failed:', result.error);
      return;
    }
    
    const nfts = result.data.nfts || [];
    console.log(`✅ Found ${nfts.length} NFTs for user`);
    console.log(`📊 Data source: ${result.source}`);
    
    // Test 2: Check each NFT image URL
    console.log('\n📋 Step 2: Testing individual NFT images...');
    
    for (let i = 0; i < Math.min(nfts.length, 10); i++) {
      const nft = nfts[i];
      console.log(`\n🖼️  Testing NFT: ${nft.name} (ID: ${nft.tokenId})`);
      console.log(`   Original URL: ${nft.imageUrl}`);
      
      if (!nft.imageUrl) {
        console.log('   ⚠️  No image URL found');
        continue;
      }
      
      // Test original URL
      const originalTest = await testImageUrl(nft.imageUrl);
      console.log(`   ${originalTest.accessible ? '✅' : '❌'} Original: ${originalTest.status || originalTest.error}`);
      
      // If original fails and it's IPFS, test alternative gateways
      if (!originalTest.accessible && nft.imageUrl.includes('ipfs')) {
        console.log('   🔄 Testing alternative IPFS gateways...');
        
        // Extract IPFS hash
        let hash = '';
        if (nft.imageUrl.includes('/ipfs/')) {
          hash = nft.imageUrl.split('/ipfs/')[1];
        }
        
        if (hash) {
          for (const gateway of IPFS_GATEWAYS.slice(0, 3)) { // Test first 3 gateways
            const alternativeUrl = `${gateway}${hash}`;
            const gatewayTest = await testImageUrl(alternativeUrl);
            console.log(`     ${gatewayTest.accessible ? '✅' : '❌'} ${gateway}: ${gatewayTest.status || gatewayTest.error}`);
            
            if (gatewayTest.accessible) {
              console.log(`     💡 Working alternative found: ${alternativeUrl}`);
              break;
            }
          }
        }
      }
    }
    
    // Test 3: Summary and recommendations
    console.log('\n📋 Step 3: Summary & Recommendations');
    console.log('====================================');
    
    const nftsWithImages = nfts.filter(nft => nft.imageUrl);
    const ipfsImages = nfts.filter(nft => nft.imageUrl && nft.imageUrl.includes('ipfs'));
    
    console.log(`📊 NFTs with images: ${nftsWithImages.length}/${nfts.length}`);
    console.log(`📊 IPFS images: ${ipfsImages.length}/${nftsWithImages.length}`);
    console.log(`📊 HTTP images: ${nftsWithImages.length - ipfsImages.length}/${nftsWithImages.length}`);
    
    if (ipfsImages.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   - Implement IPFS gateway fallback system');
      console.log('   - Use multiple IPFS gateways for reliability');
      console.log('   - Consider caching images in CDN');
      console.log('   - Add retry logic for failed images');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test specific IPFS hash if provided
async function testSpecificHash(hash) {
  console.log(`🔍 Testing specific IPFS hash: ${hash}`);
  console.log('================================\n');
  
  for (const gateway of IPFS_GATEWAYS) {
    const url = `${gateway}${hash}`;
    const result = await testImageUrl(url);
    console.log(`${result.accessible ? '✅' : '❌'} ${gateway}: ${result.status || result.error}`);
  }
}

// Run tests
if (process.argv[2]) {
  // Test specific IPFS hash
  testSpecificHash(process.argv[2]);
} else {
  // Test production images
  testProductionImages();
} 