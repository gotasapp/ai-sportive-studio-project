import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ACTIVE_NETWORK } from '@/lib/network-config';

const DB_NAME = 'chz-app-db';

/**
 * API para limpar todos os dados que não são da rede CHZ
 * Remove NFTs, coleções e outros dados de redes antigas (Polygon Amoy)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of non-CHZ data...');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const results: any = {
      jerseys: { deleted: 0, kept: 0, examplesKept: 0 },
      stadiums: { deleted: 0, kept: 0, examplesKept: 0 },
      badges: { deleted: 0, kept: 0, examplesKept: 0 },
      custom_collections: { deleted: 0, kept: 0, examplesKept: 0 },
      custom_collection_mints: { deleted: 0, kept: 0, examplesKept: 0 },
      launchpad_collections: { deleted: 0, kept: 0, examplesKept: 0 },
      launchpad_collection_mints: { deleted: 0, kept: 0, examplesKept: 0 },
      minted_launchpad_nfts: { deleted: 0, kept: 0, examplesKept: 0 }
    };

    // 🎯 CHZ Chain ID
    const CHZ_CHAIN_ID = 88888;
    
    console.log(`🎯 Cleaning data - keeping only CHZ Chain (${CHZ_CHAIN_ID})`);

    // 1. Limpar NFTs individuais (jerseys, stadiums, badges) - MANTER 1 EXEMPLO
    const collections = ['jerseys', 'stadiums', 'badges'];
    
    for (const collectionName of collections) {
      console.log(`🧹 Cleaning ${collectionName}...`);
      
      // Contar antes da limpeza
      const totalBefore = await db.collection(collectionName).countDocuments();
      
      // 🎯 MANTER 1 EXEMPLO de cada tipo antes de limpar
      const nonChzItems = await db.collection(collectionName).find({
        $or: [
          { chainId: { $ne: CHZ_CHAIN_ID } }, // Não é CHZ
          { chainId: { $exists: false } }, // Não tem chainId (antigo)
          { network: { $ne: 'Chiliz Chain' } }, // Não é Chiliz Chain
          { network: { $exists: false } } // Não tem network (antigo)
        ]
      }).limit(1).toArray();
      
      if (nonChzItems.length > 0) {
        console.log(`📋 Keeping 1 example from ${collectionName}:`, {
          id: nonChzItems[0]._id,
          name: nonChzItems[0].name || nonChzItems[0].title,
          chainId: nonChzItems[0].chainId,
          network: nonChzItems[0].network
        });
      }
      
      // Deletar NFTs que não são da rede CHZ (exceto o exemplo mantido)
      const deleteResult = await db.collection(collectionName).deleteMany({
        $or: [
          { chainId: { $ne: CHZ_CHAIN_ID } }, // Não é CHZ
          { chainId: { $exists: false } }, // Não tem chainId (antigo)
          { network: { $ne: 'Chiliz Chain' } }, // Não é Chiliz Chain
          { network: { $exists: false } } // Não tem network (antigo)
        ],
        // 🚫 EXCLUIR o exemplo que queremos manter
        _id: { $nin: nonChzItems.map(item => item._id) }
      });
      
      const totalAfter = await db.collection(collectionName).countDocuments();
      
      results[collectionName as keyof typeof results] = {
        deleted: deleteResult.deletedCount,
        kept: totalAfter,
        examplesKept: nonChzItems.length
      };
      
      console.log(`✅ ${collectionName}: deleted ${deleteResult.deletedCount}, kept ${totalAfter} (${nonChzItems.length} examples)`);
    }

    // 2. Limpar Custom Collections - MANTER 1 EXEMPLO
    console.log('🧹 Cleaning custom_collections...');
    const customCollectionsBefore = await db.collection('custom_collections').countDocuments();
    
    // 🎯 MANTER 1 EXEMPLO antes de limpar
    const nonChzCustomCollections = await db.collection('custom_collections').find({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ]
    }).limit(1).toArray();
    
    if (nonChzCustomCollections.length > 0) {
      console.log(`📋 Keeping 1 example from custom_collections:`, {
        id: nonChzCustomCollections[0]._id,
        name: nonChzCustomCollections[0].name,
        chainId: nonChzCustomCollections[0].chainId,
        network: nonChzCustomCollections[0].network
      });
    }
    
    const customCollectionsDelete = await db.collection('custom_collections').deleteMany({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ],
      // 🚫 EXCLUIR o exemplo que queremos manter
      _id: { $nin: nonChzCustomCollections.map(item => item._id) }
    });
    const customCollectionsAfter = await db.collection('custom_collections').countDocuments();
    
    results.custom_collections = {
      deleted: customCollectionsDelete.deletedCount,
      kept: customCollectionsAfter,
      examplesKept: nonChzCustomCollections.length
    };

    // 3. Limpar Custom Collection Mints - MANTER 1 EXEMPLO
    console.log('🧹 Cleaning custom_collection_mints...');
    const customMintsBefore = await db.collection('custom_collection_mints').countDocuments();
    
    // 🎯 MANTER 1 EXEMPLO antes de limpar
    const nonChzCustomMints = await db.collection('custom_collection_mints').find({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ]
    }).limit(1).toArray();
    
    if (nonChzCustomMints.length > 0) {
      console.log(`📋 Keeping 1 example from custom_collection_mints:`, {
        id: nonChzCustomMints[0]._id,
        collectionId: nonChzCustomMints[0].collectionId,
        chainId: nonChzCustomMints[0].chainId,
        network: nonChzCustomMints[0].network
      });
    }
    
    const customMintsDelete = await db.collection('custom_collection_mints').deleteMany({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ],
      // 🚫 EXCLUIR o exemplo que queremos manter
      _id: { $nin: nonChzCustomMints.map(item => item._id) }
    });
    const customMintsAfter = await db.collection('custom_collection_mints').countDocuments();
    
    results.custom_collection_mints = {
      deleted: customMintsDelete.deletedCount,
      kept: customMintsAfter,
      examplesKept: nonChzCustomMints.length
    };

    // 4. Limpar Launchpad Collections - MANTER 1 EXEMPLO
    console.log('🧹 Cleaning launchpad_collections...');
    const launchpadBefore = await db.collection('launchpad_collections').countDocuments();
    
    // 🎯 MANTER 1 EXEMPLO antes de limpar
    const nonChzLaunchpadCollections = await db.collection('launchpad_collections').find({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ]
    }).limit(1).toArray();
    
    if (nonChzLaunchpadCollections.length > 0) {
      console.log(`📋 Keeping 1 example from launchpad_collections:`, {
        id: nonChzLaunchpadCollections[0]._id,
        name: nonChzLaunchpadCollections[0].name,
        chainId: nonChzLaunchpadCollections[0].chainId,
        network: nonChzLaunchpadCollections[0].network
      });
    }
    
    const launchpadDelete = await db.collection('launchpad_collections').deleteMany({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ],
      // 🚫 EXCLUIR o exemplo que queremos manter
      _id: { $nin: nonChzLaunchpadCollections.map(item => item._id) }
    });
    const launchpadAfter = await db.collection('launchpad_collections').countDocuments();
    
    results.launchpad_collections = {
      deleted: launchpadDelete.deletedCount,
      kept: launchpadAfter,
      examplesKept: nonChzLaunchpadCollections.length
    };

    // 5. Limpar Launchpad Collection Mints - MANTER 1 EXEMPLO
    console.log('🧹 Cleaning launchpad_collection_mints...');
    const launchpadMintsBefore = await db.collection('launchpad_collection_mints').countDocuments();
    
    // 🎯 MANTER 1 EXEMPLO antes de limpar
    const nonChzLaunchpadMints = await db.collection('launchpad_collection_mints').find({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ]
    }).limit(1).toArray();
    
    if (nonChzLaunchpadMints.length > 0) {
      console.log(`📋 Keeping 1 example from launchpad_collection_mints:`, {
        id: nonChzLaunchpadMints[0]._id,
        collectionId: nonChzLaunchpadMints[0].collectionId,
        chainId: nonChzLaunchpadMints[0].chainId,
        network: nonChzLaunchpadMints[0].network
      });
    }
    
    const launchpadMintsDelete = await db.collection('launchpad_collection_mints').deleteMany({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ],
      // 🚫 EXCLUIR o exemplo que queremos manter
      _id: { $nin: nonChzLaunchpadMints.map(item => item._id) }
    });
    const launchpadMintsAfter = await db.collection('launchpad_collection_mints').countDocuments();
    
    results.launchpad_collection_mints = {
      deleted: launchpadMintsDelete.deletedCount,
      kept: launchpadMintsAfter,
      examplesKept: nonChzLaunchpadMints.length
    };

    // 6. Limpar Minted Launchpad NFTs - MANTER 1 EXEMPLO
    console.log('🧹 Cleaning minted_launchpad_nfts...');
    const mintedBefore = await db.collection('minted_launchpad_nfts').countDocuments();
    
    // 🎯 MANTER 1 EXEMPLO antes de limpar
    const nonChzMintedNFTs = await db.collection('minted_launchpad_nfts').find({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ]
    }).limit(1).toArray();
    
    if (nonChzMintedNFTs.length > 0) {
      console.log(`📋 Keeping 1 example from minted_launchpad_nfts:`, {
        id: nonChzMintedNFTs[0]._id,
        tokenId: nonChzMintedNFTs[0].tokenId,
        chainId: nonChzMintedNFTs[0].chainId,
        network: nonChzMintedNFTs[0].network
      });
    }
    
    const mintedDelete = await db.collection('minted_launchpad_nfts').deleteMany({
      $or: [
        { chainId: { $ne: CHZ_CHAIN_ID } },
        { chainId: { $exists: false } },
        { network: { $ne: 'Chiliz Chain' } },
        { network: { $exists: false } }
      ],
      // 🚫 EXCLUIR o exemplo que queremos manter
      _id: { $nin: nonChzMintedNFTs.map(item => item._id) }
    });
    const mintedAfter = await db.collection('minted_launchpad_nfts').countDocuments();
    
    results.minted_launchpad_nfts = {
      deleted: mintedDelete.deletedCount,
      kept: mintedAfter,
      examplesKept: nonChzMintedNFTs.length
    };

    // Calcular totais
    const totalDeleted = Object.values(results).reduce((sum, item: any) => sum + item.deleted, 0);
    const totalKept = Object.values(results).reduce((sum, item: any) => sum + item.kept, 0);

    console.log('✅ Cleanup completed!');
    console.log(`📊 Total deleted: ${totalDeleted}`);
    console.log(`📊 Total kept: ${totalKept}`);

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully - only CHZ data remains',
      network: {
        name: ACTIVE_NETWORK.name,
        chainId: ACTIVE_NETWORK.chainId,
        currency: ACTIVE_NETWORK.currency
      },
      results,
      summary: {
        totalDeleted,
        totalKept
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error during database cleanup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to clean database'
    }, { status: 500 });
  }
}
