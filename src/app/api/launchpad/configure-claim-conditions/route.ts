import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine, prepareContractCall } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { connectToDatabase } from '@/lib/mongodb';

const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contractAddress: string | undefined = body?.contractAddress;
    const mintStages: any[] = Array.isArray(body?.mintStages) ? body.mintStages : [];
    const claimCurrency: string = body?.claimCurrency || 'MATIC';
    const collectionId: string | undefined = body?.collectionId;

    if (!contractAddress) {
      return NextResponse.json({ success: false, error: 'contractAddress is required' }, { status: 400 });
    }

    // Persist intended claim stages in DB for observability (no on-chain write here yet)
    if (collectionId) {
      const mongo = await connectToDatabase();
      const db = mongo.db('chz-app-db');
      try {
        await db.collection('launchpad_collections').updateOne(
          { _id: new (require('mongodb').ObjectId)(collectionId) },
          {
            $set: {
              mintStages,
              claimCurrency,
              updatedAt: new Date(),
            },
          }
        );
      } catch {}
    }

    // Try to apply on-chain claim conditions (best-effort)
    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
      secretKey: process.env.THIRDWEB_SECRET_KEY || process.env.ENGINE_ACCESS_TOKEN || '',
    });
    const contract = getContract({ client, chain: amoy, address: contractAddress });

    // Build a minimal single-stage condition from first stage
    const stage = mintStages[0] || {};
    const walletLimit = Number(stage.walletLimit || 0) > 0 ? BigInt(stage.walletLimit) : BigInt(0);
    const startTimeIso = stage.startTime || new Date().toISOString();

    // Parse price (supports "0.1", "0.1 MATIC", "FREE")
    const parseMatic = (val: any): bigint => {
      if (!val || String(val).toUpperCase().includes('FREE')) return BigInt(0);
      const s = String(val).replace(/[^0-9.]/g, '');
      const [whole, frac = ''] = s.split('.');
      const fracPadded = (frac + '000000000000000000').slice(0, 18); // 18 decimals
      const wholeWei = BigInt(whole || '0') * BigInt('1000000000000000000');
      const fracWei = BigInt(fracPadded || '0');
      return wholeWei + fracWei;
    };
    const priceWei = parseMatic(stage.price);
    const nativeCurrency = '0x0000000000000000000000000000000000000000';

    // Construct condition tuple for DropERC721
    const conditions = [
      {
        startTimestamp: BigInt(Math.floor(new Date(startTimeIso).getTime() / 1000)),
        maxClaimableSupply: stage.maxSupplyPerPhase ? BigInt(stage.maxSupplyPerPhase) : BigInt('115792089237316195423570985008687907853269984665640564039457'),
        supplyClaimed: BigInt(0),
        quantityLimitPerWallet: walletLimit,
        merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        pricePerToken: priceWei,
        currency: nativeCurrency,
        metadata: '',
        waitTimeInSecondsBetweenClaims: BigInt(0),
      },
    ];

    // Prepare raw call to match common DropERC721 ABI
    const tx = prepareContractCall({
      contract,
      method:
        'function setClaimConditions((uint256 startTimestamp,uint256 maxClaimableSupply,uint256 supplyClaimed,uint256 quantityLimitPerWallet,bytes32 merkleRoot,uint256 pricePerToken,address currency,string metadata,uint256 waitTimeInSecondsBetweenClaims)[] _conditions,bool _resetClaimEligibility)'
      ,
      params: [conditions as any, true],
    });

    // Execute via Engine server wallet for gasless admin change
    const serverWallet = Engine.serverWallet({
      address: process.env.BACKEND_WALLET_ADDRESS || '',
      client,
      vaultAccessToken: process.env.ENGINE_ACCESS_TOKEN || process.env.THIRDWEB_SECRET_KEY || '',
    });

    const { transactionId } = await serverWallet.enqueueTransaction({ transaction: tx });

    return NextResponse.json({ success: true, message: 'Claim conditions enqueued on-chain', contractAddress, stages: mintStages.length, queueId: transactionId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unhandled error' }, { status: 500 });
  }
}