import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar a coleção "Jersey for Launchpad"
    const collection = await db.collection('launchpad_collections').findOne({
      name: { $regex: /Jersey for Launchpad/i }
    });
    
    if (!collection) {
      return NextResponse.json({
        success: false,
        error: 'Collection not found'
      }, { status: 404 });
    }
    
    // Buscar NFTs mintadas desta coleção
    const mintedNFTs = await db.collection('launchpad_collection_mints').find({
      collectionId: collection._id
    }).toArray();
    
    const mintedCount = mintedNFTs.length;
    
    // Atualizar a coleção com o campo minted
    const result = await db.collection('launchpad_collections').updateOne(
      { _id: collection._id },
      { 
        $set: { 
          minted: mintedCount,
          updatedAt: new Date()
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        collectionId: collection._id,
        collectionName: collection.name,
        mintedCount: mintedCount,
        totalSupply: collection.totalSupply,
        updated: result.modifiedCount > 0,
        mintedNFTs: mintedNFTs.map(nft => ({
          tokenId: nft.tokenId,
          owner: nft.owner,
          mintedAt: nft.mintedAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Error updating launchpad collection:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
