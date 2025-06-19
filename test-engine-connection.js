// Test Engine Cloud Connection
require('dotenv').config({ path: '.env.local' });

const ENGINE_URL = process.env.ENGINE_URL || 'https://engine.thirdweb.com';
const PROJECT_ID = process.env.ENGINE_PROJECT_ID;
const ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN || process.env.ENGINE_ADMIN_KEY;

console.log('🔧 Testing Engine Cloud Connection');
console.log('====================================');
console.log('URL:', ENGINE_URL);
console.log('Project ID:', PROJECT_ID ? '✅ SET' : '❌ NOT SET');
console.log('Access Token:', ACCESS_TOKEN ? '✅ SET' : '❌ NOT SET');

async function testConnection() {
  if (!PROJECT_ID && !ACCESS_TOKEN) {
    console.log('❌ No Project ID or Access Token found');
    return;
  }

  try {
    console.log('\n🌐 Testing connection...');
    
    // Setup headers for Engine Cloud
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (PROJECT_ID) {
      headers['x-client-id'] = PROJECT_ID;
      console.log('🔑 Using Engine Cloud authentication (x-client-id)');
    }
    
    if (ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
      console.log('🔑 Using Bearer token authentication');
    }
    
    const response = await fetch(`${ENGINE_URL}/configuration/backend-wallets`, {
      headers
    });

    console.log('📡 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connection successful!');
      console.log('📋 Backend wallets:', data.result?.length || 0);
    } else {
      const error = await response.text();
      console.log('❌ Connection failed');
      console.log('Error:', error);
      
      if (response.status === 404) {
        console.log('\n💡 Dica: URL pode estar incorreta. Verifique se é a URL específica do seu projeto.');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('\n💡 Dica: Verifique se a ENGINE_URL está correta.');
  }
}

testConnection(); 