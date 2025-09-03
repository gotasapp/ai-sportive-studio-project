const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chz-app-db';

// Dados de exemplo para desenvolvimento local
const sampleData = {
  jerseys: [
    {
      name: 'Flamengo Home 2024',
      description: 'Classic red and black stripes with modern design',
      imageUrl: 'https://example.com/flamengo-home.jpg',
      tags: ['Flamengo', 'Home', '2024'],
      creatorWallet: '0x1234567890abcdef1234567890abcdef12345678',
      creator: { name: 'FlamengoFan', wallet: '0x1234567890abcdef1234567890abcdef12345678' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.05,
      category: 'jersey'
    },
    {
      name: 'Palmeiras Away 2024',
      description: 'White jersey with green details',
      imageUrl: 'https://example.com/palmeiras-away.jpg',
      tags: ['Palmeiras', 'Away', '2024'],
      creatorWallet: '0xabcdef1234567890abcdef1234567890abcdef12',
      creator: { name: 'PalmeirasFan', wallet: '0xabcdef1234567890abcdef1234567890abcdef12' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.05,
      category: 'jersey'
    },
    {
      name: 'Corinthians Third 2024',
      description: 'Special edition black jersey',
      imageUrl: 'https://example.com/corinthians-third.jpg',
      tags: ['Corinthians', 'Third', '2024'],
      creatorWallet: '0x9876543210fedcba9876543210fedcba98765432',
      creator: { name: 'CorinthiansFan', wallet: '0x9876543210fedcba9876543210fedcba98765432' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.05,
      category: 'jersey'
    },
    {
      name: 'São Paulo Home 2024',
      description: 'Traditional white, red and black stripes',
      imageUrl: 'https://example.com/sao-paulo-home.jpg',
      tags: ['São Paulo', 'Home', '2024'],
      creatorWallet: '0xfedcba9876543210fedcba9876543210fedcba98',
      creator: { name: 'SaoPauloFan', wallet: '0xfedcba9876543210fedcba9876543210fedcba98' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.05,
      category: 'jersey'
    },
    {
      name: 'Vasco Home 2024',
      description: 'Classic white jersey with black cross',
      imageUrl: 'https://example.com/vasco-home.jpg',
      tags: ['Vasco', 'Home', '2024'],
      creatorWallet: '0x1111222233334444555566667777888899990000',
      creator: { name: 'VascoFan', wallet: '0x1111222233334444555566667777888899990000' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.05,
      category: 'jersey'
    }
  ],
  stadiums: [
    {
      name: 'Maracanã Stadium',
      description: 'Iconic Brazilian stadium with modern architecture',
      imageUrl: 'https://example.com/maracana.jpg',
      tags: ['Maracanã', 'Rio de Janeiro', 'Brazil'],
      creatorWallet: '0x2222333344445555666677778888999900001111',
      creator: { name: 'StadiumBuilder', wallet: '0x2222333344445555666677778888999900001111' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.15,
      category: 'stadium'
    },
    {
      name: 'Allianz Parque',
      description: 'Modern Palmeiras stadium with green atmosphere',
      imageUrl: 'https://example.com/allianz-parque.jpg',
      tags: ['Allianz Parque', 'Palmeiras', 'São Paulo'],
      creatorWallet: '0x3333444455556666777788889999000011112222',
      creator: { name: 'PalmeirasFan', wallet: '0x3333444455556666777788889999000011112222' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.15,
      category: 'stadium'
    },
    {
      name: 'Neo Química Arena',
      description: 'Corinthians modern stadium with unique design',
      imageUrl: 'https://example.com/neo-quimica.jpg',
      tags: ['Neo Química Arena', 'Corinthians', 'São Paulo'],
      creatorWallet: '0x4444555566667777888899990000111122223333',
      creator: { name: 'CorinthiansFan', wallet: '0x4444555566667777888899990000111122223333' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.15,
      category: 'stadium'
    }
  ],
  badges: [
    {
      name: 'Flamengo Classic Badge',
      description: 'Traditional Flamengo badge with modern styling',
      imageUrl: 'https://example.com/flamengo-badge.jpg',
      tags: ['Flamengo', 'Badge', 'Classic'],
      creatorWallet: '0x5555666677778888999900001111222233334444',
      creator: { name: 'BadgeDesigner', wallet: '0x5555666677778888999900001111222233334444' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.03,
      category: 'badge'
    },
    {
      name: 'Palmeiras Victory Badge',
      description: 'Commemorative badge for championship victories',
      imageUrl: 'https://example.com/palmeiras-badge.jpg',
      tags: ['Palmeiras', 'Badge', 'Victory'],
      creatorWallet: '0x6666777788889999000011112222333344445555',
      creator: { name: 'PalmeirasFan', wallet: '0x6666777788889999000011112222333344445555' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.03,
      category: 'badge'
    },
    {
      name: 'Corinthians Heritage Badge',
      description: 'Heritage design celebrating club history',
      imageUrl: 'https://example.com/corinthians-badge.jpg',
      tags: ['Corinthians', 'Badge', 'Heritage'],
      creatorWallet: '0x7777888899990000111122223333444455556666',
      creator: { name: 'CorinthiansFan', wallet: '0x7777888899990000111122223333444455556666' },
      status: 'Approved',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      price: 0.03,
      category: 'badge'
    }
  ],
  users: [
    {
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'FlamengoFan',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    },
    {
      wallet: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'PalmeirasFan',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    },
    {
      wallet: '0x9876543210fedcba9876543210fedcba98765432',
      name: 'CorinthiansFan',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    },
    {
      wallet: '0xfedcba9876543210fedcba9876543210fedcba98',
      name: 'SaoPauloFan',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    },
    {
      wallet: '0x1111222233334444555566667777888899990000',
      name: 'VascoFan',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }
  ]
};

async function populateDatabase() {
  let client;
  
  try {
    console.log('🚀 Conectando ao MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('chz-app-db');
    
    // Limpar dados existentes (opcional)
    console.log('🧹 Limpando dados existentes...');
    await db.collection('jerseys').deleteMany({});
    await db.collection('stadiums').deleteMany({});
    await db.collection('badges').deleteMany({});
    await db.collection('users').deleteMany({});
    
    // Inserir dados de exemplo
    console.log('📝 Inserindo dados de exemplo...');
    
    for (const [collectionName, data] of Object.entries(sampleData)) {
      console.log(`  - Inserindo ${data.length} itens em ${collectionName}...`);
      await db.collection(collectionName).insertMany(data);
    }
    
    // Verificar inserção
    console.log('\n📊 Verificando dados inseridos:');
    for (const collectionName of Object.keys(sampleData)) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`  - ${collectionName}: ${count} itens`);
    }
    
    // Criar índices para melhor performance
    console.log('\n🔍 Criando índices...');
    await db.collection('jerseys').createIndex({ tags: 1 });
    await db.collection('stadiums').createIndex({ tags: 1 });
    await db.collection('badges').createIndex({ tags: 1 });
    await db.collection('jerseys').createIndex({ createdAt: -1 });
    await db.collection('stadiums').createIndex({ createdAt: -1 });
    await db.collection('badges').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ wallet: 1 }, { unique: true });
    
    console.log('✅ Banco de dados populado com sucesso!');
    console.log('\n🎯 Dados disponíveis:');
    console.log(`  - ${sampleData.jerseys.length} jerseys`);
    console.log(`  - ${sampleData.stadiums.length} stadiums`);
    console.log(`  - ${sampleData.badges.length} badges`);
    console.log(`  - ${sampleData.users.length} users`);
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexão com MongoDB fechada');
    }
  }
}

// Executar script
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase, sampleData }; 