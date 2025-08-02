
import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

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
      conditionId = 0, // Condition ID to verify against
      claimer, // Address of the claimer
      quantity = 1, // Number of NFTs to claim
      currency = "0x0000000000000000000000000000000000000000", // Native token (MATIC)
      pricePerToken = "0", // Price per token
      allowlistProof = { // Allowlist proof
        proof: [],
        quantityLimitPerWallet: "0",
        pricePerToken: "0",
        currency: "0x0000000000000000000000000000000000000000"
      }
    } = body;

    // Validate required fields
    if (!claimer) {
      return NextResponse.json({ 
        error: 'Claimer address is required' 
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

    console.log('🔍 Verifying claim:', {
      conditionId,
      claimer,
      quantity,
      currency,
      pricePerToken,
      contractAddress
    });

    // Verify claim
    const isOverride = await readContract({
      contract,
      method: "function verifyClaim(uint256 _conditionId, address _claimer, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof) view returns (bool isOverride)",
      params: [
        BigInt(conditionId),
        claimer,
        BigInt(quantity),
        currency,
        BigInt(Math.floor(parseFloat(pricePerToken) * Math.pow(10, 18))), // Convert to Wei
        allowlistProof
      ]
    });

    console.log('✅ Claim verification result:', isOverride);

    return NextResponse.json({
      success: true,
      conditionId,
      claimer,
      quantity,
      pricePerToken,
      contractAddress,
      isOverride: isOverride,
      isValid: isOverride // If true, claim is valid
    });

  } catch (error: any) {
    console.error('❌ Error verifying claim:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to verify claim' 
    }, { status: 500 });
  }
}