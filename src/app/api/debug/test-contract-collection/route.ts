import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';
const CONTRACT_ADDRESS = '0x2324b3f6792aE038Ef7E0B7b62097f81e0d79Cf8';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing contract collection:', CONTRACT_ADDRESS);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Test 1: Find collection by contract address
    const collectionByContract = await db.collection('launchpad_collections').findOne({
      contractAddress: CONTRACT_ADDRESS
    });
    
    // Test 2: Find any collections with similar contract
    const similarCollections = await db.collection('launchpad_collections').find({
      contractAddress: { $regex: CONTRACT_ADDRESS.slice(-10), $options: 'i' }
    }).toArray();
    
    // Test 3: Find minted NFTs for this contract
    const mintedNFTs = await db.collection('launchpad_collection_mints').find({
      contractAddress: CONTRACT_ADDRESS
    }).toArray();
    
    // Test 4: Recent collections
    const recentCollections = await db.collection('launchpad_collections')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    // Test 5: Check if contract exists in any format
    const allCollections = await db.collection('launchpad_collections').find({}).toArray();
    const hasContract = allCollections.filter(c => 
      c.contractAddress && c.contractAddress.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
    );
    
    return NextResponse.json({
      success: true,
      targetContract: CONTRACT_ADDRESS,
      tests: {
        exactMatch: !!collectionByContract,
        collection: collectionByContract,
        similarCount: similarCollections.length,
        similar: similarCollections.map(c => ({ 
          _id: c._id, 
          name: c.name, 
          contractAddress: c.contractAddress,
          status: c.status,
          deployed: c.deployed 
        })),
        mintedNFTsCount: mintedNFTs.length,
        mintedNFTs: mintedNFTs.slice(0, 3), // First 3
        recentCollections: recentCollections.map(c => ({ 
          _id: c._id, 
          name: c.name, 
          contractAddress: c.contractAddress,
          status: c.status,
          deployed: c.deployed,
          createdAt: c.createdAt
        })),
        hasContractInAnyFormat: hasContract.length,
        totalCollections: allCollections.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing contract collection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
