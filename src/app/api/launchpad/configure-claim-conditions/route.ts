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

import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { setClaimConditions } from 'thirdweb/extensions/erc721';
import { Engine } from 'thirdweb';

// Define a chain Amoy
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  console.log('🎯 Configure Claim Conditions API: Processing request...');

  // Validação das variáveis de ambiente
  if (!THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
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
      mintStages: any[];
      claimCurrency?: string;
      maxSupplyPerPhase?: number;
    } = await request.json();
    
    const { contractAddress, mintStages, claimCurrency = 'MATIC', maxSupplyPerPhase } = body;

    if (!contractAddress || !mintStages || mintStages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Contract address and mint stages are required.' 
      }, { status: 400 });
    }

    console.log('📋 Configuring claim conditions for contract:', contractAddress);
    console.log('📋 Mint stages:', mintStages);

    // Criar cliente Thirdweb
    const thirdwebClient = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
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
      vaultAccessToken: THIRDWEB_SECRET_KEY,
    });

    // Mapear moedas para endereços na Polygon Amoy
    const getCurrencyAddress = (currency: string) => {
      const currencyMap: Record<string, string> = {
        'MATIC': '0x0000000000000000000000000000000000000000', // Native token
        'FREE': '0x0000000000000000000000000000000000000000', // Free mint (preço = 0)
        'USDC_AMOY': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // USDC na Amoy
        'USDT_AMOY': '0xf9f98365566F4D55234f24b99caA1AfBE6428D44', // USDT na Amoy  
        'WETH_AMOY': '0x360ad4f9a9A8EFe9A8DCB5f461c4Cc1047E1Dcf9', // WETH na Amoy
      };
      return currencyMap[currency] || currencyMap['MATIC'];
    };

    // Converter mint stages para claim conditions
    const claimConditions = mintStages.map((stage, index) => {
      // Converter preço para Wei (ou 0 se FREE)
      let priceInWei = "0";
      if (claimCurrency !== 'FREE') {
        const priceInToken = parseFloat(stage.price.replace(/[^0-9.]/g, '')) || 0;
        // Para tokens ERC20 como USDC/USDT (6 decimals) vs MATIC/WETH (18 decimals)
        const decimals = claimCurrency.includes('USDC') || claimCurrency.includes('USDT') ? 6 : 18;
        priceInWei = (priceInToken * Math.pow(10, decimals)).toString();
      }
      
      // Converter timestamps
      const startTimestamp = stage.startTime ? new Date(stage.startTime).getTime() / 1000 : Math.floor(Date.now() / 1000);
      
      // Determinar se precisa de allowlist baseado no tipo de stage
      const stageId = stage.id?.toLowerCase() || stage.name?.toLowerCase() || '';
      const isPublic = stageId.includes('public') || stageId === 'public';
      
      // Para stages públicos, merkleRoot fica 0x000... (sem allowlist)
      // Para VIP e Whitelist, será configurado posteriormente com as wallets
      const merkleRoot = isPublic 
        ? "0x0000000000000000000000000000000000000000000000000000000000000000" 
        : "0x0000000000000000000000000000000000000000000000000000000000000000"; // Temporário
      
      return {
        startTimestamp: BigInt(Math.floor(startTimestamp)),
        maxClaimableSupply: BigInt(maxSupplyPerPhase || 1000), // Supply máximo por fase
        quantityLimitPerWallet: BigInt(stage.walletLimit || 10), // Limite por wallet
        pricePerToken: BigInt(priceInWei), // Preço em wei/units
        currency: getCurrencyAddress(claimCurrency), // Endereço da moeda
        merkleRoot: merkleRoot, // Allowlist para VIP/Whitelist, público para Public
        metadata: {
          name: stage.name || `Phase ${index + 1}`,
          description: stage.description || `Mint phase ${index + 1}`,
          currency: claimCurrency, // Para referência
          stageType: isPublic ? 'public' : 'allowlist', // Tipo do stage
          allowlistRequired: !isPublic // Se precisa de allowlist
        }
      };
    });

    console.log('🔧 Generated claim conditions:', claimConditions);

    // Preparar transação para configurar claim conditions
    const transaction = setClaimConditions({
      contract,
      phases: claimConditions
    });

    console.log('🔧 Enqueueing claim conditions transaction...');

    // Enfileirar a transação via Engine
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ Claim conditions configured! Queue ID: ${transactionId}`);

    return NextResponse.json({ 
      success: true,
      queueId: transactionId,
      message: 'Claim conditions configured successfully',
      contractAddress,
      configuredPhases: claimConditions.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ Configure Claim Conditions CRITICAL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to configure claim conditions.', 
      details: errorMessage 
    }, { status: 500 });
  }
}