import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
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

    // Parse request body
    const body = await request.json();
    const { to, metadata, quantity = 1 } = body;

    if (!to || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: to, metadata' },
        { status: 400 }
      );
    }

    console.log('📋 Generating signature for:', { to, metadata: metadata.name });

    // Create contract instance
    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    // Generate mint signature
    // This allows the user to mint without having MINTER_ROLE directly
    const signaturePayload = {
      to,
      metadata,
      mintRequest: {
        to,
        metadata, // Add metadata to mintRequest
        royaltyRecipient: to, // User gets royalties
        quantity: quantity.toString(), // Use provided quantity
        royaltyBps: 0, // 0% royalty for now
        primarySaleRecipient: to, // User gets primary sale
        price: "0", // Free mint
        currency: "0x0000000000000000000000000000000000000000", // Native token
        validityStartTimestamp: new Date(),
        validityEndTimestamp: new Date(Date.now() + 3600 * 1000), // Valid for 1 hour
        uid: `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      }
    };

    const { payload, signature } = await generateMintSignature({
      contract,
      account: {
        address: process.env.BACKEND_WALLET_ADDRESS || process.env.ADMIN_WALLET_ADDRESS!,
      } as any,
      ...signaturePayload
    });

    console.log('✅ Signature generated successfully');

    return NextResponse.json({
      success: true,
      payload,
      signature,
      contractAddress: NFT_CONTRACT_ADDRESS,
      chainId: 80002
    });

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