import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // ID da coleção Kane 2018 migrada
    const kaneCollectionId = new ObjectId('689e70b34341ccf79a223460');
    
    // Remover o NFT placeholder primeiro
    await db.collection('launchpad_collection_mints').deleteOne({
      launchpadCollectionId: 'placeholder'
    });

    // Criar a NFT real que você mintou
    const realNFT = {
      launchpadCollectionId: kaneCollectionId,
      tokenId: 0, // Primeiro token mintado
      name: 'Kane 2018 #0',
      description: 'Bayern Munich Kane',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1755207942/jerseys/launchpad_1755207938990.png',
      metadataUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1755207942/jerseys/launchpad_1755207938990.png',
      transactionHash: 'placeholder_hash', // Você pode pegar o hash real da transação
      minterAddress: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
      price: '0.1',
      mintedAt: new Date(),
      status: 'minted',
      type: 'launchpad_collection_mint',
      marketplace: {
        isListed: false,
        isListable: true,
        canTrade: true,
        verified: true,
        collection: 'Kane 2018',
        category: 'jersey',
        contractAddress: '0x740Ee04645e6F5D59cF76AaF4C60fa3c865835A8'
      },
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Admin'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('launchpad_collection_mints').insertOne(realNFT);

    console.log('✅ Kane 2018 NFT #0 created:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'Kane 2018 NFT #0 created successfully',
      nftId: result.insertedId,
      collectionId: kaneCollectionId,
      nftData: realNFT
    });

  } catch (error: any) {
    console.error('❌ Error creating Kane NFT:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create Kane NFT'
    }, { status: 500 });
  }
}
