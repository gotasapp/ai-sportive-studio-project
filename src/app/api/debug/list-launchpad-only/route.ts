import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongo = await connectToDatabase();
    const db = mongo.db('chz-app-db');
    
    // Buscar APENAS coleções que aparecem na PÁGINA LAUNCHPAD
    // Estas são as que estão no print que você mostrou
    const launchpadPageCollections = await db.collection('launchpad_collections').find({}).toArray();
    
    // Separar Kane (que funciona) das outras
    const kaneCollection = launchpadPageCollections.find(c => c.name?.includes('Kane'));
    const otherCollections = launchpadPageCollections.filter(c => !c.name?.includes('Kane'));

    return NextResponse.json({
      success: true,
      note: "APENAS coleções da PÁGINA LAUNCHPAD - não deleta nada do resto do app",
      summary: {
        totalInLaunchpadPage: launchpadPageCollections.length,
        kaneToKeep: kaneCollection ? 1 : 0,
        othersToDelete: otherCollections.length
      },
      kaneToKeep: kaneCollection ? {
        _id: kaneCollection._id,
        name: kaneCollection.name,
        status: kaneCollection.status,
        contractAddress: kaneCollection.contractAddress
      } : null,
      othersToDelete: otherCollections.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        contractAddress: c.contractAddress,
        note: `Esta aparece no print da página Launchpad`
      })),
      safetyNote: "Este comando SÓ afeta a página Launchpad, não o resto do marketplace"
    });

  } catch (error: any) {
    console.error('❌ Error listing launchpad collections:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to list launchpad collections'
    }, { status: 500 });
  }
}
