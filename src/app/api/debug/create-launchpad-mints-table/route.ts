import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Criar um documento exemplo na tabela launchpad_collection_mints
    const sampleNFT = {
      launchpadCollectionId: 'placeholder', // Será substituído pela ID real da Kane
      tokenId: 0,
      name: 'Kane 2018 #0',
      description: 'Bayern Munich Kane',
      imageUrl: 'placeholder',
      transactionHash: 'placeholder',
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

    const result = await db.collection('launchpad_collection_mints').insertOne(sampleNFT);

    console.log('✅ Launchpad mints table created with sample NFT:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'launchpad_collection_mints table created successfully',
      sampleNFTId: result.insertedId,
      note: 'Table now exists and can store individual Launchpad NFTs'
    });

  } catch (error: any) {
    console.error('❌ Error creating launchpad mints table:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create launchpad mints table'
    }, { status: 500 });
  }
}
