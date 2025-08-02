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

async function setupLaunchpadConditions() {
  console.log('🔧 Setting up Launchpad Claim Conditions...\n');

  // Check environment variables
  if (!THIRDWEB_CLIENT_ID || !THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !LAUNCHPAD_CONTRACT_ADDRESS) {
    console.error('❌ Missing required environment variables');
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

    console.log('📋 Setting claim conditions with parameters:');
    console.log('   Contract:', LAUNCHPAD_CONTRACT_ADDRESS);
    console.log('   Price: 0 MATIC (free mint)');
    console.log('   Max Supply: 1000');
    console.log('   Max Per Wallet: 1');
    console.log('   Start Time: Now');
    console.log('');

    // Prepare claim conditions array
    const claimConditions = [{
      startTimestamp: Math.floor(Date.now() / 1000), // Start now
      maxClaimableSupply: BigInt(1000),
      supplyClaimed: BigInt(0), // Start with 0 claimed
      quantityLimitPerWallet: BigInt(1),
      merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000", // No allowlist
      pricePerToken: BigInt(0), // Free mint
      currency: "0x0000000000000000000000000000000000000000", // Native token (MATIC)
      metadata: "" // No metadata for claim condition
    }];

    // Create transaction
    const transaction = prepareContractCall({
      contract,
      method: "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
      params: [claimConditions, false] // false = don't reset claim eligibility
    });

    console.log('✅ Transaction prepared successfully');

    // Use Engine to send transaction
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: THIRDWEB_SECRET_KEY,
    });

    console.log("🔧 Engine configured, enqueueing transaction...");

    // Enqueue the transaction
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ Claim conditions set successfully!`);
    console.log(`📋 Transaction ID: ${transactionId}`);
    console.log('');
    console.log('🎉 Launchpad is now ready for minting!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Wait for transaction to be processed');
    console.log('   2. Test minting functionality');
    console.log('   3. Check transaction status in Engine dashboard');

  } catch (error) {
    console.error('❌ Failed to set claim conditions:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the setup
setupLaunchpadConditions().catch(console.error); 