import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

// Define Amoy chain
const amoy = defineChain(80002);

// Environment variables
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
const LAUNCHPAD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!THIRDWEB_CLIENT_ID) {
      return NextResponse.json({ 
        error: 'Missing environment variables' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId') || '0';
    const contractAddress = searchParams.get('contractAddress') || LAUNCHPAD_CONTRACT_ADDRESS;

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

    console.log('🔍 Getting claim condition for ID:', conditionId, 'contract:', contractAddress);

    // Get claim condition by ID
    const claimCondition = await readContract({
      contract,
      method: "function getClaimConditionById(uint256 _conditionId) view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata) condition)",
      params: [BigInt(conditionId)]
    });

    console.log('✅ Claim condition retrieved:', claimCondition);

    return NextResponse.json({
      success: true,
      conditionId: conditionId,
      contractAddress,
      claimCondition: {
        startTimestamp: claimCondition.startTimestamp.toString(),
        maxClaimableSupply: claimCondition.maxClaimableSupply.toString(),
        supplyClaimed: claimCondition.supplyClaimed.toString(),
        quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
        merkleRoot: claimCondition.merkleRoot,
        pricePerToken: claimCondition.pricePerToken.toString(),
        currency: claimCondition.currency,
        metadata: claimCondition.metadata
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting claim condition:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get claim condition' 
    }, { status: 500 });
  }
}