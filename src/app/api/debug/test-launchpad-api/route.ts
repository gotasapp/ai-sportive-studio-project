import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { VISIBLE_LAUNCHPAD_STATUSES } from '@/lib/collection-config';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Launchpad API - Looking for Kane collection');
    console.log('📋 VISIBLE_LAUNCHPAD_STATUSES:', VISIBLE_LAUNCHPAD_STATUSES);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Test 1: Find Kane specifically
    const kaneCollection = await db.collection('launchpad_collections').findOne({
      name: { $regex: 'Kane', $options: 'i' }
    });
    
    // Test 2: Find all deployed collections
    const deployedCollections = await db.collection('launchpad_collections').find({
      deployed: true
    }).toArray();
    
    // Test 3: Find collections with visible status
    const visibleCollections = await db.collection('launchpad_collections').find({
      deployed: true,
      status: { $in: VISIBLE_LAUNCHPAD_STATUSES }
    }).toArray();
    
    // Test 4: Find active collections specifically
    const activeCollections = await db.collection('launchpad_collections').find({
      deployed: true,
      status: 'active'
    }).toArray();
    
    return NextResponse.json({
      success: true,
      tests: {
        kaneFound: !!kaneCollection,
        kane: kaneCollection,
        deployedCount: deployedCollections.length,
        visibleCount: visibleCollections.length,
        activeCount: activeCollections.length
      },
      deployed: deployedCollections.map(c => ({ 
        _id: c._id, 
        name: c.name, 
        status: c.status, 
        deployed: c.deployed 
      })),
      visible: visibleCollections.map(c => ({ 
        _id: c._id, 
        name: c.name, 
        status: c.status, 
        deployed: c.deployed 
      })),
      active: activeCollections.map(c => ({ 
        _id: c._id, 
        name: c.name, 
        status: c.status, 
        deployed: c.deployed 
      }))
    });
    
  } catch (error) {
    console.error('❌ Error testing launchpad API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
