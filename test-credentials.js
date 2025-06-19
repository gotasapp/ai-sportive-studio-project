// test-credentials.js
require('dotenv').config({ path: '.env.local' });

// --- LEIA AS SUAS CREDENCIAIS DO .env.local ---
const SECRET_KEY = process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY;
const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'https://engine.thirdweb.com';

// Endpoint de teste do Engine que requer autenticação
const TEST_URL = `${ENGINE_URL}/v1/configuration/backend-wallets`;

console.log('--- 🧪 Teste de Credenciais do Thirdweb Engine ---');
console.log('Verificando as variáveis lidas do .env.local:');
console.log(`  - CLIENT_ID: ${CLIENT_ID ? '✅ Encontrado' : '❌ NÃO ENCONTRADO'}`);
console.log(`  - SECRET_KEY: ${SECRET_KEY ? '✅ Encontrada' : '❌ NÃO ENCONTRADA'}`);

if (!SECRET_KEY || !CLIENT_ID) {
  console.log('\n❌ ERRO: Uma ou mais variáveis não foram encontradas no .env.local.');
  console.log('   Verifique se os nomes NEXT_PUBLIC_THIRDWEB_SECRET_KEY e NEXT_PUBLIC_THIRDWEB_CLIENT_ID estão corretos.');
  process.exit(1);
}

console.log(`\nEnviando requisição para: ${TEST_URL}`);

async function runTest() {
  try {
    const response = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_KEY}`,
        'x-client-id': CLIENT_ID,
      },
    });

    console.log(`\n📬 Resposta do Servidor:`);
    console.log(`   - Status: ${response.status} ${response.statusText}`);

    const responseBody = await response.json();

    if (response.ok) {
      console.log('   - Corpo: ', responseBody);
      console.log('\n✅ SUCESSO! Suas credenciais são VÁLIDAS e a conexão com o Engine funcionou!');
    } else {
      console.log('   - Erro: ', responseBody);
      console.log('\n❌ FALHA! O Engine rejeitou suas credenciais. Verifique os possíveis problemas:');
      if (response.status === 401) {
        console.log('   1. A "Secret Key" está errada ou foi copiada incorretamente.');
        console.log('   2. A API Key não tem permissão para acessar o serviço do Engine no dashboard da Thirdweb.');
      } else {
        console.log(`   - O erro ${response.status} pode indicar outro problema.`);
      }
    }
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO DE CONEXÃO:', error.message);
  }
}

runTest(); 