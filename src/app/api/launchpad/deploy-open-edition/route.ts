import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { NATIVE_TOKEN_ADDRESS } from '@thirdweb-dev/sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/launchpad/deploy-open-edition chamado');
    
    const data = await request.json();
    console.log('📥 Dados recebidos:', JSON.stringify(data, null, 2));
    
    const { name, symbol, image, price, supply, walletLimit, startTime, mintStages } = data;

    // Validar campos obrigatórios
    if (!name || !symbol || !image || !startTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🏗️ Iniciando deploy do contrato OpenEditionERC721...');
    
    // Configurar SDK com secret key
    const sdk = new ThirdwebSDK("amoy", {
      secretKey: process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY,
    });

    // 1. Deploy do contrato OpenEditionERC721
    const contract = await sdk.deployer.deployBuiltInContract("open-edition", {
      name,
      symbol,
      primary_sale_recipient: process.env.BACKEND_WALLET_ADDRESS,
      platform_fee_basis_points: 0,
      platform_fee_recipient: process.env.BACKEND_WALLET_ADDRESS,
    });

    // No v4, contract.getAddress() pode ser assíncrono
    const contractAddress = await (contract as any).getAddress();
    console.log('✅ Contrato deployado:', contractAddress);

    // 2. Configurar metadata do contrato
    await (contract as any).metadata.update({
      name,
      description: `${name} NFT Collection`,
      image, // IPFS da imagem
    });

    // 3. Configurar claim conditions baseado nos mintStages
    const claimConditions = [];
    
    if (mintStages && Array.isArray(mintStages)) {
      for (const stage of mintStages) {
        const startTime = new Date(stage.startTime);
        const price = parseFloat(stage.price.replace(/[^\d.]/g, '')); // Extrair número do preço
        
        const condition = {
          startTime: startTime,
          price: price.toString(),
          currencyAddress: NATIVE_TOKEN_ADDRESS,
          quantityLimitPerWallet: stage.walletLimit || 1,
          maxClaimableSupply: stage.maxSupply || 100,
          ...(stage.type === 'whitelist' && stage.allowlist && Array.isArray(stage.allowlist) 
            ? { allowlist: stage.allowlist } 
            : {}
          )
        };

        claimConditions.push(condition);
      }
    }

    // Se não há mintStages, criar condição padrão
    if (claimConditions.length === 0) {
      const defaultStartTime = new Date(startTime);
      const defaultPrice = price ? parseFloat(price.replace(/[^\d.]/g, '')) : 0;
      
      claimConditions.push({
        startTime: defaultStartTime,
        price: defaultPrice.toString(),
        currencyAddress: NATIVE_TOKEN_ADDRESS,
        quantityLimitPerWallet: walletLimit || 1,
        maxClaimableSupply: supply || 100,
      });
    }

    // Configurar claim conditions
    await (contract as any).erc721.claimConditions.set(claimConditions);
    console.log('✅ Claim conditions configuradas:', claimConditions);

    const response = {
      success: true,
      contractAddress: contractAddress,
      message: 'Contract deployed successfully with claim conditions'
    };

    console.log('📤 Retornando resposta:', response);
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error deploying contract:', error);
    const errorResponse = { 
      success: false, 
      error: 'Failed to deploy contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    console.log('📤 Retornando erro:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 