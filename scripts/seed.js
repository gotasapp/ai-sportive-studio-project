// scripts/seed.js
const { MongoClient } = require('mongodb');
// Carrega as variáveis de ambiente do .env.local
require('dotenv').config({ path: './.env.local' });

// Dados que vamos inserir
const mockUsers = [
  {
    walletAddress: '0xAbc...dEfg',
    name: 'CryptoKing',
    email: 'king@crypto.eth',
    joinedAt: new Date('2024-06-15T10:30:00Z'),
    nftsCreated: 12,
    lastActivity: new Date('2024-07-03T18:45:00Z'),
    status: 'Active',
  },
  {
    walletAddress: '0x123...4567',
    name: 'NFTCollector',
    email: 'collector@nfts.io',
    joinedAt: new Date('2024-05-20T14:00:00Z'),
    nftsCreated: 45,
    lastActivity: new Date('2024-07-02T11:20:00Z'),
    status: 'Active',
  },
  {
    walletAddress: '0xDef...Abc1',
    name: 'ArtFan',
    email: 'fan@art.com',
    joinedAt: new Date('2024-03-10T09:15:00Z'),
    nftsCreated: 5,
    lastActivity: new Date('2024-06-25T20:10:00Z'),
    status: 'Inactive',
  },
  {
    walletAddress: '0xGhi...jKlM',
    name: 'Vascaino.eth',
    email: 'vasco@gigante.com',
    joinedAt: new Date('2024-02-01T11:05:00Z'),
    nftsCreated: 22,
    lastActivity: new Date('2024-07-03T19:00:00Z'),
    status: 'Active',
  },
  {
    walletAddress: '0xNop...QrSt',
    name: 'SPFC_Hodler',
    email: 'spfc@tricolor.io',
    joinedAt: new Date('2024-01-25T18:30:00Z'),
    nftsCreated: 31,
    lastActivity: new Date('2024-07-01T14:50:00Z'),
    status: 'Banned',
  },
];

const mockJerseys = [
  {
    name: 'Flamengo 81 Zico',
    creator: {
      name: 'CryptoKing',
      wallet: '0xAbc...dEfg'
    },
    createdAt: new Date('2024-07-03T18:45:00Z'),
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
    mintCount: 150,
    editionSize: 200,
  },
  {
    name: 'Palmeiras Cyber',
    creator: {
      name: 'ArtFan',
      wallet: '0xDef...Abc1'
    },
    createdAt: new Date('2024-07-02T15:30:00Z'),
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636631/bafybeiesm3ufeepsaog2alh6jqch3t3il47tkpx3662v4fmjkxosthinqy_e2qdxh.png',
    mintCount: 0,
    editionSize: 100,
  },
  {
    name: 'Vasco Camisas Negras',
    creator: {
      name: 'Vascaino.eth',
      wallet: '0xGhi...jKlM'
    },
    createdAt: new Date('2024-07-01T11:00:00Z'),
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636629/bafybeie3yd2h7gw5yypyvk4vomlxigebscfc2b4a3yoxkggjhya6tj5l24_hlhcku.png',
    mintCount: 50,
    editionSize: 50,
  },
  {
    name: 'Corinthians Democracia',
    creator: {
      name: 'NFTCollector',
      wallet: '0x123...4567'
    },
    createdAt: new Date('2024-06-30T09:00:00Z'),
    status: 'Error',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636627/Corinthians_JEFF_10_t7lveq.png',
    mintCount: 0,
    editionSize: 100,
  },
];

const mockBadges = [
  {
    name: 'CHZ Founder',
    creator: { name: 'Admin', wallet: '0xAdmin...Wallet' },
    createdAt: new Date('2024-07-01T10:00:00Z'),
    status: 'Claimable',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638510/badge_CHZ_Founder_wkvhcy.png',
    mintCount: 500,
    editionSize: 1000,
  },
  {
    name: 'Top Collector',
    creator: { name: 'Admin', wallet: '0xAdmin...Wallet' },
    createdAt: new Date('2024-06-15T12:00:00Z'),
    status: 'Claimable',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638512/badge_Top_Collector_lq9vbj.png',
    mintCount: 88,
    editionSize: 100,
  },
  {
    name: 'Early Adopter',
    creator: { name: 'Admin', wallet: '0xAdmin...Wallet' },
    createdAt: new Date('2024-05-20T09:30:00Z'),
    status: 'Claimable',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638515/badge_Early_Adopter_gy8kdh.png',
    mintCount: 1234,
    editionSize: 2000,
  },
  {
    name: 'Genesis Jersey',
    creator: { name: 'Admin', wallet: '0xAdmin...Wallet' },
    createdAt: new Date('2024-07-05T14:00:00Z'),
    status: 'Expired',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638517/badge_Genesis_Jersey_bdfmld.png',
    mintCount: 100,
    editionSize: 100,
  },
];

const mockStadiums = [
  {
    name: 'Maracanã Future',
    creator: { name: 'RioNFTs', wallet: '0xAbc...dEfg' },
    createdAt: new Date('2024-07-04T10:00:00Z'),
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638520/stadium_Maracana_Future_bgrqjo.png',
    mintCount: 10,
    editionSize: 20,
  },
  {
    name: 'Allianz Parque Night',
    creator: { name: 'PalmeirasDAO', wallet: '0xDef...Abc1' },
    createdAt: new Date('2024-07-03T11:20:00Z'),
    status: 'Minted',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638522/stadium_Allianz_Parque_Night_n7wanl.png',
    mintCount: 50,
    editionSize: 50,
  },
  {
    name: 'São Januário VR',
    creator: { name: 'Vascaino.eth', wallet: '0xGhi...jKlM' },
    createdAt: new Date('2024-06-30T15:00:00Z'),
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638525/stadium_Sao_Januario_VR_r5k9vw.png',
    mintCount: 0,
    editionSize: 100,
  },
  {
    name: 'Camp Nou Reimagined',
    creator: { name: 'BarcaFan', wallet: '0x456...7890' },
    createdAt: new Date('2024-06-28T18:00:00Z'),
    status: 'Error',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638527/stadium_Camp_Nou_Reimagined_mkvhqy.png',
    mintCount: 0,
    editionSize: 100,
  }
];

const mockLogos = [
  {
    name: 'Flamengo Shield',
    creator: { name: 'Designer_01', wallet: '0xabc...1234' },
    createdAt: new Date('2024-07-06T10:00:00Z'),
    status: 'Approved',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638539/logo_Flamengo_Shield_tpxjzt.png',
    usageCount: 120,
    tags: ['flamengo', 'shield', 'official'],
  },
  {
    name: 'Palmeiras Modern',
    creator: { name: 'ArtStation_User', wallet: '0xdef...5678' },
    createdAt: new Date('2024-07-05T15:30:00Z'),
    status: 'Pending',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638542/logo_Palmeiras_Modern_g6gqjb.png',
    usageCount: 0,
    tags: ['palmeiras', 'modern', 'concept'],
  },
  {
    name: 'Vasco Cross',
    creator: { name: 'Designer_01', wallet: '0xabc...1234' },
    createdAt: new Date('2024-07-04T11:00:00Z'),
    status: 'Approved',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638544/logo_Vasco_Cross_nltnnd.png',
    usageCount: 85,
    tags: ['vasco', 'cross', 'minimalist'],
  },
  {
    name: 'Corinthians "CP" Monogram',
    creator: { name: 'Corinthiano_NFT', wallet: '0xghi...9012' },
    createdAt: new Date('2024-07-03T09:00:00Z'),
    status: 'Rejected',
    imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750638547/logo_Corinthians_Monogram_k9yeyj.png',
    usageCount: 0,
    tags: ['corinthians', 'monogram', 'vintage'],
  },
];

const mockLogs = [
  {
    timestamp: new Date('2024-07-05T14:30:15Z'),
    level: 'info',
    message: 'Admin user admin@chz.com logged in.',
    actor: { type: 'user', id: 'user_admin', name: 'admin@chz.com' },
    context: { ip: '192.168.1.1' }
  },
  {
    timestamp: new Date('2024-07-05T14:25:00Z'),
    level: 'success',
    message: 'Successfully minted NFT "Flamengo 81 Zico" (ID: jersey_1).',
    actor: { type: 'system', id: 'engine-minter' },
    context: { transactionId: '0xabc123...', contract: '0x7822...1407' }
  },
  {
    timestamp: new Date('2024-07-05T14:20:10Z'),
    level: 'warning',
    message: 'High traffic detected on stadium generator.',
    actor: { type: 'system', id: 'monitor' },
    context: { activeUsers: 1502 }
  },
  {
    timestamp: new Date('2024-07-05T14:15:05Z'),
    level: 'error',
    message: 'Failed to process payment for user user_regular.',
    actor: { type: 'user', id: 'user_regular', name: 'someuser@email.com' },
    context: { paymentGateway: 'Stripe', errorCode: 'card_declined' }
  },
  {
    timestamp: new Date('2024-07-05T13:50:00Z'),
    level: 'info',
    message: 'Updated settings for "Badges".',
    actor: { type: 'user', id: 'user_admin', name: 'admin@chz.com' },
    context: { setting: 'claimDuration', oldValue: '30d', newValue: '60d' }
  }
];


async function seedDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('A variável de ambiente MONGODB_URI não foi definida em .env.local');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB Atlas');

    const database = client.db('chz-app-db');
    const usersCollection = database.collection('users');
    const jerseysCollection = database.collection('jerseys');
    const badgesCollection = database.collection('badges');
    const stadiumsCollection = database.collection('stadiums');
    const logosCollection = database.collection('logos');
    const logsCollection = database.collection('logs');

    // Limpa a coleção antes de inserir novos dados para evitar duplicatas
    console.log('🧹 Limpando a coleção "users"...');
    await usersCollection.deleteMany({});
    console.log('🌱 Inserindo usuários...');
    await usersCollection.insertMany(mockUsers);
    console.log(`👍 ${mockUsers.length} usuários inseridos com sucesso.`);
    
    console.log('🧹 Limpando a coleção "jerseys"...');
    await jerseysCollection.deleteMany({});
    console.log('🌱 Inserindo jerseys...');
    await jerseysCollection.insertMany(mockJerseys);
    console.log(`👍 ${mockJerseys.length} jerseys inseridas com sucesso.`);

    console.log('🧹 Limpando a coleção "badges"...');
    await badgesCollection.deleteMany({});
    console.log('🌱 Inserindo badges...');
    await badgesCollection.insertMany(mockBadges);
    console.log(`👍 ${mockBadges.length} badges inseridos com sucesso.`);

    console.log('🧹 Limpando a coleção "stadiums"...');
    await stadiumsCollection.deleteMany({});
    console.log('🌱 Inserindo stadiums...');
    await stadiumsCollection.insertMany(mockStadiums);
    console.log(`👍 ${mockStadiums.length} stadiums inseridos com sucesso.`);

    console.log('🧹 Limpando a coleção "logos"...');
    await logosCollection.deleteMany({});
    console.log('🌱 Inserindo logos...');
    await logosCollection.insertMany(mockLogos);
    console.log(`👍 ${mockLogos.length} logos inseridos com sucesso.`);

    console.log('🧹 Limpando a coleção "logs"...');
    await logsCollection.deleteMany({});
    console.log('🌱 Inserindo logs...');
    await logsCollection.insertMany(mockLogs);
    console.log(`👍 ${mockLogs.length} logs inseridos com sucesso.`);


  } catch (err) {
    console.error('❌ Erro durante o processo de seeding:', err);
  } finally {
    await client.close();
    console.log('🔌 Conexão com o MongoDB fechada.');
  }
}

seedDB(); 