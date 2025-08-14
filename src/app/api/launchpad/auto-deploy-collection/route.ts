import { NextRequest, NextResponse } from 'next/server';
import { deployERC721Contract } from 'thirdweb/deploys';
import { createThirdwebClient, defineChain, getContract } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { setClaimConditions, lazyMint } from 'thirdweb/extensions/erc721';
import { sendTransaction } from 'thirdweb';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Launchpad Auto-Deploy: Starting contract deployment...');
    
    const body = await request.json();
    const collectionId: string | undefined = body?.collectionId;
    const name: string | undefined = body?.name;
    const description: string | undefined = body?.description;
    const image: string | undefined = body?.image;
    const price: string | undefined = body?.price || '0'; // Price in wei
    const maxSupply: number | undefined = body?.maxSupply || 100;

    if (!name || !description || !image || !collectionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'name, description, image, and collectionId are required' 
      }, { status: 400 });
    }

    // Configurar cliente Thirdweb
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Definir chain Amoy
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

    // Conta do backend (gasless deploy)
    const backendAccount = privateKeyToAccount({
      client,
      privateKey: process.env.BACKEND_WALLET_PRIVATE_KEY!,
    });

    console.log('🔑 Backend wallet:', backendAccount.address);
    console.log('📦 Deploying DropERC721 for Launchpad collection:', name);

    // ETAPA 1: Deploy do contrato DropERC721
    const contractAddress = await deployERC721Contract({
      client,
      chain: amoyChain,
      account: backendAccount, // Backend wallet assina (gasless para usuário)
      type: "DropERC721",
      params: {
        name: name,
        symbol: "LAUNCH", // Launchpad symbol
        description: description,
        image: image, // IPFS da imagem aprovada
      },
    });

    console.log('✅ Launchpad contract deployed at:', contractAddress);

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
          startTime: new Date(), // Inicia imediatamente
          maxClaimableSupply: BigInt(maxSupply || 100), // Supply máximo da coleção
          maxClaimablePerWallet: BigInt(10), // Máximo por wallet
          price: price, // Preço em wei (pode ser 0 para grátis)
        },
      ],
    });

    // Backend configura as condições (gasless)
    await sendTransaction({
      transaction: claimConditionTransaction,
      account: backendAccount,
    });

    console.log('✅ Claim conditions configured');

    // ETAPA 3: Lazy mint tokens com metadata da coleção
    console.log('📦 Lazy minting tokens with collection metadata...');
    
    const lazyMintTransaction = lazyMint({
      contract,
      nfts: Array(maxSupply || 100).fill({
        name: name, // Mesmo nome da coleção
        description: description, // Mesma descrição
        image: image, // Mesma imagem IPFS para todos os NFTs
      }),
    });

    await sendTransaction({
      transaction: lazyMintTransaction,
      account: backendAccount, // Backend faz o lazy mint (gasless)
    });

    console.log('✅ Tokens lazy minted with collection metadata');

    // ETAPA 4: Salvar contrato no banco de dados
    if (collectionId) {
      const mongo = await connectToDatabase();
      const db = mongo.db('chz-app-db');
      await db.collection('launchpad_collections').updateOne(
        { _id: new (require('mongodb').ObjectId)(collectionId) },
        { 
          $set: { 
            contractAddress: contractAddress,
            deployed: true,
            deployedAt: new Date(),
            maxSupply: maxSupply || 100,
            price: price,
            updatedAt: new Date()
          } 
        }
      );
      console.log('✅ Contract address saved to database');
    }

    // Retornar dados para o frontend
    return NextResponse.json({
      success: true,
      contractAddress,
      deployedBy: backendAccount.address,
      maxSupply: maxSupply || 100,
      price,
      message: `Launchpad collection deployed successfully with metadata`,
      claimConditionsSet: true,
      tokensLazyMinted: true,
      collectionId
    });

  } catch (error: any) {
    console.error('❌ Launchpad auto-deploy failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Auto-deployment failed' 
    }, { status: 500 });
  }
}


