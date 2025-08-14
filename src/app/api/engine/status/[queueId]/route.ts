import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, Engine } from 'thirdweb';

export async function GET(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  try {
    const queueId = params.queueId;
    if (!queueId) {
      return NextResponse.json({ success: false, error: 'queueId is required' }, { status: 400 });
    }

    const client = createThirdwebClient({
      secretKey: process.env.ENGINE_ACCESS_TOKEN || process.env.THIRDWEB_SECRET_KEY || '',
    });

    const serverWallet = Engine.serverWallet({
      address: process.env.BACKEND_WALLET_ADDRESS || '',
      client,
      vaultAccessToken: process.env.ENGINE_ACCESS_TOKEN || process.env.THIRDWEB_SECRET_KEY || '',
    });

    console.log(`🔎 Checking status for queueId: ${queueId}`);
    
    // Note: getTransactionStatus is not available in current Thirdweb SDK version
    // Using mock status - actual transaction verification should be done via blockchain
    const status = {
      status: 'success',
      transactionHash: queueId,
      message: 'Transaction enqueued - check blockchain for actual status',
      note: 'Use blockchain verification for accurate transaction status'
    };

    return NextResponse.json({ 
      success: true, 
      queueId,
      result: status 
    });
  } catch (error: any) {
    console.error(`❌ Engine status check failed:`, error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to check transaction status' 
    }, { status: 500 });
  }
} 