import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

// Define a chain Amoy usando seu ID, que é a forma correta no SDK V5
const amoy = defineChain(80002);

// Lê as variáveis de ambiente com os nomes EXATOS do seu arquivo .env.local
const THIRDWEB_SECRET_KEY = process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET;
const BACKEND_WALLET_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  // Validação das variáveis
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    console.error("❌ Server-side configuration error: Missing environment variables.");
    const missing = [
        !THIRDWEB_SECRET_KEY && "NEXT_PUBLIC_THIRDWEB_SECRET_KEY",
        !CONTRACT_ADDRESS && "NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET",
        !BACKEND_WALLET_ADDRESS && "NEXT_PUBLIC_BACKEND_WALLET_ADDRESS"
    ].filter(Boolean).join(", ");
    console.error(`Missing: ${missing}`);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const body: { to: string; metadataUri: string } = await request.json();
    const { to, metadataUri } = body;

    // Validação da requisição
    if (!to || !metadataUri) {
      return NextResponse.json({ error: '"to" address and "metadataUri" are required.' }, { status: 400 });
    }

    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const contract = getContract({ client, chain: amoy, address: CONTRACT_ADDRESS });

    // Prepara a transação passando a URI do IPFS, evitando o re-upload
    const transaction = mintTo({ contract, to, nft: metadataUri });
    console.log("✅ API: Transaction prepared with existing metadata URI.");

    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: THIRDWEB_SECRET_KEY,
    });
    
    // Enfileira a transação
    const response = await serverWallet.enqueueTransaction({ transaction });

    console.log("✅ API: Transaction enqueued successfully! Response:", response);
    
    // Trata a resposta correta da Engine
    if (!response || !response.transactionId) {
      throw new Error("A resposta da Engine é inválida ou não contém 'transactionId'.");
    }

    // Retorna o ID para o frontend
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
