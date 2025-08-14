import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      collectionId,
      tokenId,
      transactionHash,
      minterAddress,
      price
    } = body;

    // Validate required fields
    if (!collectionId || tokenId === undefined || !transactionHash || !minterAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: collectionId, tokenId, transactionHash, minterAddress'
      }, { status: 400 });
    }

    // Connect to database
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db('chz-app-db');
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(collectionId);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid collection ID format'
      }, { status: 400 });
    }

    // Get collection data for metadata
    const collection = await db.collection('launchpad_collections').findOne({ _id: objectId });
    
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Launchpad collection not found'
      }, { status: 404 });
    }

    // Create individual NFT document (similar to custom collections structure)
    const nftData = {
      // Basic data (like legacy/custom collections)
      name: `${collection.name} #${tokenId}`,
      tokenId: tokenId.toString(),
      contractAddress: collection.contractAddress,
      transactionHash,
      owner: minterAddress,
      creatorWallet: minterAddress,
      status: 'Approved',
      isMinted: true,
      mintStatus: 'confirmed',
      
      // Metadata (same as collection - launchpad characteristic)
      metadata: {
        name: `${collection.name} #${tokenId}`,
        description: collection.description,
        image: collection.image
      },
      imageUrl: collection.image,
      metadataUrl: collection.image, // In launchpad, all NFTs have same metadata
      
      // Marketplace structure (copying legacy format)
      marketplace: {
        isListed: false,
        isListable: true,
        canTrade: true,
        verified: true,
        collection: collection.name,
        category: collection.category || 'launchpad'
      },
      
      // Creator info
      creator: {
        wallet: minterAddress
      },
      
      // Launchpad collection specifics
      launchpadCollectionId: objectId,
      minterAddress,
      category: collection.category || 'launchpad',
      price: price || collection.price || "0",
      mintedAt: new Date(),
      type: 'launchpad_collection_mint',
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save NFT to database (similar to custom_collection_mints)
    await db.collection('launchpad_collection_mints').insertOne(nftData);

    console.log('✅ Launchpad NFT saved to database:', {
      collectionId,
      tokenId,
      transactionHash,
      nftName: nftData.name
    });

    return NextResponse.json({
      success: true,
      message: 'Launchpad NFT saved successfully',
      tokenId,
      transactionHash,
      nftName: nftData.name
    });

  } catch (error: any) {
    console.error('❌ Error saving launchpad NFT:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save launchpad NFT'
    }, { status: 500 });
  }
}
