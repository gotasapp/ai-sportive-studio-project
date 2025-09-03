import { NextRequest, NextResponse } from 'next/server';
import { deployERC721Contract } from 'thirdweb/deploys';
import { createThirdwebClient, defineChain, getContract } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { setClaimConditions, lazyMint } from 'thirdweb/extensions/erc721';
import { sendTransaction } from 'thirdweb';
import { connectToDatabase } from '@/lib/mongodb';
import { ACTIVE_NETWORK, getActiveChain } from '@/lib/network-config';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Launchpad Auto-Deploy: Starting contract deployment...');
    
    const body = await request.json();
    const collectionId: string | undefined = body?.collectionId;
    const name: string | undefined = body?.name;
    const description: string | undefined = body?.description;
    const image: string | undefined = body?.image;
    const priceInNative: number = body?.priceInMatic || body?.priceInChz || 0.2; // Price in native currency
    const maxSupply: number | undefined = body?.maxSupply || 100;

    console.log('📋 Deploy params received:', { 
      collectionId, 
      name, 
      priceInNative: `${priceInNative} ${ACTIVE_NETWORK.currency}`, 
      maxSupply,
      network: ACTIVE_NETWORK.name,
      chainId: ACTIVE_NETWORK.chainId
    });

    if (!name || !description || !image || !collectionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'name, description, image, and collectionId are required' 
      }, { status: 400 });
    }

    // Configure Thirdweb client
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // 🎯 USE ACTIVE CHAIN (CONTROLLED BY MASTER SWITCH)
    const activeChain = getActiveChain();
    
    console.log('⚙️ Using active chain:', {
      name: ACTIVE_NETWORK.name,
      chainId: ACTIVE_NETWORK.chainId,
      currency: ACTIVE_NETWORK.currency
    });

    // Backend account (gasless deploy)
    const backendAccount = privateKeyToAccount({
      client,
      privateKey: process.env.BACKEND_WALLET_PRIVATE_KEY!,
    });

    console.log('🔑 Backend wallet:', backendAccount.address);
    console.log('📦 Deploying DropERC721 for Launchpad collection:', name);

    // STEP 1: Deploy DropERC721 contract
    const contractAddress = await deployERC721Contract({
      client,
      chain: activeChain, // 🎯 ACTIVE CHAIN (CHZ or Amoy)
      account: backendAccount, // Backend wallet signs (gasless for user)
      type: "DropERC721",
      params: {
        name: name,
        symbol: "LAUNCH", // Launchpad symbol
        description: description,
        image: image, // IPFS of approved image
      },
    });

    console.log('✅ Launchpad contract deployed at:', contractAddress);

    // STEP 2: Configure claim conditions
    console.log('⚙️ Setting up claim conditions...');
    
    const contract = getContract({
      client,
      chain: activeChain, // 🎯 CHAIN ATIVA
      address: contractAddress,
    });

    // NO conversion needed! SDK handles wei conversion automatically
    console.log('💰 Price (human format for SDK):', {
      priceInNative: priceInNative,
      currency: ACTIVE_NETWORK.currency,
      note: 'SDK will convert to wei automatically'
    });

    const claimConditionTransaction = setClaimConditions({
      contract,
      phases: [
        {
          startTime: new Date(), // Starts immediately
          maxClaimableSupply: BigInt(maxSupply || 100), // Max collection supply
          maxClaimablePerWallet: BigInt(10), // Max per wallet
          price: priceInNative, // Human-readable price, SDK converts to wei automatically
        },
      ],
    });

    // Backend configures conditions (gasless)
    await sendTransaction({
      transaction: claimConditionTransaction,
      account: backendAccount,
    });

    console.log('✅ Claim conditions configured');

    // STEP 3: Lazy mint tokens with collection metadata
    console.log('📦 Lazy minting tokens with collection metadata...');
    
    const lazyMintTransaction = lazyMint({
      contract,
      nfts: Array(maxSupply || 100).fill({
        name: name, // Same as collection name
        description: description, // Same description
        image: image, // Same IPFS image for all NFTs
      }),
    });

    await sendTransaction({
      transaction: lazyMintTransaction,
      account: backendAccount, // Backend performs lazy mint (gasless)
    });

    console.log('✅ Tokens lazy minted with collection metadata');

    // STEP 4: Save contract to database
    if (collectionId) {
      const mongo = await connectToDatabase();
      const db = mongo.db('chz-app-db');
      await db.collection('launchpad_collections').updateOne(
        { _id: new (require('mongodb').ObjectId)(collectionId) },
        { 
          $set: { 
            contractAddress: contractAddress,
            deployed: true,
            deployedAt: new Date(),
            maxSupply: maxSupply || 100,
            priceInNative: priceInNative,
            chainId: ACTIVE_NETWORK.chainId,
            network: ACTIVE_NETWORK.name,
            updatedAt: new Date()
          } 
        }
      );
      console.log('✅ Contract address saved to database');
    }

    // Return data to frontend
    return NextResponse.json({
      success: true,
      contractAddress,
      deployedBy: backendAccount.address,
      maxSupply: maxSupply || 100,
      priceInNative,
      message: `Contract deployed with correct price: ${priceInNative} ${ACTIVE_NETWORK.currency}`,
      claimConditionsSet: true,
      tokensLazyMinted: true,
      collectionId
    });

  } catch (error: any) {
    console.error('❌ Launchpad auto-deploy failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Auto-deployment failed' 
    }, { status: 500 });
  }
}


