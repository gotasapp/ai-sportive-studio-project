import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

const amoy = defineChain(80002);

// Variáveis de ambiente conforme estão configuradas no Vercel
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL;
const ENGINE_ACCESS_TOKEN = process.env.ENGINE_ACCESS_TOKEN || process.env.ENGINE_ADMIN_KEY || process.env.VAULT_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  // --- DIAGNÓSTICO DEFINITIVO ---
  console.log('--- VERCEL ENVIRONMENT DIAGNOSTIC ---');
  console.log(`1. THIRDWEB_SECRET_KEY:`, {
    isPresent: !!THIRDWEB_SECRET_KEY,
    value: THIRDWEB_SECRET_KEY ? `...${THIRDWEB_SECRET_KEY.slice(-4)}` : 'NÃO ENCONTRADA'
  });
  console.log(`2. NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS:`, {
    isPresent: !!CONTRACT_ADDRESS,
    value: CONTRACT_ADDRESS || 'NÃO ENCONTRADA'
  });
  console.log(`3. BACKEND_WALLET_ADDRESS:`, {
    isPresent: !!BACKEND_WALLET_ADDRESS,
    value: BACKEND_WALLET_ADDRESS || 'NÃO ENCONTRADA'
  });
  console.log(`4. NEXT_PUBLIC_ENGINE_URL:`, {
    isPresent: !!ENGINE_URL,
    value: ENGINE_URL || 'NÃO ENCONTRADA'
  });
  console.log(`5. ENGINE_ACCESS_TOKEN:`, {
    isPresent: !!ENGINE_ACCESS_TOKEN,
    value: ENGINE_ACCESS_TOKEN ? `...${ENGINE_ACCESS_TOKEN.slice(-4)}` : 'NÃO ENCONTRADA'
  });
  console.log('------------------------------------');

  // Validação completa com mensagem específica
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS || !ENGINE_URL || !ENGINE_ACCESS_TOKEN) {
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
      !CONTRACT_ADDRESS && "NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS",
      !ENGINE_URL && "NEXT_PUBLIC_ENGINE_URL",
      !ENGINE_ACCESS_TOKEN && "ENGINE_ACCESS_TOKEN (or ENGINE_ADMIN_KEY or VAULT_ACCESS_TOKEN)"
    ].filter(Boolean).join(", ");

    console.error(`❌ API Error: Missing variables: ${missing}`);
    return NextResponse.json({ error: `Server configuration error. Missing: ${missing}` }, { status: 500 });
  }

  try {
    const body: { to: string; metadataUri: string } = await request.json();
    const { to, metadataUri } = body;

    if (!to || !metadataUri) {
      return NextResponse.json({ error: '"to" address and "metadataUri" are required.' }, { status: 400 });
    }

    // Inicialização correta conforme MILESTONE_3_MINT_ENGINE_FIXED.md
    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const contract = getContract({ client, chain: amoy, address: CONTRACT_ADDRESS });
    const transaction = mintTo({ contract, to, nft: metadataUri });

    console.log("✅ API: Transaction prepared with metadata URI:", metadataUri);
    console.log("📍 Chain:", amoy.id, "- Polygon Amoy");
    console.log("📄 Contract:", CONTRACT_ADDRESS);
    console.log("👤 Backend Wallet:", BACKEND_WALLET_ADDRESS);
    console.log("🎯 Recipient:", to);

    // Configuração da Engine conforme documentação
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: ENGINE_ACCESS_TOKEN,
    });

    console.log("🔧 Engine configured, enqueueing transaction...");

    // Enfileirar a transação
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ API: Transaction enqueued successfully! Queue ID: ${transactionId}`);
    return NextResponse.json({ queueId: transactionId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ API CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Failed to process mint request.', details: errorMessage }, { status: 500 });
  }
} 