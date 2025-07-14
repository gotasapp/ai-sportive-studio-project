import { NextRequest, NextResponse } from 'next/server';

interface BatchMintApiRequest {
  to: string;
  metadataUri: string;
  quantity: number;
  collection?: 'jerseys' | 'stadiums' | 'badges';
}

// Engine Configuration
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3005';
const ENGINE_ACCESS_TOKEN = process.env.ENGINE_ACCESS_TOKEN;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  console.log('🔄 Engine Batch Mint API: POST request received');
  
  if (!ENGINE_URL || !ENGINE_ACCESS_TOKEN || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    console.error("❌ Server-side configuration error: Missing environment variables.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const body: BatchMintApiRequest = await request.json();
    console.log('📦 Engine Batch Mint API: Request body:', body);
    
    const { to, metadataUri, quantity, collection } = body;

    if (!to || !metadataUri || !quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json({ 
        error: 'Invalid request. "to", "metadataUri" and "quantity" (1-100) are required.' 
      }, { status: 400 });
    }

    console.log(`🚀 Batch minting ${quantity} NFTs to ${to}`);

    // Array para armazenar resultados de cada mint
    const mintResults = [];
    const errors = [];

    // Fazer múltiplas chamadas para a Engine API
    for (let i = 0; i < quantity; i++) {
      try {
        console.log(`🔄 Minting NFT ${i + 1}/${quantity}`);
        
        const engineResponse = await fetch(`${ENGINE_URL}/contract/80002/${CONTRACT_ADDRESS}/erc721/mint-to`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENGINE_ACCESS_TOKEN}`,
            'x-backend-wallet-address': BACKEND_WALLET_ADDRESS,
          },
          body: JSON.stringify({
            receiver: to,
            metadata: {
              name: `Generated NFT #${i + 1}`,
              description: 'AI Generated Sports NFT from CHZ Fan Token Studio',
              image: metadataUri || 'https://gateway.ipfscdn.io/ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o/0',
              attributes: [
                { trait_type: 'Generator', value: 'AI Sports NFT' },
                { trait_type: 'Collection', value: collection || 'jerseys' },
                { trait_type: 'Batch Mint', value: 'true' }
              ]
            }
          }),
        });

        if (!engineResponse.ok) {
          const errorText = await engineResponse.text();
          console.error(`❌ Engine API Error for mint ${i + 1}:`, errorText);
          errors.push({
            mintNumber: i + 1,
            error: `Engine API error: ${engineResponse.status} - ${errorText}`
          });
          continue;
        }

        const engineResult = await engineResponse.json();
        mintResults.push({
          mintNumber: i + 1,
          queueId: engineResult.result?.queueId || engineResult.queueId,
          transactionHash: engineResult.result?.transactionHash,
          status: 'queued'
        });

        console.log(`✅ Mint ${i + 1}/${quantity} queued successfully`);

        // Pequeno delay entre mints para evitar rate limiting
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Error minting NFT ${i + 1}:`, error);
        errors.push({
          mintNumber: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
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

        if (updateResponse.ok) {
          console.log(`✅ Updated ${collection} count by ${successfulMints}`);
        } else {
          console.error(`❌ Failed to update ${collection} count`);
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
    
    return NextResponse.json(
      { error: 'Failed to process batch mint request.', details: errorMessage },
      { status: 500 }
    );
  }
} 