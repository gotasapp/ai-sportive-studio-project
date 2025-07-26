const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testCollectionsAPI() {
  console.log('🧪 Testing Collections API...\n');
  
  try {
    // 1. Criar uma coleção de teste
    console.log('1️⃣ Creating test collection...');
    const createResponse = await fetch(`${BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Collection Launchpad',
        description: 'Uma coleção de teste para o launchpad',
        image: 'https://example.com/image.jpg',
        bannerImage: 'https://example.com/banner.jpg',
        category: 'jerseys',
        type: 'launchpad',
        creator: {
          name: 'Test Creator',
          wallet: '0x1234567890abcdef',
          avatar: 'https://example.com/avatar.jpg'
        },
        price: '0.1',
        maxSupply: 100,
        launchDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Amanhã
      })
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Create result:', createResult);
    
    if (!createResult.success) {
      throw new Error('Failed to create collection');
    }
    
    const collectionId = createResult.collectionId;
    
    // 2. Buscar coleções (admin view)
    console.log('\n2️⃣ Fetching collections (admin view)...');
    const adminResponse = await fetch(`${BASE_URL}/admin/collections?isAdmin=true&type=launchpad`);
    const adminResult = await adminResponse.json();
    console.log('✅ Admin collections:', adminResult.collections.length);
    
    // 3. Buscar coleções (user view - launchpad)
    console.log('\n3️⃣ Fetching launchpad collections (user view)...');
    const launchpadResponse = await fetch(`${BASE_URL}/launchpad/collections`);
    const launchpadResult = await launchpadResponse.json();
    console.log('✅ Launchpad collections:', launchpadResult.collections.length);
    console.log('Active:', launchpadResult.activeCollections.length);
    console.log('Upcoming:', launchpadResult.upcomingCollections.length);
    
    // 4. Ativar coleção para launchpad
    console.log('\n4️⃣ Activating collection for launchpad...');
    const activateResponse = await fetch(`${BASE_URL}/admin/activate-launchpad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionId,
        status: 'upcoming',
        launchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // Em 2 dias
      })
    });
    
    const activateResult = await activateResponse.json();
    console.log('✅ Activate result:', activateResult);
    
    // 5. Buscar coleção específica
    console.log('\n5️⃣ Fetching specific collection...');
    const specificResponse = await fetch(`${BASE_URL}/collections/${collectionId}`);
    const specificResult = await specificResponse.json();
    console.log('✅ Specific collection:', specificResult.collection.name);
    console.log('Status:', specificResult.collection.status);
    console.log('Type:', specificResult.collection.type);
    
    // 6. Atualizar coleção (admin)
    console.log('\n6️⃣ Updating collection (admin)...');
    const updateResponse = await fetch(`${BASE_URL}/admin/collections`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionId,
        updates: {
          status: 'active',
          description: 'Coleção atualizada e ativa!'
        }
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('✅ Update result:', updateResult);
    
    // 7. Verificar status final
    console.log('\n7️⃣ Checking final status...');
    const finalResponse = await fetch(`${BASE_URL}/launchpad/collections`);
    const finalResult = await finalResponse.json();
    console.log('✅ Final launchpad collections:');
    console.log('Active:', finalResult.activeCollections.length);
    console.log('Upcoming:', finalResult.upcomingCollections.length);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Executar testes
testCollectionsAPI(); 