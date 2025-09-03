import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { lazyMint } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!THIRDWEB_SECRET_KEY || !LAUNCHPAD_CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS || !BACKEND_WALLET_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    console.log('🎯 Lazy minting NFTs for OpenEditionERC721...');
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

    // Prepare lazy mint transaction
    const transaction = lazyMint({
      contract,
      nfts: [
        {
          name: "AI Sports NFT",
          description: "AI-generated sports NFT from Launchpad",
          image: "https://gateway.pinata.cloud/ipfs/bafybeibxbyvdvl7te72lh3hxgfhkrjnaji3mgazyvks5nekalotqhr7cle",
          attributes: [
            { trait_type: "Collection", value: "Launchpad" },
            { trait_type: "Mint Type", value: "Lazy Minted" }
          ]
        }
      ],
    });

    console.log('✅ Lazy mint transaction prepared');

    // Create complete account object
    const account = privateKeyToAccount({
      client,
      privateKey: BACKEND_WALLET_PRIVATE_KEY,
    });

    // Send transaction directly
    const result = await sendTransaction({
      transaction,
      account,
    });
    
    console.log(`✅ Lazy mint successful! Transaction: ${result.transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      contractAddress: LAUNCHPAD_CONTRACT_ADDRESS,
      message: 'NFTs lazy minted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error lazy minting NFTs:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to lazy mint NFTs' 
    }, { status: 500 });
  }
} 