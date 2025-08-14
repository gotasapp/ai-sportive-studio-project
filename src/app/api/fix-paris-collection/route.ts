import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar coleção Paris
    const parisCollection = await db.collection('launchpad_collections').findOne({ 
      name: 'Paris' 
    });
    
    if (!parisCollection) {
      return NextResponse.json({ 
        success: false, 
        error: 'Collection Paris not found' 
      }, { status: 404 });
    }
    
    // Forçar atualização do campo minted para 3 (baseado nas transações que vimos)
    const updateResult = await db.collection('launchpad_collections').updateOne(
      { _id: parisCollection._id },
      { 
        $set: { 
          minted: 3,
          status: 'active',
          updatedAt: new Date()
        } 
      }
    );
    
    // Buscar dados atualizados
    const updatedCollection = await db.collection('launchpad_collections').findOne({ 
      _id: parisCollection._id 
    });
    
    return NextResponse.json({
      success: true,
      message: 'Collection Paris updated successfully',
      updateResult: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      },
      before: {
        minted: parisCollection.minted || 0,
        status: parisCollection.status
      },
      after: {
        minted: updatedCollection?.minted || 0,
        status: updatedCollection?.status
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to update collection' 
    }, { status: 500 });
  }
}
