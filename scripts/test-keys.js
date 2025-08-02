// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { createThirdwebClient, getContract, Engine } = require('thirdweb');
const { defineChain } = require('thirdweb/chains');

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

// As duas chaves que você tem
const KEY_1 = "4FI9X1sMM2hyou0Dg-yFOmyliAyJJkB6ouYyHZCZ2Mqz6mmc1keLJYj41lvXLiEzEh4Yn_Jkpu1OTV2h1wPwqw";
const KEY_2 = "9FO4KyarSchQjSyBCcdCv0_jMkviGCCJoHTzm3bDJzz0LtvSILYg4IZO6z1zbzlgDTcH0wIpcB3eGqmaqRCVvw";

async function testKey(secretKey, keyName) {
  console.log(`\n🔧 Testing ${keyName}...`);
  console.log(`Key: ${secretKey.substring(0, 10)}...${secretKey.substring(secretKey.length - 10)}`);
  
  try {
    // Create client
    const client = createThirdwebClient({ 
      secretKey: secretKey
    });
    console.log('   ✅ Client created successfully');

    // Test Engine server wallet
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: secretKey,
    });
    console.log('   ✅ Engine server wallet created successfully');

    // Test contract connection
    const contract = getContract({
      client,
      chain: amoy,
      address: LAUNCHPAD_CONTRACT_ADDRESS,
    });
    console.log('   ✅ Contract connection successful');

    console.log(`   ✅ ${keyName} is VALID!`);
    return true;

  } catch (error) {
    console.log(`   ❌ ${keyName} is INVALID:`, error.message);
    return false;
  }
}

async function testBothKeys() {
  console.log('🔧 Testing both Thirdweb secret keys...\n');

  const key1Valid = await testKey(KEY_1, "KEY_1");
  const key2Valid = await testKey(KEY_2, "KEY_2");

  console.log('\n📋 Results:');
  if (key1Valid && key2Valid) {
    console.log('   ⚠️  Both keys are valid - you need to choose one');
    console.log('   💡 Recommendation: Use the one from your main Thirdweb project');
  } else if (key1Valid) {
    console.log('   ✅ KEY_1 is valid - keep this one');
    console.log('   ❌ KEY_2 is invalid - remove this one');
  } else if (key2Valid) {
    console.log('   ✅ KEY_2 is valid - keep this one');
    console.log('   ❌ KEY_1 is invalid - remove this one');
  } else {
    console.log('   ❌ Both keys are invalid - check your Thirdweb dashboard');
  }

  console.log('\n📋 Next steps:');
  console.log('   1. Go to https://thirdweb.com/dashboard');
  console.log('   2. Check which project these keys belong to');
  console.log('   3. Keep only the key from your main project');
  console.log('   4. Remove the duplicate from .env.local');
}

// Run the test
testBothKeys().catch(console.error); 