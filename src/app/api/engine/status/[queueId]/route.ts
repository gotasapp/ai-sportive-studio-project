import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const queueId = params.queueId;

  if (!queueId) {
    return NextResponse.json({ error: 'queueId is required' }, { status: 400 });
  }

  // Verificar variáveis de ambiente
  const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL;
  const ENGINE_ACCESS_TOKEN = process.env.ENGINE_ACCESS_TOKEN || process.env.ENGINE_ADMIN_KEY || process.env.VAULT_ACCESS_TOKEN;

  if (!ENGINE_URL || !ENGINE_ACCESS_TOKEN) {
    const missing = [];
    if (!ENGINE_URL) missing.push("NEXT_PUBLIC_ENGINE_URL");
    if (!ENGINE_ACCESS_TOKEN) missing.push("ENGINE_ACCESS_TOKEN/ENGINE_ADMIN_KEY/VAULT_ACCESS_TOKEN");
    
    return NextResponse.json({ 
      error: `Server configuration error. Missing: ${missing.join(', ')}` 
    }, { status: 500 });
  }

  try {
    // Query Engine API for transaction status
    const response = await fetch(`${ENGINE_URL}/transaction/status/${queueId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ENGINE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Engine API error: ${response.status} - ${error}`);
      return NextResponse.json({ 
        error: 'Failed to fetch transaction status from Engine',
        details: error 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Transaction status for ${queueId}:`, data);
    
    // Return the status data
    return NextResponse.json({ 
      queueId,
      status: data.status || 'unknown',
      transactionHash: data.transactionHash || null,
      errorMessage: data.errorMessage || null,
      onchainStatus: data.onchainStatus || null,
      result: data
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