const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'chz-app-db';

// Sample data for testing
const sampleTeamReferences = [
  {
    teamName: 'Flamengo',
    category: 'jersey',
    referenceImages: [
      {
        id: 'img_flamengo_1',
        url: 'https://example.com/flamengo-home.jpg',
        filename: 'flamengo-home.jpg',
        uploadedAt: new Date(),
        description: 'Flamengo home jersey - red and black stripes',
        isPrimary: true,
        metadata: {
          width: 1024,
          height: 1024,
          size: 256000,
          format: 'jpg'
        }
      },
      {
        id: 'img_flamengo_2',
        url: 'https://example.com/flamengo-away.jpg',
        filename: 'flamengo-away.jpg',
        uploadedAt: new Date(),
        description: 'Flamengo away jersey - white with red details',
        isPrimary: false,
        metadata: {
          width: 1024,
          height: 1024,
          size: 245000,
          format: 'jpg'
        }
      }
    ],
    teamBasePrompt: 'Flamengo jersey should emphasize the traditional red and black stripes, include the team crest prominently, and maintain the classic Brazilian football aesthetic with modern design elements.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  {
    teamName: 'Palmeiras',
    category: 'jersey',
    referenceImages: [
      {
        id: 'img_palmeiras_1',
        url: 'https://example.com/palmeiras-home.jpg',
        filename: 'palmeiras-home.jpg',
        uploadedAt: new Date(),
        description: 'Palmeiras home jersey - green and white',
        isPrimary: true,
        metadata: {
          width: 1024,
          height: 1024,
          size: 267000,
          format: 'jpg'
        }
      }
    ],
    teamBasePrompt: 'Palmeiras jersey should emphasize the traditional green color with white details, include the palm tree symbol, and represent the historic Brazilian club with elegant design.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  {
    teamName: 'Corinthians',
    category: 'jersey',
    referenceImages: [
      {
        id: 'img_corinthians_1',
        url: 'https://example.com/corinthians-home.jpg',
        filename: 'corinthians-home.jpg',
        uploadedAt: new Date(),
        description: 'Corinthians home jersey - white with black details',
        isPrimary: true,
        metadata: {
          width: 1024,
          height: 1024,
          size: 234000,
          format: 'jpg'
        }
      }
    ],
    teamBasePrompt: 'Corinthians jersey should emphasize the traditional white color with black details, include the team crest, and maintain the classic São Paulo club aesthetic.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  // Stadium references
  {
    teamName: 'Maracanã',
    category: 'stadium',
    referenceImages: [
      {
        id: 'img_maracana_1',
        url: 'https://example.com/maracana-exterior.jpg',
        filename: 'maracana-exterior.jpg',
        uploadedAt: new Date(),
        description: 'Maracanã stadium exterior view',
        isPrimary: true,
        metadata: {
          width: 1920,
          height: 1080,
          size: 456000,
          format: 'jpg'
        }
      }
    ],
    teamBasePrompt: 'Maracanã stadium should emphasize the iconic circular architecture, massive capacity, and historic significance as the temple of Brazilian football.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  {
    teamName: 'Allianz Parque',
    category: 'stadium',
    referenceImages: [
      {
        id: 'img_allianz_1',
        url: 'https://example.com/allianz-parque.jpg',
        filename: 'allianz-parque.jpg',
        uploadedAt: new Date(),
        description: 'Allianz Parque modern stadium',
        isPrimary: true,
        metadata: {
          width: 1920,
          height: 1080,
          size: 512000,
          format: 'jpg'
        }
      }
    ],
    teamBasePrompt: 'Allianz Parque should emphasize the modern architecture, green lighting, and state-of-the-art facilities of Palmeiras home stadium.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  // Badge references
  {
    teamName: 'Flamengo',
    category: 'badge',
    referenceImages: [
      {
        id: 'img_flamengo_badge_1',
        url: 'https://example.com/flamengo-badge.png',
        filename: 'flamengo-badge.png',
        uploadedAt: new Date(),
        description: 'Flamengo official badge',
        isPrimary: true,
        metadata: {
          width: 512,
          height: 512,
          size: 89000,
          format: 'png'
        }
      }
    ],
    teamBasePrompt: 'Flamengo badge should feature the traditional red and black colors, the vulture symbol, and the classic Brazilian football club heraldry.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  },
  {
    teamName: 'Palmeiras',
    category: 'badge',
    referenceImages: [
      {
        id: 'img_palmeiras_badge_1',
        url: 'https://example.com/palmeiras-badge.png',
        filename: 'palmeiras-badge.png',
        uploadedAt: new Date(),
        description: 'Palmeiras official badge',
        isPrimary: true,
        metadata: {
          width: 512,
          height: 512,
          size: 76000,
          format: 'png'
        }
      }
    ],
    teamBasePrompt: 'Palmeiras badge should feature the traditional green color, the palm tree symbol, and the historic São Paulo club emblem design.',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  }
];

async function initVisionRevampDatabase() {
  console.log('🚀 Initializing Vision Generation Revamp Database...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // 1. Create team_references collection
    console.log('📦 Creating team_references collection...');
    const teamReferencesCollection = db.collection('team_references');
    
    // Clear existing data (optional - remove in production)
    await teamReferencesCollection.deleteMany({});
    console.log('🧹 Cleared existing team references');
    
    // Insert sample data
    await teamReferencesCollection.insertMany(sampleTeamReferences);
    console.log(`✅ Inserted ${sampleTeamReferences.length} team references`);
    
    // 2. Create vision_analysis_cache collection
    console.log('📦 Creating vision_analysis_cache collection...');
    const visionCacheCollection = db.collection('vision_analysis_cache');
    
    // Clear existing cache
    await visionCacheCollection.deleteMany({});
    console.log('🧹 Cleared existing vision analysis cache');
    
    // 3. Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    // Team references indexes
    await teamReferencesCollection.createIndex({ teamName: 1, category: 1 }, { unique: true });
    await teamReferencesCollection.createIndex({ category: 1 });
    await teamReferencesCollection.createIndex({ isActive: 1 });
    await teamReferencesCollection.createIndex({ createdAt: -1 });
    
    // Vision analysis cache indexes
    await visionCacheCollection.createIndex({ teamName: 1, category: 1 });
    await visionCacheCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await visionCacheCollection.createIndex({ isValid: 1 });
    
    console.log('✅ Indexes created successfully');
    
    // 4. Verify data
    console.log('\n📊 Verifying data...');
    const jerseyCount = await teamReferencesCollection.countDocuments({ category: 'jersey' });
    const stadiumCount = await teamReferencesCollection.countDocuments({ category: 'stadium' });
    const badgeCount = await teamReferencesCollection.countDocuments({ category: 'badge' });
    
    console.log(`  - Jersey references: ${jerseyCount}`);
    console.log(`  - Stadium references: ${stadiumCount}`);
    console.log(`  - Badge references: ${badgeCount}`);
    console.log(`  - Total references: ${jerseyCount + stadiumCount + badgeCount}`);
    
    // 5. List all team names by category
    console.log('\n🏆 Available teams by category:');
    
    const jerseyTeams = await teamReferencesCollection
      .find({ category: 'jersey' }, { projection: { teamName: 1 } })
      .toArray();
    console.log(`  - Jersey teams: ${jerseyTeams.map(t => t.teamName).join(', ')}`);
    
    const stadiumTeams = await teamReferencesCollection
      .find({ category: 'stadium' }, { projection: { teamName: 1 } })
      .toArray();
    console.log(`  - Stadium teams: ${stadiumTeams.map(t => t.teamName).join(', ')}`);
    
    const badgeTeams = await teamReferencesCollection
      .find({ category: 'badge' }, { projection: { teamName: 1 } })
      .toArray();
    console.log(`  - Badge teams: ${badgeTeams.map(t => t.teamName).join(', ')}`);
    
    console.log('\n🎉 Vision Generation Revamp Database initialized successfully!');
    console.log('\n🔧 Next steps:');
    console.log('  1. Create CRUD APIs for admin management');
    console.log('  2. Update admin pages to manage team references');
    console.log('  3. Modify generation logic to use Vision + team references');
    console.log('  4. Test the complete flow');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await client.close();
    console.log('📦 Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initVisionRevampDatabase()
    .then(() => {
      console.log('✅ Initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initVisionRevampDatabase }; 