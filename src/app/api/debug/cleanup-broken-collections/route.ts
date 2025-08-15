import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode = 'list' } = body; // 'list' ou 'delete'

    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    if (mode === 'list') {
      // LISTAR coleções com problema de preço
      const brokenCollections = await db.collection('launchpad_collections').find({}).toArray();
      const legacyCollections = await db.collection('collections').find({
        name: { $in: ['Juventus 2006', 'Rooney 2002'] } // Adicione nomes específicos
      }).toArray();

      return NextResponse.json({
        success: true,
        brokenCollections: brokenCollections.map(c => ({
          _id: c._id,
          name: c.name,
          contractAddress: c.contractAddress,
          priceInMatic: c.priceInMatic,
          status: c.status,
          table: 'launchpad_collections'
        })),
        legacyCollections: legacyCollections.map(c => ({
          _id: c._id,
          name: c.name,
          contractAddress: c.contractAddress,
          price: c.price,
          status: c.status,
          table: 'collections'
        })),
        note: 'Use mode: "delete" para remover as selecionadas'
      });
    }

    if (mode === 'delete') {
      const { collectionIds = [] } = body;
      
      if (collectionIds.length === 0) {
        return NextResponse.json({
          error: 'Forneça collectionIds para deletar'
        }, { status: 400 });
      }

      const results = [];
      
      for (const id of collectionIds) {
        try {
          const objectId = new ObjectId(id);
          
          // Deletar da tabela launchpad_collections
          const launchpadResult = await db.collection('launchpad_collections').deleteOne({
            _id: objectId
          });
          
          // Deletar da tabela collections (caso exista)
          const collectionsResult = await db.collection('collections').deleteOne({
            _id: objectId
          });
          
          // Deletar NFTs individuais relacionadas
          const mintsResult = await db.collection('launchpad_collection_mints').deleteMany({
            launchpadCollectionId: objectId
          });

          results.push({
            collectionId: id,
            launchpadDeleted: launchpadResult.deletedCount,
            collectionsDeleted: collectionsResult.deletedCount,
            mintsDeleted: mintsResult.deletedCount
          });
          
        } catch (error: any) {
          results.push({
            collectionId: id,
            error: error?.message || 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Cleanup concluído',
        results
      });
    }

    return NextResponse.json({
      error: 'Mode deve ser "list" ou "delete"'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in cleanup:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Cleanup failed'
    }, { status: 500 });
  }
}
