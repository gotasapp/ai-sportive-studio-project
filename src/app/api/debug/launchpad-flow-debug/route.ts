import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'chz-app-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGGING LAUNCHPAD FLOW - Investigando onde estão as coleções');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 1. Verificar todas as tabelas possíveis onde coleções podem estar
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // 2. Buscar em launchpad_collections
    const launchpadCollections = await db.collection('launchpad_collections')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // 3. Buscar em collections (tabela antiga)
    const oldCollections = await db.collection('collections')
      .find({ type: 'launchpad' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // 4. Buscar qualquer coleção com o contrato específico
    const contractAddress = '0x2324b3f6792aE038Ef7E0B7b62097f81e0d79Cf8';
    
    const collectionWithContract = await db.collection('launchpad_collections').findOne({
      contractAddress: { $regex: contractAddress.slice(-8), $options: 'i' }
    });
    
    const oldCollectionWithContract = await db.collection('collections').findOne({
      contractAddress: { $regex: contractAddress.slice(-8), $options: 'i' }
    });
    
    // 5. Verificar NFTs mintados
    const mintedNFTs = await db.collection('launchpad_collection_mints')
      .find({})
      .sort({ mintedAt: -1 })
      .limit(5)
      .toArray();
    
    // 6. Verificar se há coleções criadas hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCollections = await db.collection('launchpad_collections')
      .find({ createdAt: { $gte: today } })
      .toArray();
    
    const todayOldCollections = await db.collection('collections')
      .find({ 
        type: 'launchpad',
        createdAt: { $gte: today } 
      })
      .toArray();
    
    // 7. Buscar por qualquer coleção deployada recentemente
    const recentDeployed = await db.collection('launchpad_collections')
      .find({ deployed: true })
      .sort({ deployedAt: -1 })
      .limit(5)
      .toArray();
    
    return NextResponse.json({
      success: true,
      debug: {
        availableCollections: collections.map(c => c.name),
        
        launchpadCollections: {
          count: launchpadCollections.length,
          recent: launchpadCollections.map(c => ({
            _id: c._id,
            name: c.name,
            contractAddress: c.contractAddress,
            status: c.status,
            deployed: c.deployed,
            createdAt: c.createdAt,
            deployedAt: c.deployedAt
          }))
        },
        
        oldCollections: {
          count: oldCollections.length,
          recent: oldCollections.map(c => ({
            _id: c._id,
            name: c.name,
            contractAddress: c.contractAddress,
            status: c.status,
            deployed: c.deployed,
            createdAt: c.createdAt
          }))
        },
        
        targetContract: {
          address: contractAddress,
          foundInLaunchpad: !!collectionWithContract,
          foundInOld: !!oldCollectionWithContract,
          launchpadCollection: collectionWithContract,
          oldCollection: oldCollectionWithContract
        },
        
        mintedNFTs: {
          count: mintedNFTs.length,
          recent: mintedNFTs.map(nft => ({
            _id: nft._id,
            name: nft.name,
            tokenId: nft.tokenId,
            contractAddress: nft.contractAddress,
            mintedAt: nft.mintedAt,
            minterAddress: nft.minterAddress
          }))
        },
        
        todayActivity: {
          newLaunchpadCollections: todayCollections.length,
          newOldCollections: todayOldCollections.length,
          launchpadToday: todayCollections.map(c => ({
            name: c.name,
            contractAddress: c.contractAddress,
            createdAt: c.createdAt
          })),
          oldToday: todayOldCollections.map(c => ({
            name: c.name,
            contractAddress: c.contractAddress,
            createdAt: c.createdAt
          }))
        },
        
        recentDeployments: recentDeployed.map(c => ({
          _id: c._id,
          name: c.name,
          contractAddress: c.contractAddress,
          deployed: c.deployed,
          deployedAt: c.deployedAt,
          status: c.status
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging launchpad flow:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
