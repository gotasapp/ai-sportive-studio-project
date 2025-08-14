import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { setClaimConditions, getActiveClaimCondition } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { sendTransaction } from 'thirdweb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contractAddress = body.contractAddress;
    const newPriceInMatic = body.priceInMatic || 0.2; // Default 0.2 MATIC
    
    if (!contractAddress) {
      return NextResponse.json({
        success: false,
        error: 'Contract address required'
      }, { status: 400 });
    }

    console.log('🔧 Fixing claim conditions for contract:', contractAddress);
    console.log('💰 Setting price to:', newPriceInMatic, 'MATIC');

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

    // Get current claim condition to preserve other settings
    let currentCondition;
    try {
      currentCondition = await getActiveClaimCondition({ contract });
      console.log('📋 Current claim condition:', {
        pricePerToken: currentCondition.pricePerToken.toString(),
        priceInMatic: Number(currentCondition.pricePerToken) / 1e18,
        maxClaimableSupply: currentCondition.maxClaimableSupply.toString(),
        supplyClaimed: currentCondition.supplyClaimed.toString(),
      });
    } catch (error) {
      console.log('⚠️ No current claim condition found, creating new one');
    }

    // Backend account to sign the transaction
    const backendAccount = privateKeyToAccount({
      client,
      privateKey: process.env.BACKEND_WALLET_PRIVATE_KEY!,
    });

    // Calculate correct price in wei
    const priceInWei = (newPriceInMatic * 1e18).toString();
    console.log('💰 Price conversion:', {
      inputMatic: newPriceInMatic,
      outputWei: priceInWei,
      digits: priceInWei.length
    });

    // Set new claim conditions with corrected price
    const claimConditionTransaction = setClaimConditions({
      contract,
      phases: [
        {
          startTime: currentCondition?.startTimestamp 
            ? new Date(Number(currentCondition.startTimestamp) * 1000)
            : new Date(), // Start now if no current condition
          maxClaimableSupply: currentCondition?.maxClaimableSupply || BigInt(100),
          maxClaimablePerWallet: currentCondition?.quantityLimitPerWallet || BigInt(10),
          price: priceInWei, // Corrected price in wei
        },
      ],
    });

    // Execute the transaction
    const result = await sendTransaction({
      transaction: claimConditionTransaction,
      account: backendAccount,
    });

    console.log('✅ Claim conditions updated successfully');

    // Verify the new condition
    const newCondition = await getActiveClaimCondition({ contract });
    console.log('📋 New claim condition:', {
      pricePerToken: newCondition.pricePerToken.toString(),
      priceInMatic: Number(newCondition.pricePerToken) / 1e18,
      maxClaimableSupply: newCondition.maxClaimableSupply.toString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Claim conditions updated successfully',
      contractAddress,
      transactionHash: result.transactionHash,
      oldPrice: currentCondition ? {
        wei: currentCondition.pricePerToken.toString(),
        matic: Number(currentCondition.pricePerToken) / 1e18
      } : null,
      newPrice: {
        wei: priceInWei,
        matic: newPriceInMatic
      },
      newCondition: {
        pricePerToken: newCondition.pricePerToken.toString(),
        priceInMatic: Number(newCondition.pricePerToken) / 1e18,
        maxClaimableSupply: newCondition.maxClaimableSupply.toString(),
        supplyClaimed: newCondition.supplyClaimed.toString(),
      }
    });

  } catch (error: any) {
    console.error('❌ Error fixing claim conditions:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fix claim conditions'
    }, { status: 500 });
  }
}
