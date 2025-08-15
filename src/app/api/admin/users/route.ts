import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Collection, Db } from 'mongodb';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs, totalSupply } from 'thirdweb/extensions/erc721';

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

// Configuração Thirdweb
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

// Contratos conhecidos para buscar NFTs
const KNOWN_CONTRACTS = [
  process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS || '0xYourContractAddress'
].filter(Boolean);

// Função para buscar dados da blockchain para um usuário
async function getBlockchainData(walletAddress: string) {
  if (!walletAddress || !thirdwebClient.clientId) {
    return { onChainNFTs: 0, contractInteractions: 0 };
  }

  try {
    let totalOnChainNFTs = 0;
    let contractInteractions = 0;

    for (const contractAddress of KNOWN_CONTRACTS) {
      try {
        const contract = getContract({
          client: thirdwebClient,
          chain: polygonAmoy,
          address: contractAddress,
        });

        // Buscar NFTs do usuário neste contrato
        const userNFTs = await getNFTs({
          contract,
          start: 0,
          count: 100, // Ajustar conforme necessário
        });

        // Filtrar NFTs que pertencem ao usuário (simplificado)
        const userOwnedNFTs = userNFTs.filter(nft => 
          nft.owner?.toLowerCase() === walletAddress.toLowerCase()
        );

        totalOnChainNFTs += userOwnedNFTs.length;
        contractInteractions += userOwnedNFTs.length; // Cada NFT é uma interação

        console.log(`📊 User ${walletAddress}: ${userOwnedNFTs.length} NFTs in contract ${contractAddress}`);
        
      } catch (contractError) {
        console.log(`⚠️ Could not fetch data from contract ${contractAddress}:`, contractError);
      }
    }

    return { onChainNFTs: totalOnChainNFTs, contractInteractions };
    
  } catch (error) {
    console.log(`⚠️ Could not fetch blockchain data for ${walletAddress}:`, error);
    return { onChainNFTs: 0, contractInteractions: 0 };
  }
}


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
        let blockchainData = { onChainNFTs: 0, contractInteractions: 0 };

        // Contar NFTs criados por este usuário (MongoDB)
        try {
          const userWallet = user.wallet?.toLowerCase();
          if (userWallet) {
            // Buscar dados do MongoDB
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

            // Buscar dados da blockchain (Thirdweb)
            try {
              blockchainData = await getBlockchainData(userWallet);
              console.log(`🔗 Blockchain data for ${userWallet}:`, blockchainData);
            } catch (blockchainError) {
              console.log(`⚠️ Could not fetch blockchain data for ${userWallet}:`, blockchainError);
            }

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
              .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime())[0];

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
          
          // 🔗 DADOS DA BLOCKCHAIN (Thirdweb)
          blockchain: {
            onChainNFTs: blockchainData.onChainNFTs,
            contractInteractions: blockchainData.contractInteractions,
            isOnChainActive: blockchainData.onChainNFTs > 0
          },
          
          // Estatísticas
          stats: {
            nftsCreated,
            onChainNFTs: blockchainData.onChainNFTs,
            totalNFTs: nftsCreated + blockchainData.onChainNFTs, // MongoDB + Blockchain
            contractInteractions: blockchainData.contractInteractions,
            daysSinceJoined: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            daysSinceActivity: lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : 0
          }
        };
      })
    );

    console.log(`✅ Enhanced ${enrichedUsers.length} users with NFT stats`);

    // Calcular estatísticas gerais (MongoDB + Blockchain)
    const stats = {
      totalUsers: enrichedUsers.length,
      activeUsers: enrichedUsers.filter(u => u.status === 'Active').length,
      inactiveUsers: enrichedUsers.filter(u => u.status === 'Inactive').length,
      bannedUsers: enrichedUsers.filter(u => u.status === 'Banned').length,
      usersWithNFTs: enrichedUsers.filter(u => u.nftsCreated > 0).length,
      usersWithLinkedAccounts: enrichedUsers.filter(u => u.hasLinkedAccounts).length,
      totalNFTsCreated: enrichedUsers.reduce((total, u) => total + u.nftsCreated, 0),
      
      // 🔗 ESTATÍSTICAS DA BLOCKCHAIN
      usersWithOnChainNFTs: enrichedUsers.filter(u => u.blockchain?.onChainNFTs > 0).length,
      totalOnChainNFTs: enrichedUsers.reduce((total, u) => total + (u.blockchain?.onChainNFTs || 0), 0),
      totalContractInteractions: enrichedUsers.reduce((total, u) => total + (u.blockchain?.contractInteractions || 0), 0),
      usersWithOnChainActivity: enrichedUsers.filter(u => u.blockchain?.isOnChainActive).length,
      
      // Novos usuários (últimos 30 dias)
      newUsers: enrichedUsers.filter(u => {
        if (!u.joinedAt) return false;
        const daysSinceJoined = (Date.now() - new Date(u.joinedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceJoined <= 30;
      }).length,
      
      // 📊 ESTATÍSTICAS COMBINADAS
      totalNFTsAllSources: enrichedUsers.reduce((total, u) => total + u.stats.totalNFTs, 0)
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