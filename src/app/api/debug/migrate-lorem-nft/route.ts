import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // 1. Buscar a coleção Lorem na launchpad_collections
    const loremCollection = await db.collection('launchpad_collections').findOne({
      name: { $regex: /^Lorem/i }
    });

    if (!loremCollection) {
      return NextResponse.json({
        error: 'Lorem collection not found in launchpad_collections'
      }, { status: 404 });
    }

    console.log('🔍 Found Lorem collection:', loremCollection._id, loremCollection.name);

    // 2. Verificar se já existe NFT mintado para esta coleção
    const existingNFT = await db.collection('launchpad_collection_mints').findOne({
      launchpadCollectionId: loremCollection._id
    });

    if (existingNFT) {
      return NextResponse.json({
        success: false,
        message: 'NFT already exists in launchpad_collection_mints for Lorem collection',
        existingNFT: {
          _id: existingNFT._id,
          tokenId: existingNFT.tokenId,
          name: existingNFT.name
        }
      });
    }

    // 3. Verificar se a coleção tem minted > 0
    if (!loremCollection.minted || loremCollection.minted === 0) {
      return NextResponse.json({
        success: false,
        message: 'Lorem collection has no minted NFTs (minted = 0)',
        collectionData: {
          _id: loremCollection._id,
          name: loremCollection.name,
          minted: loremCollection.minted,
          contractAddress: loremCollection.contractAddress
        }
      });
    }

    // 4. Criar entrada NFT na launchpad_collection_mints baseada no padrão Kane
    const newNFT = {
      launchpadCollectionId: loremCollection._id,
      tokenId: 0, // Primeiro NFT
      name: `${loremCollection.name.trim()} #0`,
      description: loremCollection.description || 'Lorem collection NFT',
      imageUrl: loremCollection.image || loremCollection.imageUrl,
      metadataUrl: loremCollection.image || loremCollection.imageUrl, // Usando a mesma URL por enquanto
      transactionHash: "placeholder_hash", // Placeholder como no Kane
      minterAddress: loremCollection.creator?.wallet || "0x0000000000000000000000000000000000000000",
      price: loremCollection.priceInMatic?.toString() || loremCollection.price?.toString() || "0.1",
      mintedAt: new Date(),
      status: "minted",
      type: "launchpad_collection_mint",
      
      // Dados do marketplace (padrão)
      marketplace: {
        isListed: false,
        listingPrice: null,
        listedAt: null,
        listingType: null
      },
      
      // Dados do criador
      creator: {
        name: loremCollection.creator?.name || 'Admin',
        wallet: loremCollection.creator?.wallet || "0x0000000000000000000000000000000000000000"
      },
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('launchpad_collection_mints').insertOne(newNFT);

    console.log('✅ Lorem NFT migrated to launchpad_collection_mints:', result.insertedId);

    // 5. Atualizar o minted count na coleção se necessário
    if (loremCollection.minted === 0) {
      await db.collection('launchpad_collections').updateOne(
        { _id: loremCollection._id },
        { 
          $set: { 
            minted: 1,
            updatedAt: new Date()
          } 
        }
      );
      console.log('✅ Updated Lorem collection minted count to 1');
    }

    return NextResponse.json({
      success: true,
      message: 'Lorem NFT migrated successfully to launchpad_collection_mints',
      nftData: {
        _id: result.insertedId,
        launchpadCollectionId: loremCollection._id,
        tokenId: 0,
        name: newNFT.name,
        minterAddress: newNFT.minterAddress,
        price: newNFT.price
      },
      collectionData: {
        _id: loremCollection._id,
        name: loremCollection.name,
        contractAddress: loremCollection.contractAddress,
        minted: loremCollection.minted
      }
    });

  } catch (error: any) {
    console.error('❌ Error migrating Lorem NFT:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to migrate Lorem NFT'
    }, { status: 500 });
  }
}

// GET para verificar o status da migração do NFT
export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Lorem em launchpad_collections
    const loremCollection = await db.collection('launchpad_collections').findOne({
      name: { $regex: /^Lorem/i }
    });
    
    // Buscar NFTs da Lorem em launchpad_collection_mints
    let loremNFTs: any[] = [];
    if (loremCollection) {
      loremNFTs = await db.collection('launchpad_collection_mints')
        .find({ launchpadCollectionId: loremCollection._id })
        .toArray();
    }

    return NextResponse.json({
      success: true,
      status: {
        collection: loremCollection ? {
          _id: loremCollection._id,
          name: loremCollection.name,
          contractAddress: loremCollection.contractAddress,
          minted: loremCollection.minted,
          deployed: loremCollection.deployed
        } : null,
        nfts: loremNFTs.map(nft => ({
          _id: nft._id,
          tokenId: nft.tokenId,
          name: nft.name,
          minterAddress: nft.minterAddress,
          price: nft.price,
          status: nft.status,
          mintedAt: nft.mintedAt
        })),
        nftCount: loremNFTs.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking Lorem NFT migration status:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check NFT migration status'
    }, { status: 500 });
  }
}
