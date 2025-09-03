import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function POST(request: NextRequest) {
  try {
    const { tokenId, listingId, transactionHash } = await request.json();
    
    if (!tokenId || !listingId) {
      return NextResponse.json(
        { error: 'tokenId and listingId are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar o NFT pelo tokenId em todas as coleções
    const collections = ['jerseys', 'stadiums', 'badges'];
    let updated = false;
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      // Tentar encontrar por tokenId ou blockchain.tokenId
      const result = await collection.updateOne(
        {
          $or: [
            { tokenId: tokenId },
            { 'blockchain.tokenId': tokenId },
            { blockchainTokenId: tokenId }
          ]
        },
        {
          $set: {
            'marketplace.listingId': listingId,
            'marketplace.isListed': true,
            'marketplace.listedAt': new Date().toISOString(),
            ...(transactionHash && { 'marketplace.transactionHash': transactionHash })
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        updated = true;
        console.log(`✅ Updated ${collectionName} NFT with tokenId ${tokenId} - listingId: ${listingId}`);
        break;
      }
    }
    
    if (!updated) {
      console.warn(`⚠️ No NFT found with tokenId ${tokenId} to update`);
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'NFT listing updated successfully',
      tokenId,
      listingId
    });
    
  } catch (error) {
    console.error('❌ Error updating NFT listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 