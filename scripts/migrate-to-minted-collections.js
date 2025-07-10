const { MongoClient } = require('mongodb');

const DB_NAME = 'chz-app-db';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

/**
 * Script para migrar NFTs existentes para as novas coleções de mintados
 * Isso é apenas para teste - em produção, os NFTs vão diretamente para as coleções de mintados quando mintados
 */
async function migrateToMintedCollections() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Migrar Jerseys
    await migrateJerseys(db);
    
    // Migrar Stadiums
    await migrateStadiums(db);
    
    // Migrar Badges
    await migrateBadges(db);
    
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await client.close();
  }
}

async function migrateJerseys(db) {
  console.log('\n🔄 Migrando Jerseys...');
  
  const jerseysCollection = db.collection('jerseys');
  const mintedJerseysCollection = db.collection('minted-jerseys');
  
  // Buscar jerseys que parecem ter sido mintados
  const jerseys = await jerseysCollection.find({
    status: 'Approved',
    $or: [
      { transactionHash: { $exists: true, $nin: [null, ''] } },
      { isMinted: true },
      { mintStatus: 'success' }
    ]
  }).toArray();
  
  console.log(`📊 Encontrados ${jerseys.length} jerseys para migrar`);
  
  for (const jersey of jerseys) {
    // Verificar se já existe na coleção de mintados
    const existing = await mintedJerseysCollection.findOne({ _id: jersey._id });
    
    if (!existing) {
      const mintedJersey = {
        ...jersey,
        // Informações de mint
        transactionHash: jersey.transactionHash || `mock_tx_${jersey._id}`,
        tokenId: jersey.tokenId || jersey.blockchain?.tokenId || Math.floor(Math.random() * 10000).toString(),
        mintedAt: jersey.mintedAt || new Date(),
        mintStatus: 'confirmed',
        isMinted: true,
        status: 'Approved',
        
        // Informações de blockchain
        blockchain: {
          chainId: 80002,
          contractAddress: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
          transactionHash: jersey.transactionHash || `mock_tx_${jersey._id}`,
          tokenId: jersey.tokenId || jersey.blockchain?.tokenId || Math.floor(Math.random() * 10000).toString(),
          explorerUrl: jersey.transactionHash ? `https://amoy.polygonscan.com/tx/${jersey.transactionHash}` : null,
          network: 'Polygon Amoy'
        }
      };
      
      await mintedJerseysCollection.insertOne(mintedJersey);
      console.log(`✅ Migrado: ${jersey.name || 'Unnamed Jersey'}`);
    }
  }
}

async function migrateStadiums(db) {
  console.log('\n🔄 Migrando Stadiums...');
  
  const stadiumsCollection = db.collection('stadiums');
  const mintedStadiumsCollection = db.collection('minted-stadiums');
  
  // Buscar stadiums que parecem ter sido mintados
  const stadiums = await stadiumsCollection.find({
    status: 'Approved',
    $or: [
      { transactionHash: { $exists: true, $nin: [null, ''] } },
      { isMinted: true },
      { mintStatus: 'success' }
    ]
  }).toArray();
  
  console.log(`📊 Encontrados ${stadiums.length} stadiums para migrar`);
  
  for (const stadium of stadiums) {
    // Verificar se já existe na coleção de mintados
    const existing = await mintedStadiumsCollection.findOne({ _id: stadium._id });
    
    if (!existing) {
      const mintedStadium = {
        ...stadium,
        // Informações de mint
        transactionHash: stadium.transactionHash || `mock_tx_${stadium._id}`,
        tokenId: stadium.tokenId || stadium.blockchain?.tokenId || Math.floor(Math.random() * 10000).toString(),
        mintedAt: stadium.mintedAt || new Date(),
        mintStatus: 'confirmed',
        isMinted: true,
        status: 'Approved',
        
        // Informações de blockchain
        blockchain: {
          chainId: 80002,
          contractAddress: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
          transactionHash: stadium.transactionHash || `mock_tx_${stadium._id}`,
          tokenId: stadium.tokenId || stadium.blockchain?.tokenId || Math.floor(Math.random() * 10000).toString(),
          explorerUrl: stadium.transactionHash ? `https://amoy.polygonscan.com/tx/${stadium.transactionHash}` : null,
          network: 'Polygon Amoy'
        }
      };
      
      await mintedStadiumsCollection.insertOne(mintedStadium);
      console.log(`✅ Migrado: ${stadium.name || 'Unnamed Stadium'}`);
    }
  }
}

async function migrateBadges(db) {
  console.log('\n🔄 Migrando Badges...');
  
  const badgesCollection = db.collection('badges');
  const mintedBadgesCollection = db.collection('minted-badges');
  
  // Buscar badges que parecem ter sido mintados
  const badges = await badgesCollection.find({
    status: 'Approved',
    $or: [
      { transactionHash: { $exists: true, $nin: [null, ''] } },
      { isMinted: true },
      { mintStatus: 'success' }
    ]
  }).toArray();
  
  console.log(`📊 Encontrados ${badges.length} badges para migrar`);
  
  for (const badge of badges) {
    // Verificar se já existe na coleção de mintados
    const existing = await mintedBadgesCollection.findOne({ _id: badge._id });
    
    if (!existing) {
      const mintedBadge = {
        ...badge,
        // Informações de mint
        transactionHash: badge.transactionHash || `mock_tx_${badge._id}`,
        tokenId: badge.tokenId || badge.blockchain?.tokenId || Math.floor(Math.random() * 10000).toString(),
        mintedAt: badge.mintedAt || new Date(),
        mintStatus: 'confirmed',
        isMinted: true,
        status: 'Approved',
        
        // Informações de blockchain
        blockchain: {
          chainId: 80002,
          contractAddress: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
          transactionHash: badge.transactionHash || `mock_tx_${badge._id}`,
          tokenId: badge.tokenId || badge.blockchain?.tokenId || Math.floor(Math.random() * 10000).toString(),
          explorerUrl: badge.transactionHash ? `https://amoy.polygonscan.com/tx/${badge.transactionHash}` : null,
          network: 'Polygon Amoy'
        }
      };
      
      await mintedBadgesCollection.insertOne(mintedBadge);
      console.log(`✅ Migrado: ${badge.name || 'Unnamed Badge'}`);
    }
  }
}

// Executar migração
migrateToMintedCollections(); 