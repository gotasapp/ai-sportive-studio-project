import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Nomes específicos que vemos no print da página Launchpad
    const namesToFind = [
      'Rashford 2018',
      'Jersey Fluminense', 
      'Jersey NFL',
      'Fluminense',
      'NFL'
    ];
    
    // Buscar em ambas as tabelas
    const foundCollections = [];
    
    // Buscar na tabela launchpad_collections
    for (const name of namesToFind) {
      const launchpadResults = await db.collection('launchpad_collections').find({
        name: { $regex: new RegExp(name, 'i') }
      }).toArray();
      
      launchpadResults.forEach(c => {
        foundCollections.push({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          table: 'launchpad_collections',
          searchTerm: name
        });
      });
    }
    
    // Buscar na tabela collections
    for (const name of namesToFind) {
      const collectionsResults = await db.collection('collections').find({
        name: { $regex: new RegExp(name, 'i') }
      }).toArray();
      
      collectionsResults.forEach(c => {
        foundCollections.push({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          table: 'collections',
          searchTerm: name
        });
      });
    }
    
    // Remover duplicatas e Kane
    const uniqueCollections = foundCollections.filter((collection, index, self) => {
      const isUnique = index === self.findIndex(c => c._id.toString() === collection._id.toString());
      const isNotKane = !collection.name?.includes('Kane');
      return isUnique && isNotKane;
    });

    return NextResponse.json({
      success: true,
      note: "Coleções encontradas pelos nomes do print da página Launchpad",
      searchTerms: namesToFind,
      foundCollections: uniqueCollections,
      total: uniqueCollections.length,
      readyToDelete: uniqueCollections.map(c => c._id)
    });

  } catch (error: any) {
    console.error('❌ Error finding collections by names:', error);
    return NextResponse.json({
      error: error.message || 'Failed to find collections'
    }, { status: 500 });
  }
}

import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Nomes específicos que vemos no print da página Launchpad
    const namesToFind = [
      'Rashford 2018',
      'Jersey Fluminense', 
      'Jersey NFL',
      'Fluminense',
      'NFL'
    ];
    
    // Buscar em ambas as tabelas
    const foundCollections = [];
    
    // Buscar na tabela launchpad_collections
    for (const name of namesToFind) {
      const launchpadResults = await db.collection('launchpad_collections').find({
        name: { $regex: new RegExp(name, 'i') }
      }).toArray();
      
      launchpadResults.forEach(c => {
        foundCollections.push({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          table: 'launchpad_collections',
          searchTerm: name
        });
      });
    }
    
    // Buscar na tabela collections
    for (const name of namesToFind) {
      const collectionsResults = await db.collection('collections').find({
        name: { $regex: new RegExp(name, 'i') }
      }).toArray();
      
      collectionsResults.forEach(c => {
        foundCollections.push({
          _id: c._id,
          name: c.name,
          status: c.status,
          contractAddress: c.contractAddress,
          table: 'collections',
          searchTerm: name
        });
      });
    }
    
    // Remover duplicatas e Kane
    const uniqueCollections = foundCollections.filter((collection, index, self) => {
      const isUnique = index === self.findIndex(c => c._id.toString() === collection._id.toString());
      const isNotKane = !collection.name?.includes('Kane');
      return isUnique && isNotKane;
    });

    return NextResponse.json({
      success: true,
      note: "Coleções encontradas pelos nomes do print da página Launchpad",
      searchTerms: namesToFind,
      foundCollections: uniqueCollections,
      total: uniqueCollections.length,
      readyToDelete: uniqueCollections.map(c => c._id)
    });

  } catch (error: any) {
    console.error('❌ Error finding collections by names:', error);
    return NextResponse.json({
      error: error.message || 'Failed to find collections'
    }, { status: 500 });
  }
}
