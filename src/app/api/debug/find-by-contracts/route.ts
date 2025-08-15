import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Contratos globais antigos que precisam ser limpos
    const oldContracts = [
      '0x4796f84C8209be4674725f4a8f0004EbB262af09',
      '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639'
    ];
    
    const foundCollections: any[] = [];
    
    // Buscar em ambas as tabelas por esses contratos
    for (const contract of oldContracts) {
      // Buscar na tabela launchpad_collections
      const launchpadResults = await db.collection('launchpad_collections').find({
        contractAddress: contract
      }).toArray();
      
      launchpadResults.forEach(c => {
        foundCollections.push({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          priceInMatic: c.priceInMatic,
          table: 'launchpad_collections',
          reason: 'Usando contrato global antigo'
        });
      });
      
      // Buscar na tabela collections
      const collectionsResults = await db.collection('collections').find({
        contractAddress: contract
      }).toArray();
      
      collectionsResults.forEach(c => {
        foundCollections.push({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          price: c.price,
          table: 'collections',
          reason: 'Usando contrato global antigo'
        });
      });
    }
    
    // Buscar coleções SEM contrato definido mas aprovadas
    const noContractCollections = await db.collection('collections').find({
      $or: [
        { contractAddress: { $exists: false } },
        { contractAddress: "" },
        { contractAddress: null }
      ],
      status: { $in: ['active', 'approved', 'upcoming'] }
    }).toArray();
    
    noContractCollections.forEach(c => {
      foundCollections.push({
        _id: c._id,
        name: c.name,
        status: c.status,
        contractAddress: c.contractAddress || 'UNDEFINED',
        table: 'collections',
        reason: 'Sem contrato definido mas aprovada'
      });
    });
    
    // Filtrar Kane (manter)
    const toDelete = foundCollections.filter(c => !c.name?.includes('Kane'));

    return NextResponse.json({
      success: true,
      note: "Coleções antigas com contratos globais ou sem contrato - precisam ser limpas",
      searchedContracts: oldContracts,
      foundToDelete: toDelete,
      total: toDelete.length,
      summary: {
        withOldContracts: toDelete.filter(c => oldContracts.includes(c.contractAddress)).length,
        withoutContract: toDelete.filter(c => c.contractAddress === 'UNDEFINED').length
      },
      readyToDeleteIds: toDelete.map(c => c._id)
    });

  } catch (error: any) {
    console.error('❌ Error finding collections by contracts:', error);
    return NextResponse.json({
      error: error.message || 'Failed to find collections'
    }, { status: 500 });
  }
}
