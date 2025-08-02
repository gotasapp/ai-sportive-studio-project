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

    console.log('📊 Getting contract info for:', contractAddress);

    // Get all contract information
    const [
      name,
      totalSupply,
      totalMinted,
      sharedMetadata,
      claimCondition
    ] = await Promise.all([
      // Name
      readContract({
        contract,
        method: "function name() view returns (string)",
        params: []
      }),
      
      // Total Supply
      readContract({
        contract,
        method: "function totalSupply() view returns (uint256)",
        params: []
      }),
      
      // Total Minted
      readContract({
        contract,
        method: "function totalMinted() view returns (uint256)",
        params: []
      }),
      
      // Shared Metadata
      readContract({
        contract,
        method: "function sharedMetadata() view returns (string name, string description, string imageURI, string animationURI)",
        params: []
      }),
      
      // Claim Condition
      readContract({
        contract,
        method: "function claimCondition() view returns (uint256 currentStartId, uint256 count)",
        params: []
      })
    ]);

    console.log('✅ Contract info retrieved successfully');

    return NextResponse.json({
      success: true,
      contractAddress,
      contractInfo: {
        name,
        totalSupply: totalSupply.toString(),
        totalMinted: totalMinted.toString(),
        sharedMetadata: {
          name: sharedMetadata.name,
          description: sharedMetadata.description,
          imageURI: sharedMetadata.imageURI,
          animationURI: sharedMetadata.animationURI
        },
        claimCondition: {
          currentStartId: claimCondition.currentStartId.toString(),
          count: claimCondition.count.toString()
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting contract info:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get contract info' 
    }, { status: 500 });
  }
}