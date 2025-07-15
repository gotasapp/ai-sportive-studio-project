import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

interface MintApiRequest {
  to: string;
  metadataUri: string;
  chainId: number;
}

// Define a chain Amoy usando seu ID
const amoy = defineChain(80002);

// Engine Configuration
const ENGINE_URL = process.env.ENGINE_URL || process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:3005';
const VAULT_ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

// Método GET para debug
export async function GET() {
  return NextResponse.json({ 
    message: 'Engine Mint API is running',
    configured: !!(ENGINE_URL && VAULT_ACCESS_TOKEN && CONTRACT_ADDRESS && BACKEND_WALLET_ADDRESS),
    engineUrl: ENGINE_URL,
    contract: CONTRACT_ADDRESS,
    backendWallet: BACKEND_WALLET_ADDRESS,
    hasAccessToken: !!VAULT_ACCESS_TOKEN
  });
}

export async function POST(request: NextRequest) {
  console.log('🔄 Engine Mint API: POST request received');
  
  if (!ENGINE_URL || !VAULT_ACCESS_TOKEN || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    console.error("❌ Server-side configuration error: Missing environment variables.");
    const missing = [
      !ENGINE_URL && "ENGINE_URL",
      !VAULT_ACCESS_TOKEN && "VAULT_ACCESS_TOKEN", 
      !CONTRACT_ADDRESS && "NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS"
    ].filter(Boolean).join(", ");
    console.error(`Missing: ${missing}`);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const body: MintApiRequest = await request.json();
    console.log('📦 Engine Mint API: Request body:', body);
    
    const { to, metadataUri, chainId } = body;

    if (!to || !metadataUri || !chainId) {
      return NextResponse.json({ error: '"to" address, "metadataUri", and "chainId" are required.' }, { status: 400 });
    }

    // Usar Engine API diretamente para MINT (NFT Collection)
    const endpoint = 'erc721/mint-to';
    console.log('🚀 Calling Engine API:', `${ENGINE_URL}/contract/${chainId}/${CONTRACT_ADDRESS}/${endpoint}`);
    
    const engineResponse = await fetch(`${ENGINE_URL}/contract/${chainId}/${CONTRACT_ADDRESS}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAULT_ACCESS_TOKEN}`,
        'x-backend-wallet-address': BACKEND_WALLET_ADDRESS,
      },
      body: JSON.stringify({
        to: to, // CORREÇÃO: A chave deve ser 'to', não 'receiver'
        metadataUri: metadataUri.startsWith('ipfs://') ? metadataUri : `ipfs://${metadataUri.split('ipfs/')[1]}`,
      }),
    });

    if (!engineResponse.ok) {
      const errorText = await engineResponse.text();
      console.error('❌ Engine API Error:', {
        status: engineResponse.status,
        statusText: engineResponse.statusText,
        body: errorText
      });
      throw new Error(`Engine API error: ${engineResponse.status} - ${errorText}`);
    }

    const engineResult = await engineResponse.json();
    console.log('✅ Engine API Response:', engineResult);

    return NextResponse.json({ 
      queueId: engineResult.result?.queueId || engineResult.queueId,
      transactionHash: engineResult.result?.transactionHash,
      status: 'queued'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ API CRITICAL ERROR:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined,
    });
    
    return NextResponse.json(
      { error: 'Failed to process mint request on the server.', details: errorMessage },
      { status: 500 }
    );
  }
}
