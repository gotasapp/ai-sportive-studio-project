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