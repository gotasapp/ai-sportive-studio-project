import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { setSharedMetadata } from 'thirdweb/extensions/erc721';

// Define a chain Amoy
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  console.log('🎨 Set Shared Metadata API: Processing request...');

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
      name: string;
      description: string;
      image: string;
      attributes?: any[];
    } = await request.json();
    
    const { contractAddress, name, description, image, attributes = [] } = body;

    if (!contractAddress || !name || !image) {
      return NextResponse.json({ 
        success: false, 
        error: 'Contract address, name, and image are required.' 
      }, { status: 400 });
    }

    console.log('🎨 Setting shared metadata for contract:', contractAddress);

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

    // Preparar metadata para OpenEditionERC721
    const sharedMetadata = {
      name,
      description,
      image,
      attributes
    };

    console.log('📋 Shared metadata:', sharedMetadata);

    // Preparar transação para configurar shared metadata
    const transaction = setSharedMetadata({
      contract,
      metadata: sharedMetadata
    });

    console.log('🔧 Enqueueing shared metadata transaction...');

    // Enfileirar a transação via Engine
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ Shared metadata configured! Queue ID: ${transactionId}`);

    return NextResponse.json({ 
      success: true,
      queueId: transactionId,
      message: 'Shared metadata configured successfully',
      contractAddress,
      metadata: sharedMetadata
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ Set Shared Metadata CRITICAL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to set shared metadata.', 
      details: errorMessage 
    }, { status: 500 });
  }
}