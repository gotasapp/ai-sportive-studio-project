import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  try {
    if (!THIRDWEB_SECRET_KEY || !LAUNCHPAD_CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    console.log('🎯 Setting shared metadata for OpenEditionERC721...');
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

    // Prepare setSharedMetadata transaction
    const transaction = prepareContractCall({
      contract,
      method: "function setSharedMetadata(string _metadata) external",
      params: [
        JSON.stringify({
          name: "AI Sports NFT Collection",
          description: "AI-generated sports NFT collection from Launchpad",
          image: "https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle",
          attributes: [
            { trait_type: "Collection", value: "Launchpad" },
            { trait_type: "Type", value: "AI Generated" },
            { trait_type: "Category", value: "Sports" }
          ]
        })
      ]
    });

    console.log('✅ Shared metadata transaction prepared');

    // Send transaction
    const result = await sendTransaction({
      transaction,
      account: { address: BACKEND_WALLET_ADDRESS },
    });
    
    console.log(`✅ Shared metadata set successfully! Transaction: ${result.transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      contractAddress: LAUNCHPAD_CONTRACT_ADDRESS,
      message: 'Shared metadata set successfully'
    });

  } catch (error: any) {
    console.error('❌ Error setting shared metadata:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to set shared metadata' 
    }, { status: 500 });
  }
} 