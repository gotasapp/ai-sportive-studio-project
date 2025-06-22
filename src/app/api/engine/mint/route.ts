import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

interface MintApiRequest {
  to: string;
  metadataUri: string;
}

// Define a chain Amoy usando seu ID
const amoy = defineChain(80002);

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;
const VAULT_ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN;

// Método GET para debug
export async function GET() {
  return NextResponse.json({ 
    message: 'Engine Mint API is running',
    configured: !!(THIRDWEB_SECRET_KEY && CONTRACT_ADDRESS && BACKEND_WALLET_ADDRESS && VAULT_ACCESS_TOKEN),
    contract: CONTRACT_ADDRESS,
    backendWallet: BACKEND_WALLET_ADDRESS
  });
}

export async function POST(request: NextRequest) {
  console.log('🔄 Engine Mint API: POST request received');
  
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS || !VAULT_ACCESS_TOKEN) {
    console.error("❌ Server-side configuration error: Missing environment variables.");
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
      !CONTRACT_ADDRESS && "NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS",
      !VAULT_ACCESS_TOKEN && "VAULT_ACCESS_TOKEN"
    ].filter(Boolean).join(", ");
    console.error(`Missing: ${missing}`);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const body: MintApiRequest = await request.json();
    console.log('📦 Engine Mint API: Request body:', body);
    
    const { to, metadataUri } = body;

    if (!to || !metadataUri) {
      return NextResponse.json({ error: '"to" address and "metadataUri" are required.' }, { status: 400 });
    }

    const client = createThirdwebClient({
      secretKey: THIRDWEB_SECRET_KEY,
    });

    const contract = getContract({
      client,
      chain: amoy,
      address: CONTRACT_ADDRESS,
    });

    const transaction = mintTo({
      contract,
      to,
      nft: metadataUri,
    });
    
    console.log("✅ API: Transaction prepared with existing metadata URI.");

    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: VAULT_ACCESS_TOKEN,
    });

    const response = await serverWallet.enqueueTransaction({
      transaction,
    });
    
    console.log("✅ API: Transaction enqueued successfully! Response:", response);
    
    if (!response || !response.transactionId) {
      console.error("❌ API ERROR: A resposta da Engine não continha o 'transactionId' esperado.", response);
      throw new Error("A resposta da Engine é inválida.");
    }

    return NextResponse.json({ queueId: response.transactionId });

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
