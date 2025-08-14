import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, defineChain, getContract } from 'thirdweb';
import { getActiveClaimCondition } from 'thirdweb/extensions/erc721';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contract') || '0x20f77c542E9Fa6ebB597117dA5aED746D7137064'; // Juventus 2006

    console.log('🔍 Checking claim conditions for:', contractAddress);

    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
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

    // Get active claim condition
    const claimCondition = await getActiveClaimCondition({
      contract,
    });

    const priceInMatic = Number(claimCondition.pricePerToken) / Math.pow(10, 18);

    return NextResponse.json({
      success: true,
      contractAddress,
      claimCondition: {
        startTimestamp: claimCondition.startTimestamp.toString(),
        maxClaimableSupply: claimCondition.maxClaimableSupply.toString(),
        supplyClaimed: claimCondition.supplyClaimed.toString(),
        quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
        pricePerTokenWei: claimCondition.pricePerToken.toString(),
        pricePerTokenMatic: priceInMatic,
        merkleRoot: claimCondition.merkleRoot,
        currency: claimCondition.currency,
      },
      analysis: {
        isActive: true,
        priceCorrect: priceInMatic === 0.03,
        priceDisplay: `${priceInMatic} MATIC`,
        expectedPrice: '0.03 MATIC',
        priceMatch: priceInMatic === 0.03 ? '✅ CORRETO' : '❌ INCORRETO'
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking claim conditions:', error);
    return NextResponse.json({
      error: error.message || 'Failed to check claim conditions',
      contractAddress: '0x20f77c542E9Fa6ebB597117dA5aED746D7137064'
    }, { status: 500 });
  }
}
