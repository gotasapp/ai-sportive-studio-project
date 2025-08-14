import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { getActiveClaimCondition } from 'thirdweb/extensions/erc721';

export async function GET(request: NextRequest) {
  try {
    const contractAddress = request.nextUrl.searchParams.get('contract');
    
    if (!contractAddress) {
      return NextResponse.json({
        success: false,
        error: 'Contract address required'
      }, { status: 400 });
    }

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const amoyChain = defineChain({
      id: 80002,
      name: 'Polygon Amoy Testnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpc: 'https://rpc.ankr.com/polygon_amoy/5b2d60918c8135da4798d0d735c2b2d483d3e3d8992ab6cf34c53b0fd81803ef',
    });

    const contract = getContract({
      client,
      chain: amoyChain,
      address: contractAddress,
    });

    console.log('🔍 Checking claim conditions for contract:', contractAddress);

    const claimCondition = await getActiveClaimCondition({
      contract,
    });

    console.log('📋 Claim condition found:', {
      pricePerToken: claimCondition.pricePerToken.toString(),
      priceInMatic: Number(claimCondition.pricePerToken) / 1e18,
      maxClaimableSupply: claimCondition.maxClaimableSupply.toString(),
      supplyClaimed: claimCondition.supplyClaimed.toString(),
      quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
    });

    return NextResponse.json({
      success: true,
      contractAddress,
      claimCondition: {
        pricePerToken: claimCondition.pricePerToken.toString(),
        priceInMatic: Number(claimCondition.pricePerToken) / 1e18,
        maxClaimableSupply: claimCondition.maxClaimableSupply.toString(),
        supplyClaimed: claimCondition.supplyClaimed.toString(),
        quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
        startTimestamp: claimCondition.startTimestamp.toString(),
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking claim conditions:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check claim conditions'
    }, { status: 500 });
  }
}
