import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { setDefaultRoyaltyInfo } from 'thirdweb/extensions/erc721';
import { Engine } from 'thirdweb';

// Define a chain Amoy
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const VAULT_ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  console.log('🧾 Set Royalty API: Processing request...');

  // Validação das variáveis de ambiente
  if ((!THIRDWEB_SECRET_KEY && !VAULT_ACCESS_TOKEN) || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      (!THIRDWEB_SECRET_KEY && !VAULT_ACCESS_TOKEN) && "THIRDWEB_SECRET_KEY or VAULT_ACCESS_TOKEN",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS"
    ].filter(Boolean).join(", ");

    console.error(`❌ API Error: Missing variables: ${missing}`);
    return NextResponse.json({ 
      success: false, 
      error: `Server configuration error. Missing: ${missing}` 
    }, { status: 500 });
  }

  try {
    const body: { 
      contractAddress: string;
      recipient: string;
      bps: number;
    } = await request.json();
    
    const { contractAddress, recipient, bps } = body;

    if (!contractAddress || !recipient || typeof bps !== 'number') {
      return NextResponse.json({ 
        success: false, 
        error: 'Contract address, recipient, and bps are required.' 
      }, { status: 400 });
    }

    if (bps < 0 || bps > 10000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Royalty bps must be between 0 and 10000 (0% to 100%).' 
      }, { status: 400 });
    }

    console.log('🧾 Setting default royalty for contract:', contractAddress);
    console.log('🧾 Recipient:', recipient);
    console.log('🧾 BPS:', bps, `(${(bps / 100).toFixed(2)}%)`);

    // Criar cliente Thirdweb
    const token = VAULT_ACCESS_TOKEN || THIRDWEB_SECRET_KEY;
    const thirdwebClient = createThirdwebClient({ 
      secretKey: token
    });
    
    const contract = getContract({ 
      client: thirdwebClient, 
      chain: amoy, 
      address: contractAddress 
    });

    // Configurar Engine para gasless transaction
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: thirdwebClient,
      vaultAccessToken: token,
    });

    // Preparar transação para configurar royalties
    const transaction = setDefaultRoyaltyInfo({
      contract,
      recipient,
      bps
    });

    console.log('🧾 Enqueueing royalty transaction...');

    // Enfileirar a transação via Engine
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ Default royalty set! Queue ID: ${transactionId}`);

    return NextResponse.json({ 
      success: true,
      queueId: transactionId,
      message: 'Default royalty info set successfully',
      contractAddress,
      recipient,
      bps,
      percentage: `${(bps / 100).toFixed(2)}%`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ Set Royalty CRITICAL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to set default royalty info.', 
      details: errorMessage 
    }, { status: 500 });
  }
}