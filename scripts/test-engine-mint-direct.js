require('dotenv').config({ path: '.env.local' });
const { createThirdwebClient, getContract, Engine } = require('thirdweb');
const { defineChain } = require('thirdweb/chains');
const { mintTo } = require('thirdweb/extensions/erc721');

// Define Polygon Amoy
const amoy = defineChain(80002);

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

async function testEngineMint() {
  console.log('🧪 Testing Engine Mint Direct...');
  console.log('📍 Contract:', CONTRACT_ADDRESS);
  console.log('📍 Backend Wallet:', BACKEND_WALLET_ADDRESS);
  console.log('📍 Has Secret Key:', !!THIRDWEB_SECRET_KEY);

  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    console.error('❌ Missing required environment variables');
    return;
  }

  try {
    // Criar cliente
    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    
    // Obter contrato
    const contract = getContract({ 
      client, 
      chain: amoy, 
      address: CONTRACT_ADDRESS 
    });

    // Endereço de destino (pode ser seu endereço de teste)
    const to = '0x7cf44Efb99CF11f87B80CC9770957d3e88C37048'; // Seu endereço
    
    console.log('🔧 Using Backend Wallet:', BACKEND_WALLET_ADDRESS);
    console.log('🎯 Minting to:', to);
    const metadataUri = 'ipfs://bafkreiggnmls5pp25twir5n4n7ommizhgfnkowmljab45k6tu6twdr2o3y'; // URI de teste

    // Preparar transação
    const transaction = mintTo({ 
      contract, 
      to, 
      nft: metadataUri 
    });

    console.log('✅ Transaction prepared');

    // Configurar server wallet
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: THIRDWEB_SECRET_KEY,
    });

    console.log('✅ Server wallet configured');

    // Enfileirar transação
    const response = await serverWallet.enqueueTransaction({ transaction });
    
    console.log('✅ Transaction enqueued!');
    console.log('📋 Response:', JSON.stringify(response, null, 2));
    console.log('🆔 Transaction ID:', response.transactionId || response.queueId || 'Unknown');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEngineMint(); 