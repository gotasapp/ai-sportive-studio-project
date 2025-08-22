import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar todas as NFTs mintadas na launchpad_collection_mints
    const allMints = await db.collection('launchpad_collection_mints').find({}).toArray();
    
    // Buscar a coleção "Jersey for Launchpad"
    const collection = await db.collection('launchpad_collections').findOne({
      name: { $regex: /Jersey for Launchpad/i }
    });
    
    // Buscar NFTs mintadas desta coleção específica (tentando diferentes campos)
    const mintsByCollectionId = collection ? await db.collection('launchpad_collection_mints').find({
      collectionId: collection._id
    }).toArray() : [];
    
    const mintsByCollectionIdString = collection ? await db.collection('launchpad_collection_mints').find({
      collectionId: collection._id.toString()
    }).toArray() : [];
    
    const mintsByContractAddress = collection ? await db.collection('launchpad_collection_mints').find({
      contractAddress: collection.contractAddress
    }).toArray() : [];
    
    const mintsByCollectionName = collection ? await db.collection('launchpad_collection_mints').find({
      collectionName: { $regex: /Jersey for Launchpad/i }
    }).toArray() : [];
    
    return NextResponse.json({
      success: true,
      data: {
        totalMints: allMints.length,
        collection: collection ? {
          _id: collection._id,
          name: collection.name,
          contractAddress: collection.contractAddress,
          minted: collection.minted
        } : null,
        mintsByCollectionId: mintsByCollectionId.length,
        mintsByCollectionIdString: mintsByCollectionIdString.length,
        mintsByContractAddress: mintsByContractAddress.length,
        mintsByCollectionName: mintsByCollectionName.length,
        allMints: allMints.map(mint => ({
          _id: mint._id,
          collectionId: mint.collectionId,
          collectionName: mint.collectionName,
          contractAddress: mint.contractAddress,
          tokenId: mint.tokenId,
          owner: mint.owner,
          minterAddress: mint.minterAddress,
          mintedAt: mint.mintedAt
        })),
        mintsByCollectionIdData: mintsByCollectionId.map(mint => ({
          _id: mint._id,
          collectionId: mint.collectionId,
          collectionName: mint.collectionName,
          contractAddress: mint.contractAddress,
          tokenId: mint.tokenId,
          owner: mint.owner,
          minterAddress: mint.minterAddress,
          mintedAt: mint.mintedAt
        })),
        mintsByContractAddressData: mintsByContractAddress.map(mint => ({
          _id: mint._id,
          collectionId: mint.collectionId,
          collectionName: mint.collectionName,
          contractAddress: mint.contractAddress,
          tokenId: mint.tokenId,
          owner: mint.owner,
          minterAddress: mint.minterAddress,
          mintedAt: mint.mintedAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Error checking launchpad mints:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
