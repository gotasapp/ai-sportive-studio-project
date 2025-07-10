import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('logs');

    // Sample logs focused on NFT and user activities
    const sampleLogs = [
      // NFT Minting logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        level: 'success',
        message: 'NFT minted successfully: Flamengo Jersey #001',
        actor: {
          type: 'user',
          id: '0x1234...5678',
          name: 'user_123'
        },
        context: {
          tokenId: '001',
          collection: 'Flamengo Jersey',
          mintDuration: 2500,
          team: 'Flamengo',
          ipfsHash: 'QmXxYyZz...'
        },
        category: 'nft',
        tags: ['mint', 'jersey', 'flamengo']
      },
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        level: 'success',
        message: 'NFT minted successfully: Palmeiras Stadium #002',
        actor: {
          type: 'user',
          id: '0x9876...5432',
          name: 'palmeiras_fan'
        },
        context: {
          tokenId: '002',
          collection: 'Palmeiras Stadium',
          mintDuration: 3200,
          team: 'Palmeiras',
          ipfsHash: 'QmAaBbCc...'
        },
        category: 'stadium',
        tags: ['mint', 'stadium', 'palmeiras']
      },
      // Marketplace activity logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
        level: 'success',
        message: 'NFT sold: Corinthians Badge #003 for 0.5 CHZ',
        actor: {
          type: 'user',
          id: '0x5555...9999',
          name: 'seller_user'
        },
        context: {
          tokenId: '003',
          collection: 'Corinthians Badge',
          price: '0.5 CHZ',
          seller: '0x5555...9999',
          buyer: '0x1111...2222',
          team: 'Corinthians'
        },
        category: 'marketplace',
        tags: ['sale', 'badge', 'corinthians']
      },
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
        level: 'success',
        message: 'NFT purchased: Santos Jersey #004 for 1.2 CHZ',
        actor: {
          type: 'user',
          id: '0x1111...2222',
          name: 'collector_99'
        },
        context: {
          tokenId: '004',
          collection: 'Santos Jersey',
          price: '1.2 CHZ',
          buyer: '0x1111...2222',
          team: 'Santos'
        },
        category: 'marketplace',
        tags: ['purchase', 'jersey', 'santos']
      },
      // User activity logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000),
        level: 'success',
        message: 'New user registered: flamengo_supporter',
        actor: {
          type: 'user',
          id: '0x3333...4444',
          name: 'flamengo_supporter'
        },
        context: {
          walletAddress: '0x3333...4444',
          username: 'flamengo_supporter',
          registrationMethod: 'wallet'
        },
        category: 'user',
        tags: ['registration', 'new_user']
      },
      // NFT mint timing logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
        level: 'info',
        message: 'NFT mint completed: Vasco Jersey #005 (1800ms)',
        actor: {
          type: 'system',
          id: 'mint-system',
          name: 'NFT Mint System'
        },
        context: {
          tokenId: '005',
          collection: 'Vasco Jersey',
          mintDuration: 1800,
          team: 'Vasco',
          gasUsed: '150000'
        },
        category: 'nft',
        tags: ['mint_timing', 'performance']
      },
      // Error log
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
        level: 'error',
        message: 'Failed to mint NFT: insufficient funds',
        actor: {
          type: 'user',
          id: '0x7777...8888',
          name: 'low_balance_user'
        },
        context: {
          errorCode: 'INSUFFICIENT_FUNDS',
          requiredBalance: '0.01 CHZ',
          userBalance: '0.005 CHZ',
          team: 'Botafogo'
        },
        category: 'nft',
        tags: ['error', 'mint_failed', 'insufficient_funds']
      },
      // Jersey creation logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000),
        level: 'success',
        message: 'Jersey design generated: Real Madrid Away Jersey',
        actor: {
          type: 'user',
          id: '0x9999...0000',
          name: 'designer_pro'
        },
        context: {
          jerseyType: 'away',
          team: 'Real Madrid',
          designId: 'rm_away_001',
          aiModel: 'dalle-3',
          generationTime: 4500
        },
        category: 'jersey',
        tags: ['design', 'generation', 'real_madrid']
      },
      // Badge creation logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000),
        level: 'success',
        message: 'Badge created: Champions League Winner 2024',
        actor: {
          type: 'user',
          id: '0x4444...5555',
          name: 'badge_creator'
        },
        context: {
          badgeType: 'achievement',
          title: 'Champions League Winner 2024',
          rarity: 'legendary',
          team: 'Manchester City'
        },
        category: 'badge',
        tags: ['creation', 'achievement', 'champions_league']
      },
      // Stadium creation logs
      {
        _id: new ObjectId(),
        timestamp: new Date(Date.now() - Math.random() * 16 * 60 * 60 * 1000),
        level: 'success',
        message: 'Stadium NFT created: Anfield Stadium',
        actor: {
          type: 'user',
          id: '0x6666...7777',
          name: 'liverpool_fan'
        },
        context: {
          stadiumName: 'Anfield Stadium',
          team: 'Liverpool',
          capacity: '54074',
          lighting: 'night',
          atmosphere: 'match_day'
        },
        category: 'stadium',
        tags: ['creation', 'anfield', 'liverpool']
      }
    ];

    // Clear existing sample logs first
    await collection.deleteMany({ 
      'context.sample': true 
    });

    // Add sample marker to all logs
    const logsWithSample = sampleLogs.map(log => ({
      ...log,
      context: {
        ...log.context,
        sample: true
      }
    }));

    // Insert sample logs
    await collection.insertMany(logsWithSample);

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${sampleLogs.length} sample logs focused on NFT and user activities`,
      categories: ['nft', 'marketplace', 'user', 'jersey', 'stadium', 'badge'],
      count: sampleLogs.length
    });
  } catch (error) {
    console.error('Error generating sample logs:', error);
    return NextResponse.json(
      { error: 'Failed to generate sample logs' },
      { status: 500 }
    );
  }
} 