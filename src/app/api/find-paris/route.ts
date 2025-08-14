import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Paris na tabela antiga (collections)
    const parisInOldTable = await db.collection('collections').findOne({ 
      name: 'Paris' 
    });
    
    // Buscar Paris na tabela nova (launchpad_collections)  
    const parisInNewTable = await db.collection('launchpad_collections').findOne({ 
      name: 'Paris' 
    });
    
    // Buscar por ID que você estava usando: 688786ffa0b8e0ea539f1e43
    const parisById = await db.collection('collections').findOne({ 
      _id: new (require('mongodb').ObjectId)('688786ffa0b8e0ea539f1e43') 
    });
    
    const parisLaunchpadById = await db.collection('launchpad_collections').findOne({ 
      _id: new (require('mongodb').ObjectId)('688786ffa0b8e0ea539f1e43') 
    });
    
    return NextResponse.json({
      success: true,
      foundInOldTable: !!parisInOldTable,
      foundInNewTable: !!parisInNewTable,
      foundById: !!parisById,
      foundLaunchpadById: !!parisLaunchpadById,
      parisInOldTable: parisInOldTable ? {
        _id: parisInOldTable._id,
        name: parisInOldTable.name,
        type: parisInOldTable.type,
        status: parisInOldTable.status,
        minted: parisInOldTable.minted || 0,
        contractAddress: parisInOldTable.contractAddress
      } : null,
      parisById: parisById ? {
        _id: parisById._id,
        name: parisById.name,
        type: parisById.type,
        status: parisById.status,
        minted: parisById.minted || 0,
        contractAddress: parisById.contractAddress
      } : null
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to find Paris collection' 
    }, { status: 500 });
  }
}
