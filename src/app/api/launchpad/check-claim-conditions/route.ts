import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, defineChain } from 'thirdweb';
import { getActiveClaimCondition } from 'thirdweb/extensions/erc721';
import { connectToDatabase } from '@/lib/mongodb';
import { ACTIVE_NETWORK, getActiveChain } from '@/lib/network-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const collectionId = searchParams.get('collectionId');

    if (!contractAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'contractAddress is required' 
      }, { status: 400 });
    }

    console.log('🔍 Checking claim conditions for contract:', contractAddress);

    // Configure Thirdweb client
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Use active chain
    const activeChain = getActiveChain();
    
    console.log('⚙️ Using active chain:', {
      name: ACTIVE_NETWORK.name,
      chainId: ACTIVE_NETWORK.chainId,
      currency: ACTIVE_NETWORK.currency
    });

    // Get contract instance
    const contract = getContract({
      client,
      chain: activeChain,
      address: contractAddress,
    });

    // Check claim conditions
    let claimCondition;
    try {
      claimCondition = await getActiveClaimCondition({ contract });
      console.log('✅ Claim condition found:', {
        pricePerToken: claimCondition.pricePerToken.toString(),
        maxClaimableSupply: claimCondition.maxClaimableSupply.toString(),
        supplyClaimed: claimCondition.supplyClaimed.toString(),
        quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
        startTimestamp: claimCondition.startTimestamp.toString()
      });
    } catch (error) {
      console.error('❌ Failed to get claim condition:', error);
      claimCondition = null;
    }

    // Get collection data from database
    let collectionData = null;
    if (collectionId) {
      try {
        const mongo = await connectToDatabase();
        const db = mongo.db('chz-app-db');
        collectionData = await db.collection('launchpad_collections').findOne({
          _id: new (require('mongodb').ObjectId)(collectionId)
        });
      } catch (error) {
        console.error('❌ Failed to get collection data:', error);
      }
    }

    return NextResponse.json({
      success: true,
      contractAddress,
      collectionId,
      network: {
        name: ACTIVE_NETWORK.name,
        chainId: ACTIVE_NETWORK.chainId,
        currency: ACTIVE_NETWORK.currency
      },
      claimCondition: claimCondition ? {
        pricePerToken: claimCondition.pricePerToken.toString(),
        maxClaimableSupply: claimCondition.maxClaimableSupply.toString(),
        supplyClaimed: claimCondition.supplyClaimed.toString(),
        quantityLimitPerWallet: claimCondition.quantityLimitPerWallet.toString(),
        startTimestamp: claimCondition.startTimestamp.toString(),
        currency: claimCondition.currency,
        merkleRoot: claimCondition.merkleRoot
      } : null,
      collectionData: collectionData ? {
        _id: collectionData._id,
        name: collectionData.name,
        status: collectionData.status,
        deployed: collectionData.deployed,
        deployedAt: collectionData.deployedAt,
        maxSupply: collectionData.maxSupply,
        priceInNative: collectionData.priceInNative,
        chainId: collectionData.chainId,
        network: collectionData.network
      } : null,
      hasClaimConditions: !!claimCondition,
      message: claimCondition 
        ? 'Claim conditions are properly configured' 
        : 'No claim conditions found - contract may not be properly configured'
    });

  } catch (error: any) {
    console.error('❌ Error checking claim conditions:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to check claim conditions' 
    }, { status: 500 });
  }
}
