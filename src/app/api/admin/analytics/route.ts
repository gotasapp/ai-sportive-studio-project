import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Db } from 'mongodb';

// No futuro, estes dados virão de um banco de dados, cache ou outra fonte de dados real.
const getAnalyticsOverview = async () => {
  try {
    const client = await clientPromise;
    const db = client.db('chz-app-db');

    const usersCount = await db.collection('users').countDocuments();
    const jerseysCount = await db.collection('jerseys').countDocuments();
    const badgesCount = await db.collection('badges').countDocuments();
    const stadiumsCount = await db.collection('stadiums').countDocuments();

    return {
      totalNFTs: jerseysCount + badgesCount + stadiumsCount,
      totalUsers: usersCount,
      totalRevenue: 51048.75, // Mocked for now
      avgGenerationTime: 8.2, // Mocked for now
      successRate: 95.1, // Mocked for now
      growth: { // Mocked for now
        nfts: 14.2,
        users: 9.1,
        revenue: 27.3
      }
    };
  } catch (error) {
    console.error("Error fetching overview from DB:", error);
    // Retornar um objeto de erro para ser tratado no handler principal
    throw new Error("Database query for overview failed");
  }
};

const getPopularTeamsData = async () => {
    return [
        { name: 'Flamengo', count: 2912, percentage: 18.5, color: '#ff0000' },
        { name: 'Palmeiras', count: 2203, percentage: 14.1, color: '#00aa00' },
        { name: 'Corinthians', count: 1988, percentage: 12.6, color: '#000000' },
        { name: 'São Paulo', count: 1721, percentage: 11.0, color: '#ff0000' },
        { name: 'Vasco', count: 1295, percentage: 8.2, color: '#000000' },
        { name: 'Santos', count: 1140, percentage: 7.2, color: '#ffffff' },
        { name: 'Grêmio', count: 1011, percentage: 6.4, color: '#0066cc' },
        { name: 'Internacional', count: 902, percentage: 5.7, color: '#cc0000' }
    ];
}

const getRecentSalesData = async () => {
    // Simulação de dados de vendas recentes
    return [
        {
            user: { name: 'CryptoKing', avatar: '/avatars/01.png' },
            nft: { name: 'Flamengo 81 Zico', type: 'Jersey' },
            value: 150.75,
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutos atrás
        },
        {
            user: { name: 'NFTCollector', avatar: '/avatars/02.png' },
            nft: { name: 'Maracanã Panorâmico', type: 'Stadium' },
            value: 320.50,
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutos atrás
        },
        {
            user: { name: 'ArtFan', avatar: '/avatars/03.png' },
            nft: { name: 'Palmeiras Cyber', type: 'Jersey' },
            value: 180.00,
            timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString() // 55 minutos atrás
        },
        {
            user: { name: 'Vascaino.eth', avatar: '/avatars/04.png' },
            nft: { name: 'Badge Conquista', type: 'Badge' },
            value: 75.25,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 horas atrás
        },
        {
            user: { name: 'SPFC_Hodler', avatar: '/avatars/05.png' },
            nft: { name: 'Morumbi Noturno', type: 'Stadium' },
            value: 290.00,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 horas atrás
        }
    ];
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric');

  try {
    let data;
    switch (metric) {
      case 'overview':
        data = await getAnalyticsOverview();
        break;
      case 'popularTeams':
        data = await getPopularTeamsData();
        break;
      case 'recentSales':
        data = await getRecentSalesData();
        break;
      // Por padrão, ou se nenhum métrica for especificada, retornamos o overview
      default:
        data = await getAnalyticsOverview();
        break;
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching admin analytics for metric [${metric}]:`, error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
} 