import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { amoy } from 'thirdweb/chains';
import { generateMintSignature } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const contractAddress = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

if (!THIRDWEB_SECRET_KEY) {
  throw new Error('THIRDWEB_SECRET_KEY is required');
}

if (!BACKEND_WALLET_PRIVATE_KEY) {
  throw new Error('BACKEND_WALLET_PRIVATE_KEY is required');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, metadataUri, price = "0", currency = "0x0000000000000000000000000000000000000000" } = body;

    if (!to || !metadataUri) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: to, metadataUri' },
        { status: 400 }
      );
    }

    console.log('🔐 Generating mint signature for:', { to, metadataUri, price, currency });

    // Initialize Thirdweb client
    const client = createThirdwebClient({
      secretKey: THIRDWEB_SECRET_KEY,
    });

    // Get contract instance
    const contract = getContract({
      client,
      chain: amoy,
      address: contractAddress,
    });

    // Create account from private key
    const account = privateKeyToAccount({
      client,
      privateKey: BACKEND_WALLET_PRIVATE_KEY,
    });

    // Generate mint signature
    const mintRequest = {
      to,
      royaltyRecipient: account.address, // Backend wallet as royalty recipient
      royaltyBps: 0, // 0% royalty
      primarySaleRecipient: account.address, // Backend wallet as primary sale recipient
      uri: metadataUri,
      price: BigInt(price),
      currency,
      validityStartTimestamp: BigInt(Math.floor(Date.now() / 1000)), // Current timestamp
      validityEndTimestamp: BigInt(Math.floor(Date.now() / 1000) + 60 * 60), // Valid for 1 hour
      uid: `0x${Date.now().toString(16).padStart(64, '0')}`, // Unique ID based on timestamp
    };

    const signature = await generateMintSignature({
      contract,
      account,
      mintRequest,
    });

    console.log('✅ Mint signature generated successfully');

    return NextResponse.json({
      success: true,
      signature,
      mintRequest,
    });

  } catch (error: any) {
    console.error('❌ Error generating mint signature:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to generate mint signature' 
      },
      { status: 500 }
    );
  }
}