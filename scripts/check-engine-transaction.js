const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;

async function checkTransaction(queueId) {
  if (!ENGINE_URL || !THIRDWEB_SECRET_KEY) {
    console.error('❌ Missing ENGINE_URL or THIRDWEB_SECRET_KEY');
    return;
  }

  try {
    console.log('🔍 Checking transaction:', queueId);
    console.log('📍 Engine URL:', ENGINE_URL);

    const response = await fetch(`${ENGINE_URL}/transaction/status/${queueId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${THIRDWEB_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Transaction status:', JSON.stringify(data, null, 2));

    // Tentar também a API de queue
    const queueResponse = await fetch(`${ENGINE_URL}/transaction/queue`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${THIRDWEB_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (queueResponse.ok) {
      const queueData = await queueResponse.json();
      console.log('\n📋 Queue status:', JSON.stringify(queueData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error checking transaction:', error.message);
  }
}

// Verificar a transação específica
const queueId = process.argv[2] || '976ae397-40b7-4824-b188-8f04fd2bf5f1';
checkTransaction(queueId); 