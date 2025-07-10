import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';

// Definindo o nome do banco de dados e da coleção
const DB_NAME = 'chz-app-db';
const COLLECTION_NAME = 'users';

let db: Db;
let users: Collection;

// Função de inicialização para conectar ao DB e à coleção
async function init() {
  if (db && users) {
    return;
  }
  try {
    const client = await clientPromise;
    db = client.db(DB_NAME);
    users = db.collection(COLLECTION_NAME);
  } catch (error) {
    throw new Error('Failed to connect to the database.');
  }
}

// Inicializa a conexão
(async () => {
  await init();
})();


export async function GET() {
  try {
    // Garante que a conexão está ativa
    if (!users) await init();

    console.log('📊 Fetching all users with enhanced data...');

    // Buscar todos os usuários
    const allUsers = await users.find({}).toArray();
    console.log(`👥 Found ${allUsers.length} users in database`);

    // Buscar estatísticas de NFTs por usuário em paralelo
    const collections = ['jerseys', 'stadiums', 'badges'];
    const nftCollections = await Promise.all(
      collections.map(name => db.collection(name))
    );

    // Enriquecer dados dos usuários com contagem de NFTs e outras informações
    const enrichedUsers = await Promise.all(
      allUsers.map(async (user) => {
        let nftsCreated = 0;
        let lastActivity = user.updatedAt || user.createdAt;

        // Contar NFTs criados por este usuário
        try {
          const userWallet = user.wallet?.toLowerCase();
          if (userWallet) {
            const nftCounts = await Promise.all(
              nftCollections.map(collection => 
                collection.countDocuments({
                  $or: [
                    { creatorWallet: userWallet },
                    { 'creator.wallet': userWallet },
                    { owner: userWallet }
                  ]
                })
              )
            );
            nftsCreated = nftCounts.reduce((total, count) => total + count, 0);

            // Buscar última atividade (último NFT criado)
            const latestNFT = await Promise.all(
              nftCollections.map(collection =>
                collection.findOne(
                  {
                    $or: [
                      { creatorWallet: userWallet },
                      { 'creator.wallet': userWallet },
                      { owner: userWallet }
                    ]
                  },
                  { sort: { createdAt: -1 } }
                )
              )
            );

            const mostRecentNFT = latestNFT
              .filter(nft => nft !== null)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            if (mostRecentNFT) {
              lastActivity = mostRecentNFT.createdAt;
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not fetch NFT stats for user ${user._id}`);
        }

        // Determinar status baseado na atividade
        let status: 'Active' | 'Inactive' | 'Banned' = 'Active';
        if (lastActivity) {
          const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceActivity > 30) {
            status = 'Inactive';
          }
        }

        return {
          ...user,
          _id: user._id.toString(),
          nftsCreated,
          lastActivity,
          status: user.status || status, // Usar status existente ou calculado
          
          // Dados adicionais para o frontend
          displayName: user.name || user.linkedAccounts?.email || 'Anonymous User',
          hasLinkedAccounts: !!(user.linkedAccounts?.email || user.linkedAccounts?.discord || user.linkedAccounts?.twitter),
          joinedAt: user.createdAt || new Date(),
          
          // Estatísticas
          stats: {
            nftsCreated,
            daysSinceJoined: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            daysSinceActivity: lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : 0
          }
        };
      })
    );

    console.log(`✅ Enhanced ${enrichedUsers.length} users with NFT stats`);

    // Calcular estatísticas gerais
    const stats = {
      totalUsers: enrichedUsers.length,
      activeUsers: enrichedUsers.filter(u => u.status === 'Active').length,
      inactiveUsers: enrichedUsers.filter(u => u.status === 'Inactive').length,
      bannedUsers: enrichedUsers.filter(u => u.status === 'Banned').length,
      usersWithNFTs: enrichedUsers.filter(u => u.nftsCreated > 0).length,
      usersWithLinkedAccounts: enrichedUsers.filter(u => u.hasLinkedAccounts).length,
      totalNFTsCreated: enrichedUsers.reduce((total, u) => total + u.nftsCreated, 0),
      
      // Novos usuários (últimos 30 dias)
      newUsers: enrichedUsers.filter(u => {
        if (!u.createdAt) return false;
        const daysSinceJoined = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceJoined <= 30;
      }).length
    };

    return NextResponse.json({
      users: enrichedUsers,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    
    // Se o erro for de conexão, podemos retornar uma mensagem mais específica
    if (error instanceof Error && error.message.includes('database')) {
        return NextResponse.json({ error: error.message }, { status: 503 }); // Service Unavailable
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 