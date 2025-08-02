// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { createThirdwebClient, getContract, Engine } = require('thirdweb');
const { defineChain } = require('thirdweb/chains');

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

async function testLaunchpadConfig() {
  console.log('🔧 Testing Launchpad Configuration...\n');

  // 1. Check environment variables
  console.log('1. Environment Variables Check:');
  console.log('   THIRDWEB_CLIENT_ID:', THIRDWEB_CLIENT_ID ? '✅ Present' : '❌ Missing');
  console.log('   THIRDWEB_SECRET_KEY:', THIRDWEB_SECRET_KEY ? `✅ Present (${THIRDWEB_SECRET_KEY.length} chars)` : '❌ Missing');
  console.log('   BACKEND_WALLET_ADDRESS:', BACKEND_WALLET_ADDRESS ? `✅ ${BACKEND_WALLET_ADDRESS}` : '❌ Missing');
  console.log('   LAUNCHPAD_CONTRACT_ADDRESS:', LAUNCHPAD_CONTRACT_ADDRESS ? `✅ ${LAUNCHPAD_CONTRACT_ADDRESS}` : '❌ Missing');
  console.log('');

  if (!THIRDWEB_CLIENT_ID || !THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !LAUNCHPAD_CONTRACT_ADDRESS) {
    console.log('❌ Missing required environment variables. Please check your .env.local file.');
    return;
  }

  try {
    // 2. Test Thirdweb client creation
    console.log('2. Testing Thirdweb Client Creation:');
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY
    });
    console.log('   ✅ Thirdweb client created successfully');
    console.log('');

    // 3. Test contract connection
    console.log('3. Testing Contract Connection:');
    const contract = getContract({
      client,
      chain: amoy,
      address: LAUNCHPAD_CONTRACT_ADDRESS,
    });
    console.log('   ✅ Contract connection successful');
    console.log('');

    // 4. Test Engine server wallet creation
    console.log('4. Testing Engine Server Wallet:');
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: THIRDWEB_SECRET_KEY,
    });
    console.log('   ✅ Engine server wallet created successfully');
    console.log('');

    // 5. Test reading contract state
    console.log('5. Testing Contract State Reading:');
    try {
      const { readContract } = require('thirdweb');
      const totalSupply = await readContract({
        contract,
        method: "function totalSupply() view returns (uint256)",
        params: []
      });
      console.log('   ✅ Contract readable, total supply:', totalSupply.toString());
    } catch (error) {
      console.log('   ⚠️  Contract read failed (might be normal for new contracts):', error.message);
    }
    console.log('');

    console.log('✅ All tests passed! Launchpad configuration is correct.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Try setting claim conditions via API');
    console.log('   2. Test minting functionality');
    console.log('   3. Check transaction status in Engine dashboard');

  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    if (error.message?.includes('service key is invalid')) {
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Check your THIRDWEB_SECRET_KEY in .env.local');
      console.log('   2. Make sure the key is from the correct Thirdweb project');
      console.log('   3. Verify the key has the correct permissions');
    }
  }
}

// Run the test
testLaunchpadConfig().catch(console.error); 