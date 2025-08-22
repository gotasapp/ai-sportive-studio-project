import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { lazyMint } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { getActiveChain } from '@/lib/network-config';

// Use active network configuration
const activeChain = getActiveChain();

// Environment variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !BACKEND_WALLET_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    // Get metadata and contract address from request body
    const { metadata, contractAddress } = await request.json();
    
    if (!metadata || !metadata.name || !metadata.image || !contractAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields: metadata (name, image), contractAddress' 
      }, { status: 400 });
    }

    console.log('🎯 Batch mint lazy minting NFTs for contract...');
    console.log('📄 Contract:', contractAddress);
    console.log('📄 Metadata:', metadata);

    // Create Thirdweb client with secret key
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });

    // Get contract
    const contract = getContract({
      client,
      chain: activeChain,
      address: contractAddress,
    });

    // Prepare lazy mint transaction with EXACT metadata (no extras)
    const transaction = lazyMint({
      contract,
      nfts: [
        {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes || [] // ✅ EXATAMENTE os atributos enviados
        }
      ],
    });

    console.log('✅ Batch mint lazy mint transaction prepared');

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
    
    console.log(`✅ Batch mint lazy mint successful! Transaction: ${result.transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      contractAddress: contractAddress,
      message: 'Batch mint NFTs lazy minted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error batch mint lazy minting NFTs:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to lazy mint batch mint NFTs' 
    }, { status: 500 });
  }
}
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { lazyMint } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { getActiveChain } from '@/lib/network-config';

// Use active network configuration
const activeChain = getActiveChain();

// Environment variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !BACKEND_WALLET_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    // Get metadata and contract address from request body
    const { metadata, contractAddress } = await request.json();
    
    if (!metadata || !metadata.name || !metadata.image || !contractAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields: metadata (name, image), contractAddress' 
      }, { status: 400 });
    }

    console.log('🎯 Batch mint lazy minting NFTs for contract...');
    console.log('📄 Contract:', contractAddress);
    console.log('📄 Metadata:', metadata);

    // Create Thirdweb client with secret key
    const client = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });

    // Get contract
    const contract = getContract({
      client,
      chain: activeChain,
      address: contractAddress,
    });

    // Prepare lazy mint transaction with EXACT metadata (no extras)
    const transaction = lazyMint({
      contract,
      nfts: [
        {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes || [] // ✅ EXATAMENTE os atributos enviados
        }
      ],
    });

    console.log('✅ Batch mint lazy mint transaction prepared');

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
    
    console.log(`✅ Batch mint lazy mint successful! Transaction: ${result.transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      contractAddress: contractAddress,
      message: 'Batch mint NFTs lazy minted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error batch mint lazy minting NFTs:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to lazy mint batch mint NFTs' 
    }, { status: 500 });
  }
}
