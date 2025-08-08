import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, Engine } from 'thirdweb';

export async function GET(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const queueId = params.queueId;

  if (!queueId) {
    return NextResponse.json({ error: 'queueId is required' }, { status: 400 });
  }

  // Verificar variáveis de ambiente apenas quando a função é chamada
  const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
  const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;
  const VAULT_ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN;

  if (!THIRDWEB_SECRET_KEY) {
    return NextResponse.json({ error: 'Missing THIRDWEB_SECRET_KEY in .env.local' }, { status: 500 });
  }
  if (!BACKEND_WALLET_ADDRESS) {
    return NextResponse.json({ error: 'Missing BACKEND_WALLET_ADDRESS in .env.local' }, { status: 500 });
  }
  if (!VAULT_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Missing VAULT_ACCESS_TOKEN in .env.local' }, { status: 500 });
  }

  try {
    console.log(`🔎 Checking real status for queueId: ${queueId}`);
    
    // Configurar cliente Thirdweb
    const thirdwebClient = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });
    
    // Configurar Engine serverWallet
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: thirdwebClient,
      vaultAccessToken: VAULT_ACCESS_TOKEN || THIRDWEB_SECRET_KEY,
    });

    console.log(`🔧 Engine configured, checking transaction status...`);
    
    // Verificar status da transação
    const transactionStatus = await serverWallet.getTransactionStatus(queueId);
    
    console.log(`📊 Transaction status for ${queueId}:`, transactionStatus);
    
    return NextResponse.json({ 
      success: true,
      queueId,
      result: transactionStatus 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`❌ API /status/${queueId} ERROR:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction status.', details: errorMessage },
      { status: 500 }
    );
  }
} 