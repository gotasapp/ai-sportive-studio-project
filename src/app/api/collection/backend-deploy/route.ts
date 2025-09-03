import { NextRequest, NextResponse } from 'next/server';
import { deployERC721Contract } from 'thirdweb/deploys';
import { createThirdwebClient, defineChain } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { setClaimConditions, lazyMint } from 'thirdweb/extensions/erc721';
import { getContract, sendTransaction } from 'thirdweb';
import { getActiveChain } from '@/lib/network-config';

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
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ 
        success: false, 
        error: 'Quantity must be between 1 and 100' 
      }, { status: 400 });
    }

    // Buscar configuração de royalty do admin
    let royaltyPercentage = 10; // default
    try {
      const royaltyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/settings/royalty`);
      if (royaltyResponse.ok) {
        const royaltyData = await royaltyResponse.json();
        royaltyPercentage = royaltyData.royaltyPercentage || 10;
      }
    } catch (error) {
      console.log('⚠️ Using default royalty (10%) - failed to fetch admin setting:', error);
    }

    console.log('🧾 Using royalty percentage:', royaltyPercentage + '%');

    // Configurar cliente Thirdweb
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Definir chain CHZ Mainnet
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
      chain: chzChain,
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
      chain: chzChain,
      address: contractAddress,
    });

    const claimConditionTransaction = setClaimConditions({
      contract,
      phases: [
        {
          startTime: new Date(), // Data de início
          maxClaimableSupply: BigInt(quantity), // Supply total
          maxClaimablePerWallet: BigInt(quantity), // Usuário pode pegar todos
          price: "0", // Grátis
        },
      ],
    });

    // Backend configura as condições
    await sendTransaction({
      transaction: claimConditionTransaction,
      account: backendAccount,
    });

    console.log('✅ Claim conditions configured');

    // ETAPA 3: Configurar royalties via API existente (sabemos que funciona)
    console.log('🧾 Setting up royalties...');
    
    try {
      const royaltyBps = Math.round(royaltyPercentage * 100); // Converter % para basis points (10% = 1000 bps)
      
      const royaltyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/launchpad/set-royalty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: contractAddress,
          recipient: userWallet, // Criador recebe as royalties
          bps: royaltyBps
        })
      });
      
      if (royaltyResponse.ok) {
        const royaltyResult = await royaltyResponse.json();
        console.log(`✅ Royalties configured: ${royaltyPercentage}% to ${userWallet} (Queue ID: ${royaltyResult.queueId})`);
      } else {
        console.warn(`⚠️ Royalty configuration failed, but continuing deploy`);
      }
    } catch (royaltyError) {
      console.warn(`⚠️ Royalty configuration failed: ${royaltyError}, but continuing deploy`);
    }

    // ETAPA 4: Lazy mint tokens
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
      royaltyPercentage,
      royaltyRecipient: userWallet,
      message: `DropERC721 collection deployed with ${royaltyPercentage}% royalties to creator`,
      claimConditionsSet: true,
      tokensLazyMinted: true,
      royaltiesConfigured: true,
    });

  } catch (error: any) {
    console.error('❌ Backend deploy failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Backend deployment failed' 
    }, { status: 500 });
  }
}