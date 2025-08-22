import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar todas as coleções na launchpad_collections
    const launchpadCollections = await db.collection('launchpad_collections').find({}).toArray();
    
    // Buscar especificamente por "Jersey for Launchpad"
    const jerseyForLaunchpad = await db.collection('launchpad_collections').find({
      name: { $regex: /Jersey for Launchpad/i }
    }).toArray();
    
    // Buscar por status active
    const activeCollections = await db.collection('launchpad_collections').find({
      status: 'active'
    }).toArray();
    
    // Buscar coleções com minted > 0 (como a função getLaunchpadNFTs faz)
    const collectionsWithMinted = await db.collection('launchpad_collections').find({
      status: { $in: ['active', 'upcoming', 'approved'] },
      minted: { $gt: 0 }
    }).toArray();
    
    return NextResponse.json({
      success: true,
      data: {
        totalCollections: launchpadCollections.length,
        allCollections: launchpadCollections.map(c => ({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          deployed: c.deployed,
          minted: c.minted,
          totalSupply: c.totalSupply,
          createdAt: c.createdAt
        })),
        jerseyForLaunchpad: jerseyForLaunchpad.map(c => ({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          deployed: c.deployed,
          minted: c.minted,
          totalSupply: c.totalSupply,
          createdAt: c.createdAt
        })),
        activeCollections: activeCollections.map(c => ({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          deployed: c.deployed,
          minted: c.minted,
          totalSupply: c.totalSupply,
          createdAt: c.createdAt
        })),
        collectionsWithMinted: collectionsWithMinted.map(c => ({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          deployed: c.deployed,
          minted: c.minted,
          totalSupply: c.totalSupply,
          createdAt: c.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Error checking launchpad collections:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 