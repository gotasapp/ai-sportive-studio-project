import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar Paris na tabela antiga
    const parisInOldTable = await db.collection('collections').findOne({ 
      _id: new (require('mongodb').ObjectId)('688786ffa0b8e0ea539f1e43') 
    });
    
    if (!parisInOldTable) {
      return NextResponse.json({ 
        success: false, 
        error: 'Paris collection not found in old table' 
      }, { status: 404 });
    }
    
    // Verificar se já existe na nova tabela
    const existsInNewTable = await db.collection('launchpad_collections').findOne({ 
      _id: parisInOldTable._id 
    });
    
    if (existsInNewTable) {
      return NextResponse.json({ 
        success: false, 
        error: 'Collection already exists in launchpad_collections' 
      });
    }
    
    // Migrar para a nova tabela com o mesmo _id
    const migrationData = {
      _id: parisInOldTable._id,
      name: parisInOldTable.name || 'Paris',
      description: parisInOldTable.description || 'Paris Collection from Launchpad',
      image: parisInOldTable.image || parisInOldTable.imageUrl,
      status: 'approved', // Forçar status aprovado
      minted: 3, // Baseado nas transações que vimos
      totalSupply: parisInOldTable.totalSupply || 100,
      contractAddress: parisInOldTable.contractAddress || '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639',
      creator: parisInOldTable.creator || { name: 'Admin', wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56' },
      createdAt: parisInOldTable.createdAt || new Date(),
      updatedAt: new Date(),
      // 🎯 DEPLOYMENT STATUS
      deployed: true, // Coleção já tem contrato, então está deployada
      // Campos específicos do launchpad
      price: '0.001 MATIC',
      category: 'jersey',
      mintStages: [
        {
          name: 'Public Sale',
          price: '0.001',
          maxSupplyPerPhase: 100,
          walletLimit: 10,
          startTime: new Date().toISOString()
        }
      ]
    };
    
    const result = await db.collection('launchpad_collections').insertOne(migrationData);
    
    return NextResponse.json({
      success: true,
      message: 'Paris collection migrated successfully',
      insertedId: result.insertedId,
      migrationData: {
        _id: migrationData._id,
        name: migrationData.name,
        status: migrationData.status,
        minted: migrationData.minted,
        contractAddress: migrationData.contractAddress
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to migrate collection' 
    }, { status: 500 });
  }
}
