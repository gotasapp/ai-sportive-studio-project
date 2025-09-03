// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { createThirdwebClient, getContract, Engine } = require('thirdweb');
const { defineChain } = require('thirdweb/chains');
const { prepareContractCall } = require('thirdweb');

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

async function testLaunchpadMint() {
  console.log('🎯 Testing Launchpad Mint Functionality...\n');

  // Check environment variables
  if (!THIRDWEB_CLIENT_ID || !THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !LAUNCHPAD_CONTRACT_ADDRESS) {
    console.error('❌ Missing required environment variables');
    console.log('Available variables:', {
      hasClientId: !!THIRDWEB_CLIENT_ID,
      hasSecretKey: !!THIRDWEB_SECRET_KEY,
      hasBackendWallet: !!BACKEND_WALLET_ADDRESS,
      hasLaunchpadContract: !!LAUNCHPAD_CONTRACT_ADDRESS
    });
    return;
  }

  try {
    // Create client and contract
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY
    });

    const contract = getContract({
      client,
      chain: amoy,
      address: LAUNCHPAD_CONTRACT_ADDRESS,
    });

    // Test data
    const testData = {
      to: BACKEND_WALLET_ADDRESS, // mint to backend wallet
      metadataUri: "ipfs://QmTest123", // test metadata
      price: "0.01",
      quantity: 1
    };

    console.log('📋 Test Parameters:');
    console.log('   To:', testData.to);
    console.log('   Metadata URI:', testData.metadataUri);
    console.log('   Price:', testData.price, 'MATIC');
    console.log('   Quantity:', testData.quantity);
    console.log('');

    // 1. Test claim transaction preparation
    console.log('1. Testing Claim Transaction Preparation:');
    try {
      const transaction = prepareContractCall({
        contract,
        method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable",
        params: [
          testData.to, // receiver
          BigInt(testData.quantity), // quantity
          "0x0000000000000000000000000000000000000000", // currency (native token)
          BigInt(Math.floor(parseFloat(testData.price) * Math.pow(10, 18))), // pricePerToken
          { // allowlistProof (no restrictions)
            proof: [],
            quantityLimitPerWallet: "0",
            pricePerToken: "0",
            currency: "0x0000000000000000000000000000000000000000"
          },
          "0x" // data
        ],
        value: BigInt(Math.floor(parseFloat(testData.price) * parseFloat(testData.quantity) * Math.pow(10, 18))) // Native token value
      });
      console.log('   ✅ Transaction prepared successfully');
    } catch (error) {
      console.error('   ❌ Transaction preparation failed:', error.message);
      return;
    }
    console.log('');

    // 2. Test Engine server wallet
    console.log('2. Testing Engine Server Wallet:');
    try {
      const serverWallet = Engine.serverWallet({
        address: BACKEND_WALLET_ADDRESS,
        client: client,
        vaultAccessToken: THIRDWEB_SECRET_KEY,
      });
      console.log('   ✅ Engine server wallet created successfully');
    } catch (error) {
      console.error('   ❌ Engine server wallet creation failed:', error.message);
      return;
    }
    console.log('');

    // 3. Test transaction enqueueing (without actually sending)
    console.log('3. Testing Transaction Enqueueing:');
    try {
      const serverWallet = Engine.serverWallet({
        address: BACKEND_WALLET_ADDRESS,
        client: client,
        vaultAccessToken: THIRDWEB_SECRET_KEY,
      });

      const transaction = prepareContractCall({
        contract,
        method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable",
        params: [
          testData.to,
          BigInt(testData.quantity),
          "0x0000000000000000000000000000000000000000",
          BigInt(Math.floor(parseFloat(testData.price) * Math.pow(10, 18))),
          {
            proof: [],
            quantityLimitPerWallet: "0",
            pricePerToken: "0",
            currency: "0x0000000000000000000000000000000000000000"
          },
          "0x"
        ],
        value: BigInt(Math.floor(parseFloat(testData.price) * parseFloat(testData.quantity) * Math.pow(10, 18)))
      });

      const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
      console.log('   ✅ Transaction enqueued successfully');
      console.log('   📋 Transaction ID:', transactionId);
    } catch (error) {
      console.error('   ❌ Transaction enqueueing failed:', error.message);
      console.error('   Error details:', {
        name: error.name,
        code: error.code
      });
      return;
    }
    console.log('');

    console.log('✅ All mint tests passed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Check transaction status in Engine dashboard');
    console.log('   2. Verify NFT was minted correctly');
    console.log('   3. Test with real user wallet addresses');

  } catch (error) {
    console.error('❌ Mint test failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the test
testLaunchpadMint().catch(console.error); 