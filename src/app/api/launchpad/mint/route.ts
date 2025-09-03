import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';
import clientPromise from '@/lib/mongodb';

// Define a chain Amoy com RPC dedicado
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const ENGINE_ACCESS_TOKEN = process.env.ENGINE_ACCESS_TOKEN; // Preferível se configurado
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;
const DB_NAME = 'chz-app-db';

/**
 * @swagger
 * /api/launchpad/mint:
 *   post:
 *     summary: Gasless mint NFT from launchpad collection
 *     description: |
 *       Mints an NFT from a launchpad collection using gasless minting (admin pays gas fees).
 *       This bypasses claim conditions and mints directly to the specified wallet.
 *     tags: [Launchpad, NFTs]
 *     security:
 *       - WalletAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - metadataUri
 *               - collectionId
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient wallet address
 *                 example: "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56"
 *               metadataUri:
 *                 type: string
 *                 format: uri
 *                 description: IPFS metadata URI for the NFT
 *                 example: "ipfs://QmX1234567890abcdef..."
 *               collectionId:
 *                 type: string
 *                 description: Launchpad collection MongoDB ObjectId
 *                 example: "689e70b34341ccf79a223460"
 *               chainId:
 *                 type: integer
 *                 description: "Blockchain chain ID (default: 80002 for Polygon Amoy)"
 *                 example: 80002
 *     responses:
 *       200:
 *         description: NFT minted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "NFT minted successfully!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                       description: Blockchain transaction hash
 *                     tokenId:
 *                       type: string
 *                       description: Minted token ID
 *                     nftId:
 *                       type: string
 *                       description: MongoDB document ID
 *                     contractAddress:
 *                       type: string
 *                       description: Collection contract address
 *                     metadataUri:
 *                       type: string
 *                       description: IPFS metadata URI
 *       400:
 *         description: Bad request - Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export async function POST(request: NextRequest) {
  console.log('🚀 Launchpad Mint API: Processing request...');

  // Validação das variáveis de ambiente
  if ((!THIRDWEB_SECRET_KEY && !ENGINE_ACCESS_TOKEN) || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      (!THIRDWEB_SECRET_KEY && !ENGINE_ACCESS_TOKEN) && "THIRDWEB_SECRET_KEY or ENGINE_ACCESS_TOKEN",
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
      to: string; 
      metadataUri: string; 
      collectionId: string;
      price?: string;
      quantity?: number;
    } = await request.json();
    
    const { to, metadataUri, collectionId, price = "0", quantity = 1 } = body;

    if (!to || !metadataUri || !collectionId) {
      return NextResponse.json({ 
        success: false, 
        error: '"to" address, "metadataUri", and "collectionId" are required.' 
      }, { status: 400 });
    }

    console.log('📋 Request data:', { to, metadataUri, collectionId, price, quantity });

    // Buscar dados da coleção no MongoDB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const collection = await db.collection('collections').findOne({
      _id: new (require('mongodb').ObjectId)(collectionId),
      type: 'launchpad'
    });

    if (!collection) {
      return NextResponse.json({ 
        success: false, 
        error: 'Collection not found or not a launchpad collection.' 
      }, { status: 404 });
    }

    if (collection.status !== 'active') {
      return NextResponse.json({ 
        success: false, 
        error: 'Collection is not active for minting.' 
      }, { status: 400 });
    }

    // Verificar se ainda há supply disponível
    if (collection.minted >= collection.totalSupply) {
      return NextResponse.json({ 
        success: false, 
        error: 'All NFTs have been minted for this collection.' 
      }, { status: 400 });
    }

    // Usar contractAddress da coleção ou fallback
    const contractAddress = collection.contractAddress || process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'No contract address configured for this collection.' 
      }, { status: 500 });
    }

    console.log('📄 Using contract address:', contractAddress);

    // Inicializar cliente Thirdweb
    const thirdwebClient = createThirdwebClient({ 
      secretKey: THIRDWEB_SECRET_KEY || ENGINE_ACCESS_TOKEN || '' 
    });
    
    const contract = getContract({ 
      client: thirdwebClient, 
      chain: amoy, 
      address: contractAddress 
    });

    // Buscar metadados do IPFS
    let metadata;
    try {
      const metadataResponse = await fetch(metadataUri);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch metadata from IPFS');
      }
      metadata = await metadataResponse.json();
    } catch (error) {
      console.error('❌ Error fetching metadata:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch metadata from IPFS.' 
      }, { status: 500 });
    }

    console.log('📄 Metadata fetched:', metadata);

    // Configurar Engine para gasless mint
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: thirdwebClient,
      vaultAccessToken: ENGINE_ACCESS_TOKEN || THIRDWEB_SECRET_KEY || '',
    });

    // Preparar transação de mint direto (gasless admin mint)
    // Usar mintTo em vez de claimTo para evitar dependência de claim conditions
    const transaction = mintTo({
      contract,
      to,
      nft: {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes || []
      }
    });
    
    console.log('🎯 Using mintTo for gasless admin mint (bypasses claim conditions)');

    console.log('🔧 Transaction prepared for gasless mint');

    console.log('🔧 Engine configured, enqueueing transaction...');

    // Enfileirar a transação
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ Launchpad Mint: Transaction enqueued successfully! Queue ID: ${transactionId}`);
    console.log('🔎 Engine diagnostics:', {
      usingEngineAccessToken: !!ENGINE_ACCESS_TOKEN,
      backendWallet: BACKEND_WALLET_ADDRESS,
      chainId: amoy.id,
      contractAddress,
    });

    // Atualizar contador de minted na coleção
    await db.collection('collections').updateOne(
      { _id: new (require('mongodb').ObjectId)(collectionId) },
      { $inc: { minted: quantity } }
    );

    console.log(`📊 Updated minted count for collection ${collectionId}`);

    return NextResponse.json({ 
      success: true,
      queueId: transactionId,
      message: 'Launchpad NFT minted successfully',
      collectionId,
      mintedQuantity: quantity
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ Launchpad Mint API CRITICAL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process launchpad mint request.', 
      details: errorMessage 
    }, { status: 500 });
  }
} 