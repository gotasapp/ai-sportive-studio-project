import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar todas as listagens ativas
    const activeListings = await db.collection('marketplace_listings').find({
      status: 'active'
    }).toArray();
    
    // Buscar especificamente por listagens da coleção "Jersey for Launchpad"
    const jerseyListings = await db.collection('marketplace_listings').find({
      collectionName: { $regex: /Jersey for Launchpad/i }
    }).toArray();
    
    // Buscar por contractAddress da coleção
    const contractListings = await db.collection('marketplace_listings').find({
      contractAddress: '0xe02c827eF37d310e850eC668e98fA8C5BF6373c9'
    }).toArray();
    
    // Buscar por tokenId 0 (primeira NFT da coleção)
    const tokenIdListings = await db.collection('marketplace_listings').find({
      tokenId: '0'
    }).toArray();
    
    return NextResponse.json({
      success: true,
      data: {
        totalActiveListings: activeListings.length,
        jerseyListings: jerseyListings.length,
        contractListings: contractListings.length,
        tokenIdListings: tokenIdListings.length,
        
        allActiveListings: activeListings.map(listing => ({
          _id: listing._id,
          listingId: listing.listingId,
          tokenId: listing.tokenId,
          contractAddress: listing.contractAddress,
          collectionName: listing.collectionName,
          price: listing.price,
          status: listing.status,
          createdAt: listing.createdAt,
          seller: listing.seller
        })),
        
        jerseyListingsData: jerseyListings.map(listing => ({
          _id: listing._id,
          listingId: listing.listingId,
          tokenId: listing.tokenId,
          contractAddress: listing.contractAddress,
          collectionName: listing.collectionName,
          price: listing.price,
          status: listing.status,
          createdAt: listing.createdAt,
          seller: listing.seller
        })),
        
        contractListingsData: contractListings.map(listing => ({
          _id: listing._id,
          listingId: listing.listingId,
          tokenId: listing.tokenId,
          contractAddress: listing.contractAddress,
          collectionName: listing.collectionName,
          price: listing.price,
          status: listing.status,
          createdAt: listing.createdAt,
          seller: listing.seller
        })),
        
        tokenIdListingsData: tokenIdListings.map(listing => ({
          _id: listing._id,
          listingId: listing.listingId,
          tokenId: listing.tokenId,
          contractAddress: listing.contractAddress,
          collectionName: listing.collectionName,
          price: listing.price,
          status: listing.status,
          createdAt: listing.createdAt,
          seller: listing.seller
        }))
      }
    });
  } catch (error: any) {
    console.error('Error checking marketplace listings:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
