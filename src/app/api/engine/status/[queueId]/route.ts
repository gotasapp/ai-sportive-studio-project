import { NextRequest, NextResponse } from 'next/server';
import { Engine } from 'thirdweb';

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const VAULT_ACCESS_TOKEN = process.env.VAULT_ACCESS_TOKEN;

if (!THIRDWEB_SECRET_KEY) {
  throw new Error("Missing THIRDWEB_SECRET_KEY in .env.local");
}
if (!VAULT_ACCESS_TOKEN) {
    throw new Error("Missing VAULT_ACCESS_TOKEN in .env.local");
}

const engine = new Engine({
  secretKey: THIRDWEB_SECRET_KEY,
  vaultAccessToken: VAULT_ACCESS_TOKEN,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const queueId = params.queueId;

  if (!queueId) {
    return NextResponse.json({ error: 'queueId is required' }, { status: 400 });
  }

  try {
    const response = await engine.transactions.get(queueId);
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`❌ API /status/${queueId} ERROR:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction status.', details: errorMessage },
      { status: 500 }
    );
  }
} 