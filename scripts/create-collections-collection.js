const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'chz-app-db';

async function createCollectionsCollection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Verificar se a coleção já existe
    const collections = await db.listCollections({ name: 'collections' }).toArray();
    
    if (collections.length > 0) {
      console.log('⚠️  Collections collection already exists');
      return;
    }
    
    // Criar a coleção collections
    await db.createCollection('collections');
    console.log('✅ Created collections collection');
    
    // Criar índices para otimização
    await db.collection('collections').createIndex({ type: 1 });
    await db.collection('collections').createIndex({ status: 1 });
    await db.collection('collections').createIndex({ category: 1 });
    await db.collection('collections').createIndex({ 'creator.wallet': 1 });
    await db.collection('collections').createIndex({ createdAt: -1 });
    await db.collection('collections').createIndex({ launchDate: 1 });
    await db.collection('collections').createIndex({ marketplaceEnabled: 1 });
    
    console.log('✅ Created indexes for collections collection');
    
    // Migrar dados mock existentes
    await migrateMockCollections(db);
    
    console.log('🎉 Collections collection setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating collections collection:', error);
  } finally {
    await client.close();
  }
}

async function migrateMockCollections(db) {
  console.log('🔄 Migrating mock collections...');
  
  // Dados mock baseados no launchpad existente
  const mockCollections = [
    {
      name: 'Flamengo Heritage Collection',
      description: 'Historic jerseys celebrating the legendary 1981 World Championship victory',
      image: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      bannerImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      type: 'launchpad',
      status: 'active',
      category: 'jerseys',
      totalSupply: 1981,
      minted: 1456,
      price: '50 CHZ',
      creator: {
        wallet: '0x1234567890123456789012345678901234567890',
        name: 'Clube de Regatas do Flamengo',
        avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png'
      },
      contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      marketplaceEnabled: false,
      launchDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-02-15T23:59:59Z'),
      approvedAt: new Date('2024-01-10T00:00:00Z'),
      approvedBy: 'admin',
      website: 'https://flamengo.com.br',
      twitter: 'https://twitter.com/flamengo',
      discord: 'https://discord.gg/flamengo',
      vision: 'The Flamengo Heritage Collection aims to preserve and celebrate the rich history of one of Brazil\'s most beloved football clubs.',
      utility: [
        'Exclusive access to Flamengo events and experiences',
        'Priority access to future Flamengo NFT drops',
        'Special discounts on official Flamengo merchandise',
        'Access to holder-only Discord channels',
        'Voting rights on future collection decisions'
      ],
      team: [
        {
          name: 'Gabriel Barbosa',
          role: 'Creative Director',
          avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
          bio: 'Leading striker and creative vision behind the collection'
        },
        {
          name: 'Bruno Henrique',
          role: 'Community Manager',
          avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
          bio: 'Connecting fans with the digital revolution'
        }
      ],
      roadmap: [
        {
          phase: 'Phase 1',
          title: 'Collection Launch',
          description: 'Launch of 1981 unique jersey NFTs',
          status: 'completed'
        },
        {
          phase: 'Phase 2',
          title: 'Utility Activation',
          description: 'Activate exclusive holder benefits',
          status: 'in-progress'
        },
        {
          phase: 'Phase 3',
          title: 'Stadium Access',
          description: 'Physical stadium experiences for holders',
          status: 'upcoming'
        },
        {
          phase: 'Phase 4',
          title: 'Global Expansion',
          description: 'International partnerships and events',
          status: 'upcoming'
        }
      ],
      mintStages: [
        {
          id: 'gtd',
          name: 'GTD',
          description: 'Guaranteed allowlist',
          price: '50 CHZ',
          walletLimit: 1,
          status: 'ended',
          startTime: new Date('2024-01-10T00:00:00Z'),
          endTime: new Date('2024-01-12T23:59:59Z')
        },
        {
          id: 'fcfs',
          name: 'FCFS',
          description: 'First come, first served',
          price: '50 CHZ',
          walletLimit: 2,
          status: 'ended',
          startTime: new Date('2024-01-12T00:00:00Z'),
          endTime: new Date('2024-01-14T23:59:59Z')
        },
        {
          id: 'public',
          name: 'Public',
          description: 'Open to everyone',
          price: '50 CHZ',
          walletLimit: 3,
          status: 'live',
          startTime: new Date('2024-01-14T00:00:00Z'),
          endTime: new Date('2024-02-15T23:59:59Z')
        }
      ],
      createdAt: new Date('2024-01-10T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      name: 'Palmeiras Championship Badges',
      description: 'Exclusive badges commemorating championship victories and historic moments',
      image: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
      bannerImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
      type: 'launchpad',
      status: 'upcoming',
      category: 'badges',
      totalSupply: 500,
      minted: 0,
      price: '75 CHZ',
      creator: {
        wallet: '0x2345678901234567890123456789012345678901',
        name: 'Sociedade Esportiva Palmeiras',
        avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png'
      },
      contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      marketplaceEnabled: false,
      launchDate: new Date('2024-02-01T00:00:00Z'),
      endDate: new Date('2024-03-01T23:59:59Z'),
      approvedAt: new Date('2024-01-20T00:00:00Z'),
      approvedBy: 'admin',
      website: 'https://palmeiras.com.br',
      twitter: 'https://twitter.com/palmeiras',
      discord: 'https://discord.gg/palmeiras',
      vision: 'Celebrating the rich history and achievements of Sociedade Esportiva Palmeiras through exclusive digital badges.',
      utility: [
        'Exclusive access to Palmeiras events',
        'Priority access to future badge drops',
        'Special discounts on official merchandise',
        'Access to holder-only Discord channels'
      ],
      team: [
        {
          name: 'Leila Pereira',
          role: 'President',
          avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
          bio: 'Leading Palmeiras into the digital age'
        }
      ],
      roadmap: [
        {
          phase: 'Phase 1',
          title: 'Badge Collection',
          description: 'Launch championship badge NFTs',
          status: 'in-progress'
        },
        {
          phase: 'Phase 2',
          title: 'Stadium Integration',
          description: 'Digital badges for stadium access',
          status: 'upcoming'
        }
      ],
      mintStages: [
        {
          id: 'whitelist',
          name: 'Whitelist',
          description: 'Exclusive whitelist access',
          price: '75 CHZ',
          walletLimit: 1,
          status: 'upcoming',
          startTime: new Date('2024-02-01T00:00:00Z'),
          endTime: new Date('2024-02-03T23:59:59Z')
        },
        {
          id: 'public',
          name: 'Public',
          description: 'Open to everyone',
          price: '75 CHZ',
          walletLimit: 2,
          status: 'upcoming',
          startTime: new Date('2024-02-03T00:00:00Z'),
          endTime: new Date('2024-03-01T23:59:59Z')
        }
      ],
      createdAt: new Date('2024-01-20T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      name: 'Maracanã Legends Stadium',
      description: 'Legendary stadium collection with exclusive access to historic matches',
      image: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
      bannerImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
      type: 'launchpad',
      status: 'upcoming',
      category: 'stadiums',
      totalSupply: 200,
      minted: 0,
      price: '150 CHZ',
      creator: {
        wallet: '0x3456789012345678901234567890123456789012',
        name: 'Maracanã Stadium',
        avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png'
      },
      contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      marketplaceEnabled: false,
      launchDate: new Date('2024-02-15T00:00:00Z'),
      endDate: new Date('2024-03-15T23:59:59Z'),
      approvedAt: new Date('2024-01-25T00:00:00Z'),
      approvedBy: 'admin',
      website: 'https://maracana.com.br',
      twitter: 'https://twitter.com/maracana',
      discord: 'https://discord.gg/maracana',
      vision: 'Bringing the magic of Maracanã Stadium to the digital world with exclusive stadium NFTs.',
      utility: [
        'Exclusive stadium access experiences',
        'Priority access to historic match events',
        'Special discounts on stadium tours',
        'Access to holder-only events'
      ],
      team: [
        {
          name: 'Stadium Management',
          role: 'Stadium Director',
          avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
          bio: 'Managing the legendary Maracanã Stadium'
        }
      ],
      roadmap: [
        {
          phase: 'Phase 1',
          title: 'Stadium Collection',
          description: 'Launch stadium NFTs',
          status: 'upcoming'
        },
        {
          phase: 'Phase 2',
          title: 'Physical Access',
          description: 'Real stadium experiences for holders',
          status: 'upcoming'
        }
      ],
      mintStages: [
        {
          id: 'vip',
          name: 'VIP Access',
          description: 'Exclusive VIP access',
          price: '150 CHZ',
          walletLimit: 1,
          status: 'upcoming',
          startTime: new Date('2024-02-15T00:00:00Z'),
          endTime: new Date('2024-02-17T23:59:59Z')
        },
        {
          id: 'public',
          name: 'Public',
          description: 'Open to everyone',
          price: '150 CHZ',
          walletLimit: 1,
          status: 'upcoming',
          startTime: new Date('2024-02-17T00:00:00Z'),
          endTime: new Date('2024-03-15T23:59:59Z')
        }
      ],
      createdAt: new Date('2024-01-25T00:00:00Z'),
      updatedAt: new Date()
    },
    {
      name: 'Vasco da Gama Retro Collection',
      description: 'Vintage jerseys from the historic 1898 founding era',
      image: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
      bannerImage: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
      type: 'launchpad',
      status: 'pending_launchpad',
      category: 'jerseys',
      totalSupply: 1898,
      minted: 0,
      price: '40 CHZ',
      creator: {
        wallet: '0x4567890123456789012345678901234567890123',
        name: 'Club de Regatas Vasco da Gama',
        avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png'
      },
      contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
      marketplaceEnabled: false,
      launchDate: new Date('2024-02-20T00:00:00Z'),
      endDate: new Date('2024-03-20T23:59:59Z'),
      website: 'https://vasco.com.br',
      twitter: 'https://twitter.com/vasco',
      discord: 'https://discord.gg/vasco',
      vision: 'Honoring the rich history of Vasco da Gama with vintage jersey designs from the founding era.',
      utility: [
        'Exclusive access to Vasco events',
        'Priority access to future collections',
        'Special discounts on official merchandise',
        'Access to holder-only Discord channels'
      ],
      team: [
        {
          name: 'Vasco Management',
          role: 'Club Director',
          avatar: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
          bio: 'Leading Vasco da Gama into the digital era'
        }
      ],
      roadmap: [
        {
          phase: 'Phase 1',
          title: 'Retro Collection',
          description: 'Launch vintage jersey NFTs',
          status: 'upcoming'
        },
        {
          phase: 'Phase 2',
          title: 'Modern Integration',
          description: 'Connect with modern Vasco collections',
          status: 'upcoming'
        }
      ],
      mintStages: [
        {
          id: 'early',
          name: 'Early Access',
          description: 'Early access for supporters',
          price: '40 CHZ',
          walletLimit: 2,
          status: 'upcoming',
          startTime: new Date('2024-02-20T00:00:00Z'),
          endTime: new Date('2024-02-22T23:59:59Z')
        },
        {
          id: 'public',
          name: 'Public',
          description: 'Open to everyone',
          price: '40 CHZ',
          walletLimit: 3,
          status: 'upcoming',
          startTime: new Date('2024-02-22T00:00:00Z'),
          endTime: new Date('2024-03-20T23:59:59Z')
        }
      ],
      createdAt: new Date('2024-01-30T00:00:00Z'),
      updatedAt: new Date()
    }
  ];
  
  // Inserir coleções mock
  const result = await db.collection('collections').insertMany(mockCollections);
  
  console.log(`✅ Migrated ${result.insertedCount} mock collections`);
  
  // Log das coleções criadas
  for (const collection of mockCollections) {
    console.log(`  - ${collection.name} (${collection.type}/${collection.status})`);
  }
}

// Executar o script
if (require.main === module) {
  createCollectionsCollection()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCollectionsCollection, migrateMockCollections }; 