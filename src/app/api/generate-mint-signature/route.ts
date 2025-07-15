import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { generateMintSignature } from 'thirdweb/extensions/erc721';

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Generate Mint Signature API called');

    // Validate environment variables
    if (!process.env.THIRDWEB_SECRET_KEY) {
      console.error('❌ THIRDWEB_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!process.env.ADMIN_WALLET_PRIVATE_KEY) {
      console.error('❌ ADMIN_WALLET_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Admin wallet not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { to, metadataUri, quantity = 1 } = body;

    if (!to || !metadataUri) {
      return NextResponse.json(
        { error: 'Missing required fields: to, metadataUri' },
        { status: 400 }
      );
    }

    console.log('📥 Request received:', { to, metadataUri: metadataUri.substring(0, 50) + '...', quantity });

    // Create admin account from private key
    const adminAccount = privateKeyToAccount({
      client,
      privateKey: process.env.ADMIN_WALLET_PRIVATE_KEY as `0x${string}`,
    });

    console.log('👤 Admin account created:', adminAccount.address);

    // Create contract instance
    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    console.log('📝 Contract created:', NFT_CONTRACT_ADDRESS);

    // Generate mint signature using Thirdweb SDK v5
    const { payload, signature } = await generateMintSignature({
      account: adminAccount,
      contract,
      mintRequest: {
        to: to,
        metadata: {
          name: "AI Generated NFT",
          description: "AI Generated Sports NFT from CHZ Fan Token Studio",
          image: metadataUri,
        },
        // Optional fields with default values
        royaltyRecipient: to,
        royaltyBps: 0,
        primarySaleRecipient: to,
        price: "0",
        currency: "0x0000000000000000000000000000000000000000", // Native token
        validityStartTimestamp: Math.floor(Date.now() / 1000),
        validityEndTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        uid: `0x${Math.random().toString(16).substr(2, 32).padStart(64, '0')}`,
      },
    });

    console.log('✅ Signature generated successfully');
    console.log('📦 Payload:', payload);

    const response = {
      success: true,
      payload,
      signature,
      contractAddress: NFT_CONTRACT_ADDRESS,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error generating mint signature:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate mint signature',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 