import { NextRequest, NextResponse } from 'next/server';
import { createThirdwebClient, getContract, Engine } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';

// Define a chain Amoy com RPC dedicado
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Variáveis de ambiente conforme estão configuradas no Vercel
// Last updated: 2025-07-16 - Using THIRDWEB_SECRET_KEY as vaultAccessToken
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS;
const BACKEND_WALLET_ADDRESS = process.env.BACKEND_WALLET_ADDRESS;

/**
 * @swagger
 * /api/engine/mint:
 *   post:
 *     summary: Mint NFT using Thirdweb Engine
 *     description: |
 *       Mints an NFT using Thirdweb Engine for gasless transactions.
 *       The backend wallet pays the gas fees for the minting process.
 *     tags: [Engine, NFTs]
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
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient wallet address
 *                 example: "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56"
 *               metadataUri:
 *                 type: string
 *                 format: uri
 *                 description: IPFS metadata URI
 *                 example: "ipfs://QmX1234567890abcdef..."
 *               contractAddress:
 *                 type: string
 *                 description: NFT contract address (optional, uses default if not provided)
 *                 example: "0xfF973a4aFc5A96DEc81366461A461824c4f80254"
 *     responses:
 *       200:
 *         description: NFT minted successfully via Engine
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionHash:
 *                   type: string
 *                   description: Blockchain transaction hash
 *                 queueId:
 *                   type: string
 *                   description: Thirdweb Engine queue ID for tracking
 *                 tokenId:
 *                   type: string
 *                   description: Minted token ID
 *                 contractAddress:
 *                   type: string
 *                   description: Contract address used
 *                 recipient:
 *                   type: string
 *                   description: Recipient address
 *                 metadataUri:
 *                   type: string
 *                   description: Metadata URI used
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Minting failed or environment not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: NextRequest) {
  // --- DIAGNÓSTICO ---
  console.log('--- VERCEL ENVIRONMENT DIAGNOSTIC ---');
  console.log(`1. THIRDWEB_SECRET_KEY:`, {
    isPresent: !!THIRDWEB_SECRET_KEY,
    value: THIRDWEB_SECRET_KEY ? `...${THIRDWEB_SECRET_KEY.slice(-4)}` : 'NÃO ENCONTRADA'
  });
  console.log(`2. CONTRACT_ADDRESS:`, CONTRACT_ADDRESS || 'NÃO ENCONTRADA');
  console.log(`3. BACKEND_WALLET_ADDRESS:`, BACKEND_WALLET_ADDRESS || 'NÃO ENCONTRADA');
  console.log('------------------------------------');

  // Validação completa com mensagem específica
  if (!THIRDWEB_SECRET_KEY || !CONTRACT_ADDRESS || !BACKEND_WALLET_ADDRESS) {
    const missing = [
      !THIRDWEB_SECRET_KEY && "THIRDWEB_SECRET_KEY",
      !CONTRACT_ADDRESS && "NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS",
      !BACKEND_WALLET_ADDRESS && "BACKEND_WALLET_ADDRESS"
    ].filter(Boolean).join(", ");

    console.error(`❌ API Error: Missing variables: ${missing}`);
    return NextResponse.json({ error: `Server configuration error. Missing: ${missing}` }, { status: 500 });
  }

  try {
    const body: { to: string; metadataUri: string } = await request.json();
    const { to, metadataUri } = body;

    if (!to || !metadataUri) {
      return NextResponse.json({ error: '"to" address and "metadataUri" are required.' }, { status: 400 });
    }

    // Inicialização correta conforme MILESTONE_3_MINT_ENGINE_FIXED.md
    const client = createThirdwebClient({ secretKey: THIRDWEB_SECRET_KEY });
    const contract = getContract({ client, chain: amoy, address: CONTRACT_ADDRESS });
    const transaction = mintTo({ contract, to, nft: metadataUri });

    console.log("✅ API: Transaction prepared with metadata URI:", metadataUri);
    console.log("📍 Chain:", amoy.id, "- Polygon Amoy");
    console.log("📄 Contract:", CONTRACT_ADDRESS);
    console.log("👤 Backend Wallet:", BACKEND_WALLET_ADDRESS);
    console.log("🎯 Recipient:", to);

    // Configuração da Engine conforme documentação
    const serverWallet = Engine.serverWallet({
      address: BACKEND_WALLET_ADDRESS,
      client: client,
      vaultAccessToken: THIRDWEB_SECRET_KEY, // Usar THIRDWEB_SECRET_KEY como estava funcionando em junho
    });

    console.log("🔧 Engine configured, enqueueing transaction...");

    // Enfileirar a transação
    const { transactionId } = await serverWallet.enqueueTransaction({ transaction });
    
    console.log(`✅ API: Transaction enqueued successfully! Queue ID: ${transactionId}`);
    return NextResponse.json({ queueId: transactionId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('❌ API CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Failed to process mint request.', details: errorMessage }, { status: 500 });
  }
} 