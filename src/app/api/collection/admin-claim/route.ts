import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, sendTransaction } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { claimTo } from 'thirdweb/extensions/erc721';
import { privateKeyToAccount } from 'thirdweb/wallets';

// Define CHZ Mainnet
const chzChain = defineChain({
  id: 88888,
  name: 'Chiliz Chain',
  nativeCurrency: { name: 'CHZ', symbol: 'CHZ', decimals: 18 },
  rpc: 'https://rpc.ankr.com/chiliz',
  blockExplorers: [
    {
      name: 'ChilizScan',
      url: 'https://scan.chiliz.com',
    },
  ],
});

// Environment Variables
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;
const BACKEND_WALLET_PRIVATE_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  console.log('🚀 Admin Claim API: Starting admin gasless claim...');
  
  // Verificar se é admin
  const isAdmin = request.headers.get('x-user-admin') === 'true';
  if (!isAdmin) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized - Admin only' 
    }, { status: 401 });
  }

  // Validação das variáveis de ambiente
  if (!THIRDWEB_SECRET_KEY || !BACKEND_WALLET_ADDRESS || !BACKEND_WALLET_PRIVATE_KEY) {
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS",
      !BACKEND_WALLET_PRIVATE_KEY && "BACKEND_WALLET_PRIVATE_KEY"
    ].filter(Boolean).join(", ");

    console.error(`❌ API Error: Missing variables: ${missing}`);
    return NextResponse.json({ 
      success: false, 
      error: `Server configuration error. Missing: ${missing}` 
    }, { status: 500 });
  }

  try {
    const { contractAddress, to, quantity } = await request.json();

    if (!contractAddress || !to || !quantity) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: contractAddress, to, quantity' 
      }, { status: 400 });
    }

    console.log(`🎯 Admin gasless claim: ${quantity} NFTs to ${to} on contract ${contractAddress}`);

    // Inicializar cliente Thirdweb
    const thirdwebClient = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });
    
    const contract = getContract({ 
      client: thirdwebClient, 
      chain: chzChain, 
      address: contractAddress 
    });

    // Conta do backend (para gasless)
    const backendAccount = privateKeyToAccount({
      client: thirdwebClient,
      privateKey: BACKEND_WALLET_PRIVATE_KEY,
    });

    console.log(`🔧 Backend wallet: ${backendAccount.address}`);
    console.log(`🎯 Preparing gasless claim for ${quantity} NFTs to ${to}...`);
    
    // Preparar transação de claim
    const claimTransaction = claimTo({
      contract,
      to: to,
      quantity: BigInt(quantity),
    });

    console.log('🔧 Transaction prepared for admin gasless claim');
    
    // Executar transação gasless (backend paga)
    const result = await sendTransaction({
      transaction: claimTransaction,
      account: backendAccount,
    });

    console.log('✅ Admin gasless claim completed! Transaction hash:', result.transactionHash);
    
    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      message: `Successfully claimed ${quantity} NFTs to ${to}`,
      contractAddress,
      quantity
    });

  } catch (error) {
    console.error('❌ Admin gasless claim error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Admin gasless claim failed' 
    }, { status: 500 });
  }
}