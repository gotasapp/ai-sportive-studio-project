/**
 * Script para limpar NFTs existentes do MongoDB
 * Remove NFTs que não possuem tokenId válido da blockchain
 * Prepara o banco para o sistema de webhook automático
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const DB_NAME = 'chz-app-db';
const COLLECTIONS = ['jerseys', 'stadiums', 'badges'];

async function clearExistingNFTs() {
  let client;
  
  try {
    console.log('🧹 Starting NFT cleanup process...');
    console.log('📋 Target collections:', COLLECTIONS);
    
    // Conectar ao MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const results = {
      total: { analyzed: 0, removed: 0, kept: 0 },
      byCollection: {}
    };

    for (const collectionName of COLLECTIONS) {
      console.log(`\n🔍 Processing ${collectionName} collection...`);
      
      const collection = db.collection(collectionName);
      
      // Buscar todos os NFTs da coleção
      const allNFTs = await collection.find({}).toArray();
      console.log(`📊 Found ${allNFTs.length} NFTs in ${collectionName}`);
      
      let removed = 0;
      let kept = 0;
      
      for (const nft of allNFTs) {
        const shouldRemove = shouldRemoveNFT(nft);
        
        if (shouldRemove.remove) {
          console.log(`❌ Removing NFT: ${nft._id} (${shouldRemove.reason})`);
          await collection.deleteOne({ _id: nft._id });
          removed++;
        } else {
          console.log(`✅ Keeping NFT: ${nft._id} (${shouldRemove.reason})`);
          kept++;
        }
      }
      
      results.byCollection[collectionName] = {
        analyzed: allNFTs.length,
        removed,
        kept
      };
      
      results.total.analyzed += allNFTs.length;
      results.total.removed += removed;
      results.total.kept += kept;
      
      console.log(`📊 ${collectionName} results: ${removed} removed, ${kept} kept`);
    }

    // Resumo final
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log('====================');
    console.log(`📊 Total NFTs analyzed: ${results.total.analyzed}`);
    console.log(`❌ Total NFTs removed: ${results.total.removed}`);
    console.log(`✅ Total NFTs kept: ${results.total.kept}`);
    
    console.log('\n📋 By Collection:');
    for (const [collection, stats] of Object.entries(results.byCollection)) {
      console.log(`  ${collection}: ${stats.removed} removed, ${stats.kept} kept`);
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('🚀 Database is now ready for webhook-based auto-sync');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

/**
 * Determina se um NFT deve ser removido
 * Critérios para remoção:
 * - Não possui tokenId válido DA BLOCKCHAIN
 * - Não possui transactionHash confirmado
 * - Status não é "mintado" com sucesso
 */
function shouldRemoveNFT(nft) {
  // 1. Verificar se tem tokenId válido da blockchain
  const hasValidTokenId = (
    nft.tokenId !== undefined && 
    nft.tokenId !== null && 
    nft.tokenId !== '' &&
    !isNaN(parseInt(nft.tokenId))
  ) || (
    nft.blockchainTokenId !== undefined && 
    nft.blockchainTokenId !== null && 
    nft.blockchainTokenId !== '' &&
    !isNaN(parseInt(nft.blockchainTokenId))
  );

  if (!hasValidTokenId) {
    return {
      remove: true,
      reason: 'No valid blockchain tokenId'
    };
  }

  // 2. Verificar se tem transactionHash válido
  const hasValidTxHash = (
    nft.transactionHash && 
    nft.transactionHash.length > 10 &&
    nft.transactionHash.startsWith('0x')
  ) || (
    nft.blockchain?.transactionHash && 
    nft.blockchain.transactionHash.length > 10 &&
    nft.blockchain.transactionHash.startsWith('0x')
  );

  if (!hasValidTxHash) {
    return {
      remove: true,
      reason: 'No valid transaction hash'
    };
  }

  // 3. Verificar se está marcado como mintado
  const isMinted = (
    nft.isMinted === true ||
    nft.mintStatus === 'minted' ||
    nft.mintStatus === 'confirmed' ||
    nft.mintStatus === 'success'
  );

  if (!isMinted) {
    return {
      remove: true,
      reason: 'Not marked as minted'
    };
  }

  // 4. NFTs gerados mas nunca mintados (apenas criados na UI)
  const isOnlyGenerated = (
    !nft.transactionHash &&
    !nft.blockchain?.transactionHash &&
    nft.status !== 'Approved' &&
    !nft.isMinted
  );

  if (isOnlyGenerated) {
    return {
      remove: true,
      reason: 'Generated but never minted'
    };
  }

  // Manter o NFT se passou em todos os critérios
  return {
    remove: false,
    reason: `Valid NFT - tokenId: ${nft.tokenId || nft.blockchainTokenId}, tx: ${(nft.transactionHash || nft.blockchain?.transactionHash || '').slice(0, 10)}...`
  };
}

/**
 * Modo dry-run para visualizar o que seria removido sem fazer alterações
 */
async function dryRun() {
  let client;
  
  try {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('=====================================\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const summary = {
      total: { analyzed: 0, toRemove: 0, toKeep: 0 },
      byCollection: {}
    };

    for (const collectionName of COLLECTIONS) {
      console.log(`🔍 Analyzing ${collectionName} collection...`);
      
      const collection = db.collection(collectionName);
      const allNFTs = await collection.find({}).toArray();
      
      let toRemove = 0;
      let toKeep = 0;
      
      console.log(`\n📋 ${collectionName} NFTs (${allNFTs.length} total):`);
      console.log('================================================');
      
      for (const nft of allNFTs) {
        const shouldRemove = shouldRemoveNFT(nft);
        
        if (shouldRemove.remove) {
          console.log(`❌ WOULD REMOVE: ${nft._id} - ${shouldRemove.reason}`);
          toRemove++;
        } else {
          console.log(`✅ WOULD KEEP: ${nft._id} - ${shouldRemove.reason}`);
          toKeep++;
        }
      }
      
      summary.byCollection[collectionName] = {
        analyzed: allNFTs.length,
        toRemove,
        toKeep
      };
      
      summary.total.analyzed += allNFTs.length;
      summary.total.toRemove += toRemove;
      summary.total.toKeep += toKeep;
      
      console.log(`\n📊 ${collectionName} summary: ${toRemove} would be removed, ${toKeep} would be kept\n`);
    }

    console.log('🎯 DRY RUN SUMMARY:');
    console.log('===================');
    console.log(`📊 Total NFTs analyzed: ${summary.total.analyzed}`);
    console.log(`❌ Total NFTs to remove: ${summary.total.toRemove}`);
    console.log(`✅ Total NFTs to keep: ${summary.total.toKeep}`);
    
    console.log('\n📋 By Collection:');
    for (const [collection, stats] of Object.entries(summary.byCollection)) {
      console.log(`  ${collection}: ${stats.toRemove} to remove, ${stats.toKeep} to keep`);
    }

    console.log('\n💡 To execute the cleanup, run: node scripts/clear-existing-nfts.js --execute');

  } catch (error) {
    console.error('❌ Dry run failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Executar o script
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = args.includes('--dry-run') || !isExecute;

if (isDryRun) {
  dryRun();
} else {
  console.log('⚠️ EXECUTING CLEANUP - This will permanently delete NFTs from MongoDB');
  console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...\n');
  
  setTimeout(() => {
    clearExistingNFTs();
  }, 5000);
} 