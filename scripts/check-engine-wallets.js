const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

async function checkEngineWallets() {
  if (!ENGINE_URL || !THIRDWEB_SECRET_KEY) {
    console.error('❌ Missing ENGINE_URL or THIRDWEB_SECRET_KEY');
    return;
  }

  try {
    console.log('🔍 Checking Engine wallets...');
    console.log('📍 Engine URL:', ENGINE_URL);

    // Tentar obter informações do backend wallet
    const walletsResponse = await fetch(`${ENGINE_URL}/backend-wallet/get-all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${THIRDWEB_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!walletsResponse.ok) {
      console.log('⚠️  Backend wallet endpoint not available, trying alternative...');
      
      // Tentar endpoint alternativo
      const altResponse = await fetch(`${ENGINE_URL}/wallet`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${THIRDWEB_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (altResponse.ok) {
        const data = await altResponse.json();
        console.log('✅ Wallet info:', JSON.stringify(data, null, 2));
      } else {
        console.error('❌ Could not fetch wallet info');
      }
    } else {
      const walletsData = await walletsResponse.json();
      console.log('✅ Backend wallets:', JSON.stringify(walletsData, null, 2));
    }

    // Verificar configuração
    const configResponse = await fetch(`${ENGINE_URL}/configuration`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${THIRDWEB_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('\n⚙️  Engine configuration:', JSON.stringify(configData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEngineWallets(); 