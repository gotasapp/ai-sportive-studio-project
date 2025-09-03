const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testLaunchpadSubmission() {
  console.log('🧪 Testing Launchpad Image Submission...\n');
  
  try {
    // 1. Enviar imagem pendente para o Launchpad
    console.log('1️⃣ Submitting image to launchpad...');
    const submitResponse = await fetch(`${BASE_URL}/launchpad/pending-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: 'https://example.com/test-jersey.jpg',
        category: 'jerseys',
        metadata: {
          team: 'Flamengo',
          playerName: 'JEFF',
          playerNumber: '10',
          style: 'modern',
          quality: 'standard',
          isVisionMode: false
        },
        description: 'Flamengo JEFF #10 - Modern style jersey',
        price: '0.1',
        maxSupply: 100,
        creator: {
          name: 'Admin',
          wallet: '0x1234567890abcdef'
        }
      })
    });
    
    const submitResult = await submitResponse.json();
    console.log('✅ Submit result:', submitResult);
    
    if (!submitResult.success) {
      throw new Error('Failed to submit image to launchpad');
    }
    
    const pendingImageId = submitResult.pendingImageId;
    
    // 2. Listar imagens pendentes
    console.log('\n2️⃣ Fetching pending images...');
    const listResponse = await fetch(`${BASE_URL}/launchpad/pending-images`);
    const listResult = await listResponse.json();
    console.log('✅ Pending images:', listResult.pendingImages.length);
    
    // 3. Testar filtro por categoria
    console.log('\n3️⃣ Testing category filter...');
    const filterResponse = await fetch(`${BASE_URL}/launchpad/pending-images?category=jerseys`);
    const filterResult = await filterResponse.json();
    console.log('✅ Filtered jerseys:', filterResult.pendingImages.length);
    
    // 4. Testar paginação
    console.log('\n4️⃣ Testing pagination...');
    const paginationResponse = await fetch(`${BASE_URL}/launchpad/pending-images?page=1&limit=5`);
    const paginationResult = await paginationResponse.json();
    console.log('✅ Pagination result:', {
      page: paginationResult.pagination.page,
      total: paginationResult.pagination.total,
      totalPages: paginationResult.pagination.totalPages
    });
    
    console.log('\n🎉 All launchpad submission tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Executar testes
testLaunchpadSubmission(); 