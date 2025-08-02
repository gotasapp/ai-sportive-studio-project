import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      collectionId,
      tokenId,
      metadataUrl,
      imageUrl,
      transactionHash,
      minterAddress,
      price
    } = body;

    // Validate required fields
    if (!collectionId || !tokenId || !metadataUrl || !imageUrl || !transactionHash || !minterAddress) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Create minted NFT document
    const mintedNFT = {
      collectionId,
      tokenId,
      metadataUrl,
      imageUrl,
      transactionHash,
      minterAddress,
      price: price || "0",
      mintedAt: new Date(),
      status: 'minted',
      type: 'launchpad'
    };

    // Save to database
    const result = await db.collection('minted_launchpad_nfts').insertOne(mintedNFT);

    console.log('✅ Minted NFT saved to database:', {
      collectionId,
      tokenId,
      transactionHash
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      tokenId,
      transactionHash
    });

  } catch (error: any) {
    console.error('❌ Error saving minted NFT:', error);
    return NextResponse.json({
      error: error.message || 'Failed to save minted NFT'
    }, { status: 500 });
  }
}