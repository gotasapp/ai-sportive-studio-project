import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

const amoy = defineChain(80002);

// Nomes das variáveis exatamente como esperamos que estejam no Vercel.
const THIRDWEB_SECRET_KEY_NAME = "THIRDWEB_SECRET_KEY";
const CONTRACT_ADDRESS_NAME = "NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS";
const BACKEND_WALLET_ADDRESS_NAME = "BACKEND_WALLET_ADDRESS";

export async function POST(request: NextRequest) {
  // Lendo as variáveis do ambiente
  const THIRDWEB_SECRET_KEY = process.env[THIRDWEB_SECRET_KEY_NAME];
  const CONTRACT_ADDRESS = process.env[CONTRACT_ADDRESS_NAME];
  const BACKEND_WALLET_ADDRESS = process.env[BACKEND_WALLET_ADDRESS_NAME];

  // --- DIAGNÓSTICO DEFINITIVO ---
  // Este bloco irá nos dizer exatamente o que o servidor Vercel está vendo.
  console.log('--- VERCEL ENVIRONMENT DIAGNOSTIC ---');
  console.log(`1. Lendo a variável '${THIRDWEB_SECRET_KEY_NAME}':`, {
    isPresent: !!THIRDWEB_SECRET_KEY,
    value: THIRDWEB_SECRET_KEY ? `...${THIRDWEB_SECRET_KEY.slice(-4)}` : 'NÃO ENCONTRADA'
  });
  console.log(`2. Lendo a variável '${CONTRACT_ADDRESS_NAME}':`, {
    isPresent: !!CONTRACT_ADDRESS,
    value: CONTRACT_ADDRESS || 'NÃO ENCONTRADA'
  });
  console.log(`3. Lendo a variável '${BACKEND_WALLET_ADDRESS_NAME}':`, {
    isPresent: !!BACKEND_WALLET_ADDRESS,
    value: BACKEND_WALLET_ADDRESS || 'NÃO ENCONTRADA'
  });
  console.log('------------------------------------');

  // Validação Crítica
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      !THIRDWEB_SECRET_KEY && THIRDWEB_SECRET_KEY_NAME,
      !CONTRACT_ADDRESS && CONTRACT_ADDRESS_NAME,
      !BACKEND_WALLET_ADDRESS && BACKEND_WALLET_ADDRESS_NAME
    ].filter(Boolean).join(", ");

    console.error(`❌ API Error: As seguintes variáveis de ambiente estão ausentes ou vazias no Vercel: ${missing}`);
    return NextResponse.json({ error: `Server configuration error. Variáveis ausentes: ${missing}` }, { status: 500 });
  }

  try {
    const body: { to: string; metadataUri: string } = await request.json();
    const { to, metadataUri } = body;

    if (!to || !metadataUri) {
      return NextResponse.json({ error: '"to" address and "metadataUri" are required.' }, { status: 400 });
    }

    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const contract = getContract({ client, chain: amoy, address: CONTRACT_ADDRESS });
    const transaction = mintTo({ contract, to, nft: metadataUri });

    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: THIRDWEB_SECRET_KEY,
    });

    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ API: Transação enfileirada com sucesso! Queue ID: ${transactionId}`);
    return NextResponse.json({ queueId: transactionId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ API CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Falha ao processar a requisição no servidor.', details: errorMessage }, { status: 500 });
  }
} 