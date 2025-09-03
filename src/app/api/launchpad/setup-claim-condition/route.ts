import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { prepareContractCall } from 'thirdweb';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

export async function POST(request: NextRequest) {
  try {
    if (!THIRDWEB_SECRET_KEY || !LAUNCHPAD_CONTRACT_ADDRESS) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    console.log('🔧 Setting up claim condition for OpenEditionERC721...');
    console.log('📄 Contract:', LAUNCHPAD_CONTRACT_ADDRESS);

    // Create Thirdweb client with secret key
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });

    // Get contract
    const contract = getContract({
      client,
      chain: amoy,
      address: LAUNCHPAD_CONTRACT_ADDRESS,
    });

              // Set claim conditions for public mint
     const transaction = await prepareContractCall({
       contract,
       method: "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
       params: [
         [
           {
             startTimestamp: BigInt(0),
             maxClaimableSupply: BigInt(0), // 0 = unlimited
             supplyClaimed: BigInt(0),
             quantityLimitPerWallet: BigInt(0), // 0 = unlimited
             merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000",
             pricePerToken: BigInt(0), // Free mint
             currency: "0x0000000000000000000000000000000000000000", // Native token
             metadata: ""
           }
         ],
         true // resetClaimEligibility
       ],
     });

     console.log('✅ Claim condition transaction prepared');

     // Send transaction via Thirdweb Engine
     const serverWallet = Engine.serverWallet({
       address: process.env.BACKEND_WALLET_ADDRESS || '',
       client: client,
       vaultAccessToken: THIRDWEB_SECRET_KEY,
     });

     console.log('🔧 Engine configured, enqueueing transaction...');

     // Enqueue the transaction
     const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
     
     console.log(`✅ Claim condition set successfully! Queue ID: ${transactionId}`);
    
    

         return NextResponse.json({ 
       success: true, 
       queueId: transactionId,
       message: 'Claim condition configured for public mint'
     });

  } catch (error) {
    console.error('❌ Failed to set claim condition:', error);
    return NextResponse.json({ 
      error: 'Failed to set claim condition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 