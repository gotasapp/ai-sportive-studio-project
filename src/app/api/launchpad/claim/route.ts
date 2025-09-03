import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { prepareContractCall } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!THIRDWEB_CLIENT_ID) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { 
      contractAddress = LAUNCHPAD_CONTRACT_ADDRESS,
      receiver, // Address to receive the NFT
      quantity = 1, // Number of NFTs to claim
      currency = "0x0000000000000000000000000000000000000000", // Native token (MATIC)
      pricePerToken = "0", // Price per token (0 for free)
      allowlistProof = { // Default allowlist proof (no restrictions)
        proof: [],
        quantityLimitPerWallet: "0",
        pricePerToken: "0",
        currency: "0x0000000000000000000000000000000000000000"
      },
      data = "0x" // Additional data
    } = body;

    // Validate required fields
    if (!receiver) {
      return NextResponse.json({ 
        error: 'Receiver address is required' 
      }, { status: 400 });
    }

    // Validate contract address
    if (!contractAddress) {
      return NextResponse.json({ 
        error: 'Contract address is required' 
      }, { status: 400 });
    }

    // Create Thirdweb client
    const client = createThirdwebClient({ 
      clientId: THIRDWEB_CLIENT_ID 
    });

    // Get contract
    const contract = getContract({
      client,
      chain: amoy,
      address: contractAddress,
    });

    console.log('🎯 Claiming NFTs:', {
      receiver,
      quantity,
      currency,
      pricePerToken,
      contractAddress
    });

    // Create claim transaction
    const transaction = prepareContractCall({
      contract,
      method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable",
      params: [
        receiver,
        BigInt(quantity),
        currency,
        BigInt(Math.floor(parseFloat(pricePerToken) * Math.pow(10, 18))), // Convert to Wei
        allowlistProof,
        data
      ],
      value: BigInt(Math.floor(parseFloat(pricePerToken) * parseFloat(quantity) * Math.pow(10, 18))) // Native token value
    });

    // Create backend account for transaction
    if (!BACKEND_WALLET_PRIVATE_KEY) {
      throw new Error('BACKEND_WALLET_PRIVATE_KEY not configured');
    }
    
    const account = privateKeyToAccount({
      client,
      privateKey: BACKEND_WALLET_PRIVATE_KEY,
    });

    // Send transaction using backend account (backend pays for the claim)
    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log('✅ Claim successful:', result);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      receiver,
      quantity,
      pricePerToken,
      contractAddress
    });

  } catch (error: any) {
    console.error('❌ Error claiming NFTs:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to claim NFTs' 
    }, { status: 500 });
  }
}