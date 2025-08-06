import { NextRequest, NextResponse } from 'next/server';
import { deployERC721Contract } from 'thirdweb/deploys';
import { createThirdwebClient, defineChain } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { setClaimConditions, lazyMint } from 'thirdweb/extensions/erc721';
import { getContract, sendTransaction } from 'thirdweb';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Backend Deploy API: Starting collection deployment...');
    
    const { name, description, quantity, imageUri, userWallet } = await request.json();

    if (!name || !description || !quantity || !imageUri || !userWallet) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, description, quantity, imageUri, userWallet' 
      }, { status: 400 });
    }

    // Validar quantity
    if (quantity < 2 || quantity > 100) {
      return NextResponse.json({ 
        success: false, 
        error: 'Quantity must be between 2 and 100' 
      }, { status: 400 });
    }

    // Configurar cliente Thirdweb
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Definir chain Amoy com RPC atualizado
    const amoyChain = defineChain({
      id: 80002,
      name: 'Polygon Amoy Testnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpc: 'https://rpc.ankr.com/polygon_amoy/5b2d60918c8135da4798d0d735c2b2d483d3e3d8992ab6cf34c53b0fd81803ef',
      blockExplorers: [
        {
          name: 'PolygonScan',
          url: 'https://amoy.polygonscan.com',
        },
      ],
    });

    // Conta do backend (sua wallet)
    const backendAccount = privateKeyToAccount({
      client,
      privateKey: process.env.BACKEND_WALLET_PRIVATE_KEY!,
    });

    console.log('🔑 Backend wallet:', backendAccount.address);
    console.log('📦 Deploying DropERC721 for:', name);

    // ETAPA 1: Deploy do contrato DropERC721
    const contractAddress = await deployERC721Contract({
      client,
      chain: amoyChain,
      account: backendAccount, // Sua wallet assina
      type: "DropERC721",
      params: {
        name: name,
        symbol: "AIGC", // AI Generated Collection
        description: description,
        image: imageUri,
        // Note: primary_sale_recipient and royalty settings may need to be configured after deployment
      },
    });

    console.log('✅ Contract deployed at:', contractAddress);

    // ETAPA 2: Configurar claim conditions
    console.log('⚙️ Setting up claim conditions...');
    
    const contract = getContract({
      client,
      chain: amoyChain,
      address: contractAddress,
    });

    const claimConditionTransaction = setClaimConditions({
      contract,
      phases: [
        {
          startTime: new Date(), // Imediatamente disponível
          maxClaimableSupply: BigInt(quantity), // Supply total
          maxClaimablePerWallet: BigInt(quantity), // Usuário pode pegar todos
          price: "0", // Grátis
          currency: "0x0000000000000000000000000000000000000000", // NATIVE (MATIC)
        },
      ],
    });

    // Backend configura as condições
    await sendTransaction({
      transaction: claimConditionTransaction,
      account: backendAccount,
    });

    console.log('✅ Claim conditions configured');

    // ETAPA 3: Lazy mint tokens
    console.log('📦 Lazy minting tokens...');
    
    const lazyMintTransaction = lazyMint({
      contract,
      nfts: Array(quantity).fill({
        name: `AI Collection NFT #`,
        description: `AI Generated NFT from collection`,
        image: imageUri,
      }),
    });

    await sendTransaction({
      transaction: lazyMintTransaction,
      account: backendAccount, // Backend faz o lazy mint
    });

    console.log('✅ Tokens lazy minted by backend');

    // Retornar dados para o frontend
    return NextResponse.json({
      success: true,
      contractAddress,
      deployedBy: backendAccount.address,
      quantity,
      message: `DropERC721 collection deployed and prepared with ${quantity} NFT supply`,
      claimConditionsSet: true,
      tokensLazyMinted: true,
    });

  } catch (error: any) {
    console.error('❌ Backend deploy failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Backend deployment failed' 
    }, { status: 500 });
  }
}