import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { MarketplaceService } from '@/lib/services/marketplace-service';

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

    if (!collection.contractAddress) {
      return NextResponse.json({
        success: true,
        collection: {
          _id: collection._id,
          name: collection.name,
          contractAddress: null,
          deployed: false
        },
        blockchain: null,
        database: {
          nftCount: 0,
          mintedInCollection: collection.minted || 0
        },
        message: 'Collection not deployed yet'
      });
    }

    console.log('🔍 Checking minted count for:', collection.name, collection.contractAddress);

    // Usar MarketplaceService para verificar blockchain
    let blockchainMinted = 0;
    let blockchainError = null;

    try {
      // Usar a função totalMinted() da Thirdweb (método correto)
      const { createThirdwebClient, getContract } = require("thirdweb");
      const { readContract } = require("thirdweb");
      const { polygonAmoy } = require("thirdweb/chains");

      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
      });

      const contract = getContract({
        client,
        chain: polygonAmoy,
        address: collection.contractAddress,
      });

      // Usar a função totalMinted() correta
      const totalMintedResult = await readContract({
        contract,
        method: "function totalMinted() view returns (uint256)",
        params: []
      });

      blockchainMinted = Number(totalMintedResult);
      
      console.log('📊 Blockchain data (totalMinted):', {
        totalMinted: blockchainMinted,
        contractAddress: collection.contractAddress
      });

    } catch (error: any) {
      console.error('❌ Error reading blockchain with totalMinted():', error);
      blockchainError = error.message;
    }

    // Contar NFTs no banco de dados
    const dbNFTs = await db.collection('launchpad_collection_mints')
      .find({ launchpadCollectionId: collection._id })
      .toArray();

    return NextResponse.json({
      success: true,
      collection: {
        _id: collection._id,
        name: collection.name,
        contractAddress: collection.contractAddress,
        deployed: collection.deployed
      },
      blockchain: blockchainError ? {
        error: blockchainError
      } : {
        totalMinted: blockchainMinted,
        message: `${blockchainMinted} NFTs foram realmente mintados na blockchain`
      },
      database: {
        nftCount: dbNFTs.length,
        mintedInCollection: collection.minted || 0,
        nfts: dbNFTs.map(nft => ({
          tokenId: nft.tokenId,
          name: nft.name,
          minterAddress: nft.minterAddress,
          status: nft.status
        }))
      },
      comparison: blockchainError ? null : {
        blockchainMinted,
        databaseNFTs: dbNFTs.length,
        collectionMinted: collection.minted || 0,
        needsSync: blockchainMinted !== dbNFTs.length,
        difference: blockchainMinted - dbNFTs.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking minted count:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check minted count'
    }, { status: 500 });
  }
}

// POST para sincronizar automaticamente
export async function POST(request: NextRequest) {
  try {
    const { collectionId } = await request.json();
    
    if (!collectionId) {
      return NextResponse.json({
        error: 'collectionId required'
      }, { status: 400 });
    }

    // Primeiro verificar diferenças
    const checkResponse = await fetch(new URL(`/api/debug/check-minted-count?collectionId=${collectionId}`, request.url));
    const checkData = await checkResponse.json();

    if (!checkData.success || !checkData.comparison || !checkData.comparison.needsSync) {
      return NextResponse.json({
        success: false,
        message: 'No sync needed or unable to check blockchain data',
        checkData
      });
    }

    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    const collection = checkData.collection;
    const blockchainMinted = checkData.comparison.blockchainMinted;
    const currentDBCount = checkData.comparison.databaseNFTs;

    // Criar NFTs faltantes
    const missingNFTs = [];
    for (let tokenId = currentDBCount; tokenId < blockchainMinted; tokenId++) {
      const nftData = {
        launchpadCollectionId: new ObjectId(collection._id),
        tokenId: tokenId,
        name: `${collection.name.trim()} #${tokenId}`,
        description: `${collection.name} NFT #${tokenId}`,
        imageUrl: checkData.database.nfts[0]?.imageUrl || "placeholder.jpg",
        metadataUrl: checkData.database.nfts[0]?.imageUrl || "placeholder.jpg",
        transactionHash: "synced_from_blockchain",
        minterAddress: "0x0000000000000000000000000000000000000000",
        price: "0.1",
        mintedAt: new Date(),
        status: "minted",
        type: "launchpad_collection_mint",
        
        marketplace: {
          isListed: false,
          listingPrice: null,
          listedAt: null,
          listingType: null
        },
        
        creator: {
          name: 'Admin',
          wallet: "0x0000000000000000000000000000000000000000"
        },
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('launchpad_collection_mints').insertOne(nftData);
      missingNFTs.push({
        tokenId: nftData.tokenId,
        name: nftData.name
      });
    }

    // Atualizar contador na coleção
    await db.collection('launchpad_collections').updateOne(
      { _id: new ObjectId(collection._id) },
      { 
        $set: { 
          minted: blockchainMinted,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: `Synced ${missingNFTs.length} missing NFTs from blockchain`,
      collection: {
        _id: collection._id,
        name: collection.name
      },
      sync: {
        blockchainMinted,
        previousDBCount: currentDBCount,
        newDBCount: currentDBCount + missingNFTs.length,
        createdNFTs: missingNFTs
      }
    });

  } catch (error: any) {
    console.error('❌ Error syncing minted count:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to sync minted count'
    }, { status: 500 });
  }
}
