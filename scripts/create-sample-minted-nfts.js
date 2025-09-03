const { MongoClient, ObjectId } = require('mongodb');

const DB_NAME = 'chz-app-db';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

/**
 * Script para criar NFTs de exemplo nas novas coleções de mintados
 * Isso é apenas para teste do marketplace
 */
async function createSampleMintedNFTs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Criar jerseys de exemplo
    await createSampleJerseys(db);
    
    // Criar stadiums de exemplo
    await createSampleStadiums(db);
    
    // Criar badges de exemplo
    await createSampleBadges(db);
    
    console.log('✅ NFTs de exemplo criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar NFTs de exemplo:', error);
  } finally {
    await client.close();
  }
}

async function createSampleJerseys(db) {
  console.log('\n🔄 Criando jerseys de exemplo...');
  
  const mintedJerseysCollection = db.collection('minted-jerseys');
  
  const sampleJerseys = [
    {
      _id: new ObjectId(),
      name: 'Flamengo GABRIEL #9',
      description: 'Jersey oficial do Flamengo com o nome GABRIEL e número 9',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'jersey',
      team: 'Flamengo',
      playerName: 'GABRIEL',
      playerNumber: '9',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
      tokenId: '1001',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        tokenId: '1001',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x1234567890abcdef1234567890abcdef12345678',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    },
    {
      _id: new ObjectId(),
      name: 'Palmeiras MARCOS #12',
      description: 'Jersey oficial do Palmeiras com o nome MARCOS e número 12',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'jersey',
      team: 'Palmeiras',
      playerName: 'MARCOS',
      playerNumber: '12',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x2345678901bcdef12345678901bcdef123456789',
      tokenId: '1002',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x2345678901bcdef12345678901bcdef123456789',
        tokenId: '1002',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x2345678901bcdef12345678901bcdef123456789',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    },
    {
      _id: new ObjectId(),
      name: 'Corinthians DINAMITE #10',
      description: 'Jersey oficial do Corinthians com o nome DINAMITE e número 10',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'jersey',
      team: 'Corinthians',
      playerName: 'DINAMITE',
      playerNumber: '10',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x3456789012cdef123456789012cdef1234567890',
      tokenId: '1003',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x3456789012cdef123456789012cdef1234567890',
        tokenId: '1003',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x3456789012cdef123456789012cdef1234567890',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    }
  ];
  
  await mintedJerseysCollection.insertMany(sampleJerseys);
  console.log(`✅ Criados ${sampleJerseys.length} jerseys de exemplo`);
}

async function createSampleStadiums(db) {
  console.log('\n🔄 Criando stadiums de exemplo...');
  
  const mintedStadiumsCollection = db.collection('minted-stadiums');
  
  const sampleStadiums = [
    {
      _id: new ObjectId(),
      name: 'Maracanã Stadium',
      description: 'Estádio icônico do Rio de Janeiro',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'stadium',
      team: 'Flamengo',
      location: 'Rio de Janeiro, Brasil',
      capacity: '78,838',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x4567890123def1234567890123def12345678901',
      tokenId: '2001',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x4567890123def1234567890123def12345678901',
        tokenId: '2001',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x4567890123def1234567890123def12345678901',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    },
    {
      _id: new ObjectId(),
      name: 'Allianz Parque',
      description: 'Arena moderna do Palmeiras',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'stadium',
      team: 'Palmeiras',
      location: 'São Paulo, Brasil',
      capacity: '43,713',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x5678901234ef12345678901234ef123456789012',
      tokenId: '2002',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x5678901234ef12345678901234ef123456789012',
        tokenId: '2002',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x5678901234ef12345678901234ef123456789012',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    }
  ];
  
  await mintedStadiumsCollection.insertMany(sampleStadiums);
  console.log(`✅ Criados ${sampleStadiums.length} stadiums de exemplo`);
}

async function createSampleBadges(db) {
  console.log('\n🔄 Criando badges de exemplo...');
  
  const mintedBadgesCollection = db.collection('minted-badges');
  
  const sampleBadges = [
    {
      _id: new ObjectId(),
      name: 'Flamengo Champion Badge',
      description: 'Badge comemorativo do título do Flamengo',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'badge',
      team: 'Flamengo',
      achievement: 'Campeonato Brasileiro 2023',
      rarity: 'Legendary',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x6789012345f123456789012345f1234567890123',
      tokenId: '3001',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x6789012345f123456789012345f1234567890123',
        tokenId: '3001',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x6789012345f123456789012345f1234567890123',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    },
    {
      _id: new ObjectId(),
      name: 'Palmeiras Victory Badge',
      description: 'Badge comemorativo da vitória do Palmeiras',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      category: 'badge',
      team: 'Palmeiras',
      achievement: 'Libertadores 2023',
      rarity: 'Epic',
      status: 'Approved',
      creator: {
        wallet: '0xEf381c5fB1697b0f21F99c7A7b546821cF481B56',
        name: 'Test User'
      },
      transactionHash: '0x7890123456f1234567890123456f12345678901234',
      tokenId: '3002',
      mintedAt: new Date(),
      mintStatus: 'confirmed',
      isMinted: true,
      createdAt: new Date(),
      blockchain: {
        chainId: 80002,
        contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
        transactionHash: '0x7890123456f1234567890123456f12345678901234',
        tokenId: '3002',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x7890123456f1234567890123456f12345678901234',
        network: 'Polygon Amoy'
      },
      marketplace: {
        isListable: true,
        canTrade: true,
        verified: true
      }
    }
  ];
  
  await mintedBadgesCollection.insertMany(sampleBadges);
  console.log(`✅ Criados ${sampleBadges.length} badges de exemplo`);
}

// Executar criação de NFTs de exemplo
createSampleMintedNFTs(); 