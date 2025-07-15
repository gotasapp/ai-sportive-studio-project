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

    // Debug environment variables
    console.log('🔍 Environment check:');
    console.log('- THIRDWEB_SECRET_KEY:', process.env.THIRDWEB_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('- ADMIN_WALLET_ADDRESS:', process.env.ADMIN_WALLET_ADDRESS ? 'SET' : 'NOT SET');
    console.log('- VAULT_ACCESS_TOKEN:', process.env.VAULT_ACCESS_TOKEN ? 'SET' : 'NOT SET');

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

    // Use admin wallet address for signing
    const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;
    
    if (!adminWalletAddress) {
      console.error('❌ ADMIN_WALLET_ADDRESS not configured');
      return NextResponse.json(
        { error: 'Admin wallet not configured' },
        { status: 500 }
      );
    }

    console.log('🔐 Generating signature with admin wallet:', adminWalletAddress);
    console.log('🔍 Signature payload:', JSON.stringify(signaturePayload, null, 2));

    let payload, signature;
    
    try {
      const result = await generateMintSignature({
        contract,
        account: {
          address: adminWalletAddress,
        } as any,
        ...signaturePayload
      });

      payload = result.payload;
      signature = result.signature;

      console.log('✅ Signature generated successfully');
      console.log('📦 Payload preview:', JSON.stringify(payload, null, 2).substring(0, 200) + '...');
      console.log('✍️ Signature preview:', signature.substring(0, 20) + '...');
    } catch (signatureError: any) {
      console.error('❌ Error generating signature:', signatureError);
      console.error('❌ Error message:', signatureError.message);
      console.error('❌ Error stack:', signatureError.stack);
      return NextResponse.json(
        { error: `Signature generation failed: ${signatureError.message}` },
        { status: 500 }
      );
    }

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