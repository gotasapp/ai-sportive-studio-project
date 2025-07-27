import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 POST Fix Existing Collections - Corrigindo coleções sem campo image');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Buscar coleções que têm imageUrl mas não têm image
    const collectionsToFix = await db.collection('collections').find({
      type: 'launchpad',
      imageUrl: { $exists: true },
      $or: [
        { image: { $exists: false } },
        { image: null }
      ]
    }).toArray();
    
    console.log(`🔧 Encontradas ${collectionsToFix.length} coleções para corrigir`);
    
    if (collectionsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No collections need fixing',
        fixedCount: 0
      });
    }
    
    // Atualizar cada coleção
    let fixedCount = 0;
    for (const collection of collectionsToFix) {
      const result = await db.collection('collections').updateOne(
        { _id: collection._id },
        { 
          $set: { 
            image: collection.imageUrl,
            totalSupply: collection.maxSupply || 100
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        fixedCount++;
        console.log(`✅ Corrigida coleção: ${collection.name} (${collection._id})`);
      }
    }
    
    console.log(`✅ Total de ${fixedCount} coleções corrigidas`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} collections`,
      fixedCount,
      totalFound: collectionsToFix.length
    });
    
  } catch (error) {
    console.error('❌ Error fixing collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix collections' },
      { status: 500 }
    );
  }
} 