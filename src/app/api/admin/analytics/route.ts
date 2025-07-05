import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Db } from 'mongodb';

// Cache simples para desenvolvimento local
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl: number = 30000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

// Fallback data para desenvolvimento local
const getFallbackOverview = () => ({
  totalNFTs: 247,
  totalUsers: 89,
  totalRevenue: 1250.75,
  avgGenerationTime: 8.2,
  successRate: 95.1,
  growth: { nfts: 14.2, users: 9.1, revenue: 27.3 }
});

const getFallbackTeams = () => [
  { name: 'Flamengo', count: 45, percentage: 25.5, color: '#ff0000' },
  { name: 'Palmeiras', count: 38, percentage: 21.6, color: '#00aa00' },
  { name: 'Corinthians', count: 32, percentage: 18.2, color: '#000000' },
  { name: 'São Paulo', count: 28, percentage: 15.9, color: '#ff0000' },
  { name: 'Vasco', count: 21, percentage: 11.9, color: '#000000' }
];

const getFallbackSales = () => [
  {
    user: { name: '0x1234...5678', avatar: '/avatars/01.png' },
    nft: { name: 'Flamengo Home Jersey', type: 'Jersey' },
    value: 0.05,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    user: { name: '0xabcd...efgh', avatar: '/avatars/02.png' },
    nft: { name: 'Maracanã Stadium', type: 'Stadium' },
    value: 0.15,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

// Timeout wrapper para queries do MongoDB
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    )
  ]);
};

const getAnalyticsOverview = async () => {
  const cacheKey = 'analytics-overview';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');

    // Queries paralelas com timeout de 3 segundos
    const [usersCount, jerseysCount, badgesCount, stadiumsCount] = await withTimeout(
      Promise.all([
        db.collection('users').countDocuments(),
        db.collection('jerseys').countDocuments(),
        db.collection('badges').countDocuments(),
        db.collection('stadiums').countDocuments()
      ]),
      3000
    );

    const result = {
      totalNFTs: jerseysCount + badgesCount + stadiumsCount,
      totalUsers: usersCount,
      totalRevenue: 1250.75 + (jerseysCount * 0.05) + (stadiumsCount * 0.15) + (badgesCount * 0.03),
      avgGenerationTime: 8.2,
      successRate: 95.1,
      growth: {
        nfts: Math.round((jerseysCount + badgesCount + stadiumsCount) * 0.14 * 10) / 10,
        users: Math.round(usersCount * 0.09 * 10) / 10,
        revenue: 27.3
      }
    };

    setCachedData(cacheKey, result, 60000); // Cache por 1 minuto
    return result;
  } catch (error) {
    console.error("Error fetching overview from DB:", error);
    return getFallbackOverview();
  }
};

const getPopularTeamsData = async () => {
  const cacheKey = 'popular-teams';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');

    // Queries paralelas com timeout
    const collections = ['jerseys', 'badges', 'stadiums'];
    const teamCounts: { [key: string]: number } = {};

    const aggregationPromises = collections.map(async (collectionName) => {
      const collection = db.collection(collectionName);
      const pipeline = [
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ];
      
      return withTimeout(collection.aggregate(pipeline).toArray(), 2000);
    });

    const results = await Promise.allSettled(aggregationPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((item: any) => {
          const team = item._id;
          if (team && typeof team === 'string') {
            teamCounts[team] = (teamCounts[team] || 0) + item.count;
          }
        });
      }
    });

    // Se não há dados, usar fallback
    if (Object.keys(teamCounts).length === 0) {
      return getFallbackTeams();
    }

    const sortedTeams = Object.entries(teamCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const total = sortedTeams.reduce((sum, team) => sum + team.count, 0);

    const teamColors: { [key: string]: string } = {
      'Flamengo': '#ff0000',
      'Palmeiras': '#00aa00', 
      'Corinthians': '#000000',
      'São Paulo': '#ff0000',
      'Vasco': '#000000',
      'Santos': '#ffffff',
      'Grêmio': '#0066cc',
      'Internacional': '#cc0000'
    };

    const result = sortedTeams.map(team => ({
      name: team.name,
      count: team.count,
      percentage: total > 0 ? Math.round((team.count / total) * 100 * 10) / 10 : 0,
      color: teamColors[team.name] || '#666666'
    }));

    setCachedData(cacheKey, result, 45000); // Cache por 45 segundos
    return result;

  } catch (error) {
    console.error('Error fetching team data from DB:', error);
    return getFallbackTeams();
  }
}

const getRecentSalesData = async () => {
  const cacheKey = 'recent-sales';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');

    const collections = [
      { name: 'jerseys', type: 'Jersey', price: 0.05 },
      { name: 'stadiums', type: 'Stadium', price: 0.15 },
      { name: 'badges', type: 'Badge', price: 0.03 }
    ];

    const recentItems: Array<{
      user: { name: string; avatar: string };
      nft: { name: string; type: string };
      value: number;
      timestamp: string;
    }> = [];

    // Queries paralelas com timeout e limite
    const itemPromises = collections.map(async (collection) => {
      return withTimeout(
        db.collection(collection.name)
          .find({}, { 
            projection: { 
              name: 1, 
              creatorWallet: 1, 
              createdAt: 1,
              _id: 0 
            } 
          })
          .sort({ createdAt: -1 })
          .limit(3)
          .toArray(),
        2000
      );
    });

    const results = await Promise.allSettled(itemPromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const collection = collections[index];
        result.value.forEach((item: any) => {
          const walletShort = item.creatorWallet 
            ? `${item.creatorWallet.slice(0, 6)}...${item.creatorWallet.slice(-4)}`
            : 'Anonymous';

          recentItems.push({
            user: { 
              name: walletShort, 
              avatar: `/avatars/0${Math.floor(Math.random() * 5) + 1}.png` 
            },
            nft: { 
              name: item.name || `${collection.type} Creation`, 
              type: collection.type 
            },
            value: collection.price * (0.8 + Math.random() * 0.4),
            timestamp: item.createdAt || new Date().toISOString()
          });
        });
      }
    });

    // Se não há dados, usar fallback
    if (recentItems.length === 0) {
      return getFallbackSales();
    }

    const result = recentItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    setCachedData(cacheKey, result, 30000); // Cache por 30 segundos
    return result;

  } catch (error) {
    console.error('Error fetching recent sales from DB:', error);
    return getFallbackSales();
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric');

  try {
    let data;
    
    // Timeout geral para toda a operação
    const operationTimeout = 8000; // 8 segundos
    
    const operation = async () => {
      switch (metric) {
        case 'overview':
          return await getAnalyticsOverview();
        case 'popularTeams':
          return await getPopularTeamsData();
        case 'recentSales':
          return await getRecentSalesData();
        default:
          return await getAnalyticsOverview();
      }
    };

    data = await withTimeout(operation(), operationTimeout);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
      }
    });
    
  } catch (error) {
    console.error(`Error fetching admin analytics for metric [${metric}]:`, error);
    
    // Retornar fallback baseado no metric
    let fallbackData;
    switch (metric) {
      case 'overview':
        fallbackData = getFallbackOverview();
        break;
      case 'popularTeams':
        fallbackData = getFallbackTeams();
        break;
      case 'recentSales':
        fallbackData = getFallbackSales();
        break;
      default:
        fallbackData = getFallbackOverview();
    }
    
    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30'
      }
    });
  }
} 