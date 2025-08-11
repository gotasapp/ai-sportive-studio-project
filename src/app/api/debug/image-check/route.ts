import { NextResponse } from 'next/server';

// Lista de gateways IPFS para testar
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
  'https://gateway.ipfs.io/ipfs',
  'https://nftstorage.link/ipfs'
];

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }
    
    console.log('🔍 Debug checking image:', imageUrl);
    
    const results = {
      originalUrl: imageUrl,
      isCloudinary: imageUrl.includes('cloudinary.com'),
      isIPFS: imageUrl.startsWith('ipfs://') || imageUrl.includes('/ipfs/'),
      ipfsHash: null as string | null,
      gatewayTests: [] as any[],
      workingUrls: [] as string[],
      recommendation: ''
    };
    
    // Se é Cloudinary, testar direto
    if (results.isCloudinary) {
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        results.gatewayTests.push({
          url: imageUrl,
          status: response.status,
          success: response.ok
        });
        
        if (response.ok) {
          results.workingUrls.push(imageUrl);
          results.recommendation = 'Use Cloudinary URL directly';
        }
      } catch (error) {
        results.gatewayTests.push({
          url: imageUrl,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      return NextResponse.json(results);
    }
    
    // Extrair hash IPFS
    if (imageUrl.startsWith('ipfs://')) {
      results.ipfsHash = imageUrl.replace('ipfs://', '');
    } else if (imageUrl.includes('/ipfs/')) {
      results.ipfsHash = imageUrl.split('/ipfs/')[1];
    } else if (imageUrl.match(/^Qm[a-zA-Z0-9]{44}$/)) {
      results.ipfsHash = imageUrl;
    }
    
    // Se temos hash IPFS, testar todos os gateways
    if (results.ipfsHash) {
      console.log('📌 Testing IPFS hash:', results.ipfsHash);
      
      const testPromises = IPFS_GATEWAYS.map(async (gateway) => {
        const testUrl = `${gateway}/${results.ipfsHash}`;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          
          const response = await fetch(testUrl, {
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          const result = {
            gateway,
            url: testUrl,
            status: response.status,
            success: response.ok,
            responseTime: 0
          };
          
          if (response.ok) {
            results.workingUrls.push(testUrl);
          }
          
          return result;
        } catch (error) {
          return {
            gateway,
            url: testUrl,
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      results.gatewayTests = await Promise.all(testPromises);
    } else {
      // Não é IPFS, testar URL original
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        results.gatewayTests.push({
          url: imageUrl,
          status: response.status,
          success: response.ok
        });
        
        if (response.ok) {
          results.workingUrls.push(imageUrl);
        }
      } catch (error) {
        results.gatewayTests.push({
          url: imageUrl,
          status: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Gerar recomendação
    if (results.workingUrls.length > 0) {
      results.recommendation = `Use working URL: ${results.workingUrls[0]}`;
    } else {
      results.recommendation = 'No working URLs found. Consider re-uploading the image.';
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Debug image check error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
