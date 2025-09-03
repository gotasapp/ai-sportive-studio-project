import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createThirdwebClient, getContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { totalSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export async function POST(request: NextRequest) {
  try {
    const { collectionId } = await request.json();
    
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // 1. Buscar coleção
    const collection = await db.collection('launchpad_collections').findOne({
      _id: new ObjectId(collectionId)
    });

    if (!collection) {
      return NextResponse.json({
        error: 'Collection not found'
      }, { status: 404 });
    }

    if (!collection.contractAddress) {
      return NextResponse.json({
        error: 'Collection has no contract address'
      }, { status: 400 });
    }

    console.log('🔍 Syncing blockchain data for:', collection.name, collection.contractAddress);

    // 2. Conectar ao contrato na blockchain
    const contract = getContract({
      client,
      chain: polygon, // ou amoy para testnet
      address: collection.contractAddress,
    });

    // 3. Buscar dados reais da blockchain
    let blockchainMinted = 0;
    let nextTokenId = 0;

    try {
      // Verificar quantos tokens foram mintados
      const totalSupplyResult = await totalSupply({ contract });
      blockchainMinted = Number(totalSupplyResult);
      
      // Verificar próximo token ID
      const nextTokenResult = await nextTokenIdToMint({ contract });
      nextTokenId = Number(nextTokenResult);
      
      console.log('📊 Blockchain data:', {
        totalSupply: blockchainMinted,
        nextTokenId: nextTokenId
      });

    } catch (blockchainError) {
      console.error('❌ Error reading blockchain:', blockchainError);
      return NextResponse.json({
        error: 'Failed to read blockchain data',
        details: blockchainError instanceof Error ? blockchainError.message : 'Unknown error'
      }, { status: 500 });
    }

    // 4. Verificar quantos NFTs temos no banco
    const dbNFTs = await db.collection('launchpad_collection_mints')
      .find({ launchpadCollectionId: collection._id })
      .toArray();

    const dbCount = dbNFTs.length;

    console.log('📊 Database vs Blockchain:', {
      dbCount,
      blockchainMinted,
      difference: blockchainMinted - dbCount
    });

    // 5. Se blockchain tem mais NFTs, criar os faltantes
    const missingNFTs = [];
    if (blockchainMinted > dbCount) {
      console.log(`🔄 Creating ${blockchainMinted - dbCount} missing NFTs...`);
      
      for (let tokenId = dbCount; tokenId < blockchainMinted; tokenId++) {
        const nftData = {
          launchpadCollectionId: collection._id,
          tokenId: tokenId,
          name: `${collection.name.trim()} #${tokenId}`,
          description: collection.description || `${collection.name} NFT`,
          imageUrl: collection.image || collection.imageUrl,
          metadataUrl: collection.image || collection.imageUrl,
          transactionHash: "synced_from_blockchain",
          minterAddress: "0x0000000000000000000000000000000000000000", // Placeholder
          price: collection.priceInMatic?.toString() || collection.price?.toString() || "0.1",
          mintedAt: new Date(),
          status: "minted",
          type: "launchpad_collection_mint",
          
          // Dados do marketplace
          marketplace: {
            isListed: false,
            listingPrice: null,
            listedAt: null,
            listingType: null
          },
          
          // Dados do criador
          creator: {
            name: collection.creator?.name || 'Admin',
            wallet: collection.creator?.wallet || "0x0000000000000000000000000000000000000000"
          },
          
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('launchpad_collection_mints').insertOne(nftData);
        missingNFTs.push(nftData);
      }
    }

    // 6. Atualizar contador minted na coleção
    if (collection.minted !== blockchainMinted) {
      await db.collection('launchpad_collections').updateOne(
        { _id: collection._id },
        { 
          $set: { 
            minted: blockchainMinted,
            updatedAt: new Date()
          } 
        }
      );
      console.log(`✅ Updated collection minted count: ${collection.minted} → ${blockchainMinted}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Blockchain sync completed',
      collection: {
        _id: collection._id,
        name: collection.name,
        contractAddress: collection.contractAddress
      },
      sync: {
        blockchainMinted,
        dbCountBefore: dbCount,
        dbCountAfter: dbCount + missingNFTs.length,
        missingNFTsCreated: missingNFTs.length,
        collectionMintedUpdated: collection.minted !== blockchainMinted
      },
      createdNFTs: missingNFTs.map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name
      }))
    });

  } catch (error: any) {
    console.error('❌ Error syncing blockchain mints:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to sync blockchain mints'
    }, { status: 500 });
  }
}

// GET para verificar diferenças sem fazer sync
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');
    
    if (!collectionId) {
      return NextResponse.json({
        error: 'collectionId parameter required'
      }, { status: 400 });
    }

    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar coleção
    const collection = await db.collection('launchpad_collections').findOne({
      _id: new ObjectId(collectionId)
    });

    if (!collection) {
      return NextResponse.json({
        error: 'Collection not found'
      }, { status: 404 });
    }

    // Contar NFTs no banco
    const dbNFTs = await db.collection('launchpad_collection_mints')
      .find({ launchpadCollectionId: collection._id })
      .toArray();

    // Tentar ler da blockchain se tem contract
    let blockchainData = null;
    if (collection.contractAddress) {
      try {
        const contract = getContract({
          client,
          chain: polygon,
          address: collection.contractAddress,
        });

        const totalSupplyResult = await totalSupply({ contract });
        const nextTokenResult = await nextTokenIdToMint({ contract });

        blockchainData = {
          totalSupply: Number(totalSupplyResult),
          nextTokenId: Number(nextTokenResult)
        };
      } catch (e) {
        blockchainData = { error: 'Failed to read blockchain' };
      }
    }

    return NextResponse.json({
      success: true,
      collection: {
        _id: collection._id,
        name: collection.name,
        contractAddress: collection.contractAddress,
        minted: collection.minted
      },
      database: {
        nftCount: dbNFTs.length,
        nfts: dbNFTs.map(nft => ({
          tokenId: nft.tokenId,
          name: nft.name,
          status: nft.status
        }))
      },
      blockchain: blockchainData,
      needsSync: blockchainData && !blockchainData.error ? 
        (blockchainData.totalSupply !== dbNFTs.length) : false
    });

  } catch (error: any) {
    console.error('❌ Error checking sync status:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check sync status'
    }, { status: 500 });
  }
}
