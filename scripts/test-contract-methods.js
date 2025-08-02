// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

const { createThirdwebClient, getContract, prepareContractCall } = require('thirdweb');
const { defineChain } = require('thirdweb/chains');

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

async function testContractMethods() {
  console.log('🔧 Testing contract methods...\n');

  if (!THIRDWEB_CLIENT_ID || !LAUNCHPAD_CONTRACT_ADDRESS) {
    console.error('❌ Missing environment variables');
    return;
  }

  try {
    // Create client and contract
    const client = createThirdwebClient({
      clientId: THIRDWEB_CLIENT_ID
    });

    const contract = getContract({
      client,
      chain: amoy,
      address: LAUNCHPAD_CONTRACT_ADDRESS,
    });

    console.log('📋 Contract address:', LAUNCHPAD_CONTRACT_ADDRESS);
    console.log('');

    // Test data
    const testData = {
      to: "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56",
      metadataUri: "ipfs://QmTest123",
      price: "0",
      quantity: 1
    };

    // Test 1: mintTo method (NFT Collection)
    console.log('1. Testing mintTo method (NFT Collection):');
    try {
      const mintToTransaction = prepareContractCall({
        contract,
        method: "function mintTo(address _to, string _uri) returns (uint256)",
        params: [
          testData.to,
          testData.metadataUri
        ]
      });
      console.log('   ✅ mintTo method works!');
      console.log('   📋 Transaction structure:', {
        hasParams: !!mintToTransaction.params,
        paramsLength: mintToTransaction.params?.length,
        hasValue: !!mintToTransaction.value
      });
    } catch (error) {
      console.log('   ❌ mintTo method failed:', error.message);
    }
    console.log('');

    // Test 2: claim method (OpenEditionERC721)
    console.log('2. Testing claim method (OpenEditionERC721):');
    try {
      const claimTransaction = prepareContractCall({
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
      console.log('   ✅ claim method works!');
      console.log('   📋 Transaction structure:', {
        hasParams: !!claimTransaction.params,
        paramsLength: claimTransaction.params?.length,
        hasValue: !!claimTransaction.value
      });
    } catch (error) {
      console.log('   ❌ claim method failed:', error.message);
    }
    console.log('');

    // Test 3: mint method (basic NFT)
    console.log('3. Testing mint method (basic NFT):');
    try {
      const mintTransaction = prepareContractCall({
        contract,
        method: "function mint(address _to, string _uri) returns (uint256)",
        params: [
          testData.to,
          testData.metadataUri
        ]
      });
      console.log('   ✅ mint method works!');
      console.log('   📋 Transaction structure:', {
        hasParams: !!mintTransaction.params,
        paramsLength: mintTransaction.params?.length,
        hasValue: !!mintTransaction.value
      });
    } catch (error) {
      console.log('   ❌ mint method failed:', error.message);
    }
    console.log('');

    console.log('📋 Summary:');
    console.log('   - Check which method works above');
    console.log('   - Use the working method in the API');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContractMethods().catch(console.error); 