import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

interface BatchMintApiRequest {
  to: string;
  metadataUri: string;
  quantity: number;
  collection?: 'jerseys' | 'stadiums' | 'badges';
}

// Define Chiliz Chain
const chzMainnet = defineChain({
  id: 88888,
  rpc: process.env.NEXT_PUBLIC_CHILIZ_RPC_URL || 'https://rpc.chiliz.com'
});

// Environment Variables (seguindo padrão do Launchpad)
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  console.log('🔄 Engine Batch Mint API: POST request received');
  
  // Validação das variáveis de ambiente (seguindo padrão do Launchpad)
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
      !CONTRACT_ADDRESS && "CONTRACT_ADDRESS", 
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS"
    ].filter(Boolean).join(", ");

    console.error(`❌ API Error: Missing variables: ${missing}`);
    return NextResponse.json({ 
      success: false, 
      error: `Server configuration error. Missing: ${missing}` 
    }, { status: 500 });
  }

  try {
    const body: BatchMintApiRequest = await request.json();
    console.log('📦 Engine Batch Mint API: Request body:', body);
    
    // Verificar se é admin
    const isAdmin = request.headers.get('x-user-admin') === 'true';
    console.log('👤 User admin status:', isAdmin);
    
    const { to, metadataUri, quantity, collection } = body;

    if (!to || !quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid request. "to" and "quantity" (1-100) are required.' 
      }, { status: 400 });
    }

    console.log(`🚀 Batch minting ${quantity} NFTs to ${to}`, { isAdmin, collection });

    // Inicializar cliente Thirdweb (seguindo padrão do Launchpad)
    const thirdwebClient = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY 
    });
    
    const contract = getContract({ 
      client: thirdwebClient, 
      chain: chzMainnet, 
      address: CONTRACT_ADDRESS 
    });

    console.log('📄 Using contract address:', CONTRACT_ADDRESS);

    // Array para armazenar resultados de cada mint
    const mintResults = [];
    const errors = [];

    // Se metadataUri estiver vazio, usar uma URI genérica
    const finalMetadataUri = metadataUri || 'https://gateway.ipfscdn.io/ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o/0';

    // NOVO: Configurar servidor wallet para admin gasless (seguindo padrão do Launchpad)
    if (isAdmin) {
      console.log('💰 Admin detected - using gasless batch mint with Engine.serverWallet');
      
      const serverWallet = Engine.serverWallet({
        address: BACKEND_WALLET_ADDRESS,
        client: thirdwebClient,
        vaultAccessToken: THIRDWEB_SECRET_KEY,
      });

      // Fazer múltiplos mints gasless usando serverWallet
      for (let i = 0; i < quantity; i++) {
        try {
          console.log(`🔄 Admin gasless mint ${i + 1}/${quantity}`);
          
          const transaction = mintTo({
            contract,
            to,
            nft: {
              name: `Generated NFT #${i + 1}`,
              description: 'AI Generated Sports NFT from CHZ Fan Token Studio',
              image: finalMetadataUri,
              attributes: [
                { trait_type: 'Generator', value: 'AI Sports NFT' },
                { trait_type: 'Collection', value: collection || 'jerseys' },
                { trait_type: 'Batch Mint', value: 'true' },
                { trait_type: 'Mint Type', value: 'gasless' }
              ]
            }
          });

          console.log(`🔧 Transaction ${i + 1} prepared for gasless mint`);
          
          // Enfileirar a transação
          const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
          
          console.log(`✅ Admin mint ${i + 1} enqueued successfully! Queue ID: ${transactionId}`);
          mintResults.push({ 
            mintNumber: i + 1, 
            queueId: transactionId,
            status: 'enqueued'
          });
          
          // Pequeno delay entre mints
          if (i < quantity - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error) {
          console.error(`❌ Admin mint ${i + 1} failed:`, error);
          errors.push({
            mintNumber: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } else {
      console.log('💳 Regular user detected - batch mint not supported for this endpoint');
      return NextResponse.json({ 
        success: false,
        error: 'Batch mint for regular users should use contract deployment flow' 
      }, { status: 400 });
    }

    const successfulMints = mintResults.length;
    const failedMints = errors.length;

    console.log(`✅ Batch mint completed: ${successfulMints} successful, ${failedMints} failed`);

    // Atualizar contagem da coleção se especificada
    if (collection && successfulMints > 0) {
      try {
        const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/collections/update-count`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection,
            increment: successfulMints
          })
        });

        if (!updateResponse.ok) {
          console.warn('⚠️ Failed to update collection count, but mint succeeded');
        }
      } catch (error) {
        console.error('❌ Error updating collection count:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      totalRequested: quantity,
      successfulMints,
      failedMints,
      results: mintResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Batch mint completed: ${successfulMints}/${quantity} NFTs queued successfully`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ Batch Mint API CRITICAL ERROR:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process batch mint request.', 
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🔧 GET - THIRDWEB_SECRET_KEY:', THIRDWEB_SECRET_KEY ? 'EXISTS' : 'MISSING');
  console.log('🔧 GET - CONTRACT_ADDRESS:', CONTRACT_ADDRESS || 'MISSING');
  console.log('🔧 GET - BACKEND_WALLET_ADDRESS:', BACKEND_WALLET_ADDRESS ? 'EXISTS' : 'MISSING');
  
  return NextResponse.json({
    status: 'Batch Mint API is working - Updated with Engine.serverWallet',
    config: {
      THIRDWEB_SECRET_KEY: THIRDWEB_SECRET_KEY ? 'configured' : 'missing',
      CONTRACT_ADDRESS: CONTRACT_ADDRESS || 'missing',
      BACKEND_WALLET_ADDRESS: BACKEND_WALLET_ADDRESS ? 'configured' : 'missing'
    },
    approach: 'Using Engine.serverWallet for admin gasless mints (same as Launchpad)',
    timestamp: new Date().toISOString()
  });
}