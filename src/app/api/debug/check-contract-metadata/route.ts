import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFT } from 'thirdweb/extensions/erc721';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contract');
    const tokenId = searchParams.get('tokenId') || '1';

    if (!contractAddress) {
      return NextResponse.json({ 
        error: 'Provide contract address as ?contract=0x...' 
      }, { status: 400 });
    }

    console.log(`🔍 Debugando contrato ${contractAddress}, token ${tokenId}`);

    // 1. Buscar dados no MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db('chz-app-db');

    // Buscar na custom_collections
    const customCollection = await db.collection('custom_collections')
      .findOne({ contractAddress });

    // Buscar mints relacionados
    const customMints = await db.collection('custom_collection_mints')
      .find({ contractAddress })
      .limit(5)
      .toArray();

    // Buscar na collections (launchpad)
    const launchpadCollection = await db.collection('collections')
      .findOne({ contractAddress });

    // 2. Buscar dados na Thirdweb
    let thirdwebData = null;
    let thirdwebError = null;

    try {
      const contract = getContract({
        client,
        address: contractAddress,
        chain: polygonAmoy
      });

      const nftData = await getNFT({
        contract,
        tokenId: BigInt(tokenId)
      });

      thirdwebData = {
        tokenId: nftData.id.toString(),
        name: nftData.metadata.name,
        description: nftData.metadata.description,
        image: nftData.metadata.image,
        owner: nftData.owner,
        tokenURI: nftData.tokenURI,
        metadata: nftData.metadata
      };
    } catch (error: any) {
      thirdwebError = error.message;
      console.log('❌ Erro ao buscar NFT na Thirdweb:', error.message);
    }

    // 3. Comparar dados
    const comparison = {
      mongoCustomCollection: {
        exists: !!customCollection,
        name: customCollection?.name,
        category: customCollection?.category,
        description: customCollection?.description,
        imageUrl: customCollection?.imageUrl
      },
      mongoLaunchpadCollection: {
        exists: !!launchpadCollection,
        name: launchpadCollection?.name,
        category: launchpadCollection?.category,
        description: launchpadCollection?.description
      },
      mongoMints: {
        count: customMints.length,
        firstMint: customMints[0] ? {
          name: customMints[0].name,
          tokenId: customMints[0].tokenId,
          metadataUrl: customMints[0].metadataUrl,
          imageUrl: customMints[0].imageUrl
        } : null
      },
      thirdweb: {
        success: !!thirdwebData,
        error: thirdwebError,
        data: thirdwebData
      },
      issues: []
    };

    // 4. Identificar problemas
    if (thirdwebData && customMints.length > 0) {
      const firstMint = customMints[0];
      
      if (thirdwebData.name !== firstMint.name) {
        comparison.issues.push(`Nome diferente: Thirdweb="${thirdwebData.name}" vs Mongo="${firstMint.name}"`);
      }
      
      if (thirdwebData.image !== firstMint.imageUrl) {
        comparison.issues.push(`Imagem diferente: Thirdweb="${thirdwebData.image}" vs Mongo="${firstMint.imageUrl}"`);
      }
      
      if (!thirdwebData.image || thirdwebData.image.includes('undefined')) {
        comparison.issues.push('Imagem na Thirdweb está undefined ou inválida');
      }
    }

    if (!thirdwebData) {
      comparison.issues.push('NFT não encontrado na Thirdweb - possível problema de deploy ou metadata');
    }

    return NextResponse.json({
      success: true,
      contractAddress,
      tokenId,
      comparison,
      rawData: {
        customCollection,
        launchpadCollection,
        customMints: customMints.slice(0, 2), // Primeiros 2 apenas
        thirdwebData
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
