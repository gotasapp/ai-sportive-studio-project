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
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');

    // Buscar contagem real de NFTs mintadas no MongoDB (tokenId existe)
    const [usersCount, jerseysCount, badgesCount, stadiumsCount] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('jerseys').countDocuments({ tokenId: { $exists: true, $ne: null } }),
      db.collection('badges').countDocuments({ tokenId: { $exists: true, $ne: null } }),
      db.collection('stadiums').countDocuments({ tokenId: { $exists: true, $ne: null } })
    ]);

    const finalNFTCount = jerseysCount + badgesCount + stadiumsCount;

    // TODO: Buscar revenue, avgGenerationTime, successRate, growth reais se existir
    return {
      totalNFTs: finalNFTCount,
      totalUsers: usersCount,
      totalRevenue: 0, // TODO: Implementar cálculo real
      avgGenerationTime: 0, // TODO: Implementar cálculo real
      successRate: 0, // TODO: Implementar cálculo real
      growth: {
        nfts: 0, // TODO: Implementar cálculo real
        users: 0,
        revenue: 0
      }
    };
  } catch (error) {
    console.error("Error fetching overview from DB:", error);
    // Retorne zeros, nunca mock
    return {
      totalNFTs: 0,
      totalUsers: 0,
      totalRevenue: 0,
      avgGenerationTime: 0,
      successRate: 0,
      growth: { nfts: 0, users: 0, revenue: 0 }
    };
  }
};

const getPopularTeamsData = async () => {
  try {
    // Buscar times apenas de NFTs mintadas (tokenId existe)
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    const collections = ['jerseys', 'badges', 'stadiums'];
    const teamCounts: { [key: string]: number } = {};
    const aggregationPromises = collections.map(async (collectionName) => {
      const collection = db.collection(collectionName);
      const pipeline = [
        { $match: { tokenId: { $exists: true, $ne: null } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ];
      return withTimeout(collection.aggregate(pipeline).toArray(), 2000);
    });
    const results = await Promise.allSettled(aggregationPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((item: any) => {
          const team = item._id;
          if (team && typeof team === 'string') {
            teamCounts[team] = (teamCounts[team] || 0) + item.count;
          }
        });
      }
    });
    // Processar e filtrar times válidos
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
      'Vasco da Gama': '#000000',
      'Santos': '#ffffff',
      'Grêmio': '#0066cc',
      'Internacional': '#cc0000',
      'Arsenal': '#ff0000',
      'Chelsea': '#0033cc',
      'Liverpool': '#cc0000',
      'Manchester United': '#ff0000',
      'Manchester City': '#87ceeb',
      'Real Madrid': '#ffffff',
      'Barcelona': '#004d98',
      'Bayern Munich': '#ff0000'
    };
    const result = sortedTeams.map(team => ({
      name: team.name,
      count: team.count,
      percentage: total > 0 ? Math.round((team.count / total) * 100 * 10) / 10 : 0,
      color: teamColors[team.name] || '#666666'
    }));
    return result;
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
}

// Função para validar se uma string é um nome de time válido
const isValidTeamName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  const normalizedName = name.toLowerCase().trim();
  
  // Lista de times conhecidos (brasileiros e internacionais)
  const knownTeams = [
    'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'santos', 'vasco', 'vasco da gama',
    'grêmio', 'internacional', 'botafogo', 'atlético mineiro', 'cruzeiro', 'bahia',
    'sport', 'ceará', 'fortaleza', 'goiás', 'coritiba', 'athletico', 'red bull bragantino',
    'arsenal', 'chelsea', 'liverpool', 'manchester united', 'manchester city', 'tottenham',
    'real madrid', 'barcelona', 'atletico madrid', 'sevilla', 'valencia',
    'bayern munich', 'borussia dortmund', 'juventus', 'ac milan', 'inter milan',
    'psg', 'marseille', 'ajax', 'benfica', 'porto'
  ];
  
  // Verificar se é um time conhecido
  if (knownTeams.includes(normalizedName)) {
    return true;
  }
  
  // Filtrar palavras que NÃO são times
  const invalidWords = [
    'modern', 'classic', 'retro', 'vintage', 'home', 'away', 'third',
    'jersey', 'badge', 'stadium', 'vision', 'generated', 'custom',
    'style', 'design', 'collection', 'nft', 'mint', 'token'
  ];
  
  // Se contém palavras inválidas, não é time
  if (invalidWords.some(invalid => normalizedName.includes(invalid))) {
    return false;
  }
  
  // Se tem pelo menos 4 caracteres e não contém números, pode ser time
  return normalizedName.length >= 4 && !/\d/.test(normalizedName);
};

const getRecentSalesData = async () => {
  try {
    // TODO: Buscar vendas reais do marketplace (ex: collection 'sales' ou equivalente)
    // Exemplo: buscar últimas vendas de NFTs mintadas
    // Se não houver dados reais, retornar []
    return [];
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
}

const getChartData = async () => {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');
    // Buscar NFTs mintadas por mês
    const collections = ['jerseys', 'stadiums', 'badges'];
    const allItems: any[] = [];
    const itemPromises = collections.map(async (collectionName) => {
      return withTimeout(
        db.collection(collectionName)
          .find({ tokenId: { $exists: true, $ne: null } }, { 
            projection: { 
              createdAt: 1, 
              tags: 1,
              creatorWallet: 1,
              _id: 0 
            } 
          })
          .toArray(),
        2000
      );
    });
    const results = await Promise.allSettled(itemPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    });
    // Processar dados para gráficos reais
    const monthlyNFTs = await getMonthlyStatsFromDB(allItems);
    const userGrowth = getUserGrowthStatsFromDB(allItems);
    // Popular teams chart
    const teamData = await getPopularTeamsData();
    const teamDistribution = teamData.slice(0, 5).map((team: any) => ({
      name: team.name,
      value: team.count
    }));
    return {
      monthlyNFTs,
      teamDistribution,
      userGrowth
    };
  } catch (error) {
    console.error('Error fetching chart data from DB:', error);
    return {
      monthlyNFTs: [],
      teamDistribution: [],
      userGrowth: []
    };
  }
};

const getMonthlyStatsFromDB = async (items: any[]) => {
  // TODO: Implementar lógica real baseada em createdAt de NFTs mintadas
  // Por enquanto, retorna vazio se não houver dados
  return [];
};

const getUserGrowthStatsFromDB = (items: any[]) => {
  // TODO: Implementar lógica real baseada em createdAt/creatorWallet de NFTs mintadas
  // Por enquanto, retorna vazio se não houver dados
  return [];
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric');

  try {
    let data;
    const operationTimeout = 8000; // 8 segundos
    const operation = async () => {
      switch (metric) {
        case 'overview':
          return await getAnalyticsOverview();
        case 'popularTeams':
          return await getPopularTeamsData();
        case 'recentSales':
          return await getRecentSalesData();
        case 'chartData':
          return await getChartData();
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
    // Nunca retornar mock, apenas vazio/zeros
    let fallbackData;
    switch (metric) {
      case 'overview':
        fallbackData = {
          totalNFTs: 0,
          totalUsers: 0,
          totalRevenue: 0,
          avgGenerationTime: 0,
          successRate: 0,
          growth: { nfts: 0, users: 0, revenue: 0 }
        };
        break;
      case 'popularTeams':
        fallbackData = [];
        break;
      case 'recentSales':
        fallbackData = [];
        break;
      case 'chartData':
        fallbackData = {
          monthlyNFTs: [],
          teamDistribution: [],
          userGrowth: []
        };
        break;
      default:
        fallbackData = {
          totalNFTs: 0,
          totalUsers: 0,
          totalRevenue: 0,
          avgGenerationTime: 0,
          successRate: 0,
          growth: { nfts: 0, users: 0, revenue: 0 }
        };
    }
    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30'
      }
    });
  }
} 