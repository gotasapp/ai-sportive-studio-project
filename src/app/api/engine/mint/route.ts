import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

const amoy = defineChain(80002);

// Variáveis de ambiente conforme estão configuradas no Vercel
// Last updated: 2025-07-16 - Using Transactions API instead of Engine
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  // --- DIAGNÓSTICO ---
  console.log('--- VERCEL ENVIRONMENT DIAGNOSTIC ---');
  console.log(`1. THIRDWEB_SECRET_KEY:`, {
    isPresent: !!THIRDWEB_SECRET_KEY,
    value: THIRDWEB_SECRET_KEY ? `...${THIRDWEB_SECRET_KEY.slice(-4)}` : 'NÃO ENCONTRADA'
  });
  console.log(`2. CONTRACT_ADDRESS:`, CONTRACT_ADDRESS || 'NÃO ENCONTRADA');
  console.log(`3. BACKEND_WALLET_ADDRESS:`, BACKEND_WALLET_ADDRESS || 'NÃO ENCONTRADA');
  console.log('------------------------------------');

  // Validação completa com mensagem específica
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
      !CONTRACT_ADDRESS && "NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS"
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

    // Usar a API de Transações diretamente
    const response = await fetch('https://engine.thirdweb.com/transaction/write', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${THIRDWEB_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'x-wallet-address': BACKEND_WALLET_ADDRESS
      },
      body: JSON.stringify({
        chainId: '80002',
        contractAddress: CONTRACT_ADDRESS,
        functionName: 'mintTo',
        args: [to, metadataUri],
        txOverrides: {
          gas: '200000'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Transactions API error: ${response.status} - ${error}`);
      throw new Error(`Error sending transaction: ${error}`);
    }

    const data = await response.json();
    console.log("✅ API: Transaction submitted successfully!", data);
    
    // Retorna o ID da transação
    return NextResponse.json({ 
      queueId: data.transactionId || data.queueId || data.result?.queueId || 'transaction-submitted',
      result: data
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ API CRITICAL ERROR:', { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ error: 'Failed to process mint request.', details: errorMessage }, { status: 500 });
  }
} 