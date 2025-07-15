import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { privateKeyToAccount } from 'thirdweb/wallets';

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

    console.log('📥 Request received:', { to, metadata: metadata.substring(0, 50) + '...', quantity });

    // Use admin wallet address for signing
    const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;
    
    if (!adminWalletAddress) {
      console.error('❌ ADMIN_WALLET_ADDRESS not configured');
      return NextResponse.json(
        { error: 'Admin wallet not configured' },
        { status: 500 }
      );
    }

    // Create contract instance
    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    console.log('📝 Contract created:', NFT_CONTRACT_ADDRESS);

    // NOVA ABORDAGEM: Em vez de generateMintSignature complexo,
    // vamos retornar dados simples para o frontend usar com prepareContractCall
    const response = {
      success: true,
      contractAddress: NFT_CONTRACT_ADDRESS,
      to: to,
      metadata: metadata,
      quantity: quantity,
      // Dados para usar no frontend com prepareContractCall
      mintData: {
        method: "function mintTo(address to, string uri)",
        params: [to, metadata]
      }
    };

    console.log('✅ Response prepared successfully');

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ API Error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 