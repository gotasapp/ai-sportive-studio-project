import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFT, ownerOf } from 'thirdweb/extensions/erc721';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db';
const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Função para determinar a categoria baseada no tokenId
function determineCategoryFromTokenId(tokenId: number): 'jerseys' | 'stadiums' | 'badges' {
  // Baseado nos dados que vimos:
  // Tokens 0-8: jerseys
  // Tokens 9-12: stadiums  
  // Tokens 13+: jerseys
  
  if (tokenId >= 9 && tokenId <= 12) {
    return 'stadiums';
  }
  
  // Para tokens muito altos, pode ser badges
  if (tokenId > 50) {
    return 'badges';
  }
  
  return 'jerseys'; // Default
}

// Função para gerar metadata padrão para NFTs sem metadata
function generateFallbackMetadata(tokenId: number, owner: string) {
  const category = determineCategoryFromTokenId(tokenId);
  
  const teamNames = ['Flamengo', 'Palmeiras', 'Corinthians', 'Vasco', 'São Paulo'];
  const playerNames = ['JEFF', 'KOBE', 'LEBRON', 'DINAMITE', 'RONALDO'];
  const numbers = ['10', '7', '9', '24', '11'];
  
  const randomTeam = teamNames[tokenId % teamNames.length];
  const randomPlayer = playerNames[tokenId % playerNames.length];
  const randomNumber = numbers[tokenId % numbers.length];
  
  if (category === 'stadiums') {
    const stadiumNames = ['Arena', 'Stadium', 'Park', 'Ground'];
    const randomStadium = stadiumNames[tokenId % stadiumNames.length];
    
    return {
      name: `${randomTeam} ${randomStadium} NFT`,
      description: `AI-generated stadium NFT for ${randomTeam}`,
      image: '', // Será preenchido depois
      attributes: [
        { trait_type: 'Type', value: 'Stadium' },
        { trait_type: 'Team', value: randomTeam },
        { trait_type: 'Category', value: 'stadiums' },
        { trait_type: 'Token ID', value: tokenId.toString() }
      ]
    };
  }
  
  return {
    name: `${randomTeam} ${randomPlayer} #${randomNumber}`,
    description: `AI-generated jersey NFT for ${randomTeam}`,
    image: '', // Será preenchido depois
    attributes: [
      { trait_type: 'Type', value: 'Jersey' },
      { trait_type: 'Team', value: randomTeam },
      { trait_type: 'Player', value: randomPlayer },
      { trait_type: 'Number', value: randomNumber },
      { trait_type: 'Category', value: 'jerseys' },
      { trait_type: 'Token ID', value: tokenId.toString() }
    ]
  };
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting sync of missing NFTs from blockchain to MongoDB...');

    const mongoClient = await connectToDatabase();
    const db = mongoClient.db(DB_NAME);
    
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    // 1. Verificar quais tokens existem no MongoDB
    const [jerseys, stadiums, badges] = await Promise.all([
      db.collection('jerseys').find({}).toArray(),
      db.collection('stadiums').find({}).toArray(),
      db.collection('badges').find({}).toArray()
    ]);

    const existingTokenIds = new Set();
    [...jerseys, ...stadiums, ...badges].forEach(nft => {
      if (nft.tokenId) existingTokenIds.add(nft.tokenId.toString());
      if (nft.blockchainTokenId) existingTokenIds.add(nft.blockchainTokenId.toString());
    });

    console.log(`📊 Found ${existingTokenIds.size} existing NFTs in MongoDB`);

    // 2. Verificar blockchain para encontrar NFTs faltantes
    const syncedNFTs = [];
    const totalSupply = 20; // Sabemos que tem 20 NFTs no contrato

    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      const tokenIdStr = tokenId.toString();
      
      if (existingTokenIds.has(tokenIdStr)) {
        console.log(`✅ Token ${tokenId} already exists in MongoDB`);
        continue;
      }

      try {
        console.log(`🔍 Syncing missing token ${tokenId}...`);

        // Buscar dados da blockchain
        const [nftData, owner] = await Promise.all([
          getNFT({ contract: nftContract, tokenId: BigInt(tokenId) }),
          ownerOf({ contract: nftContract, tokenId: BigInt(tokenId) })
        ]);

        const metadata = nftData.metadata || {};
        const category = determineCategoryFromTokenId(tokenId);

        // Se não tem metadata, gerar uma padrão
        let finalMetadata = metadata;
        if (!metadata.name && !metadata.image) {
          finalMetadata = generateFallbackMetadata(tokenId, owner);
          console.log(`🔧 Generated fallback metadata for token ${tokenId}: ${finalMetadata.name}`);
        }

        // Criar documento para MongoDB
        const mongoDoc = {
          name: finalMetadata.name || `NFT #${tokenId}`,
          description: finalMetadata.description || `NFT Token ID ${tokenId}`,
          imageUrl: finalMetadata.image || '', // Pode estar vazio
          tokenId: tokenId,
          blockchainTokenId: tokenId,
          status: 'Approved', // Já foi mintado
          isMinted: true,
          
          // Dados da blockchain
          blockchain: {
            chainId: 80002,
            network: 'Polygon Amoy',
            contractAddress: NFT_CONTRACT_ADDRESS,
            tokenId: tokenId,
            owner: owner,
            mintedAt: new Date(),
            syncedAt: new Date()
          },

          // Metadados
          metadata: finalMetadata,
          attributes: finalMetadata.attributes || [],

          // Info do criador (usar owner como fallback)
          creator: {
            wallet: owner
          },
          creatorWallet: owner,
          ownerAddress: owner,

          // Marketplace
          marketplace: {
            isListable: true,
            canTrade: true,
            verified: true,
            isListed: false
          },

          // Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedFromBlockchain: true,
          syncedAt: new Date()
        };

        // Inserir no MongoDB na coleção correta
        const collection = db.collection(category);
        const insertResult = await collection.insertOne(mongoDoc);

        syncedNFTs.push({
          tokenId,
          name: finalMetadata.name,
          category,
          owner,
          mongoId: insertResult.insertedId.toString(),
          hadMetadata: !!(metadata.name || metadata.image)
        });

        console.log(`✅ Synced token ${tokenId} to ${category} collection: ${finalMetadata.name}`);

      } catch (error) {
        console.error(`❌ Failed to sync token ${tokenId}:`, error);
      }
    }

    console.log(`🎉 Sync completed! Added ${syncedNFTs.length} missing NFTs to MongoDB`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedNFTs.length} missing NFTs`,
      syncedNFTs,
      summary: {
        totalSynced: syncedNFTs.length,
        withOriginalMetadata: syncedNFTs.filter(n => n.hadMetadata).length,
        withGeneratedMetadata: syncedNFTs.filter(n => !n.hadMetadata).length,
        byCategory: {
          jerseys: syncedNFTs.filter(n => n.category === 'jerseys').length,
          stadiums: syncedNFTs.filter(n => n.category === 'stadiums').length,
          badges: syncedNFTs.filter(n => n.category === 'badges').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Status da sincronização
    const mongoClient = await connectToDatabase();
    const db = mongoClient.db(DB_NAME);
    
    const [jerseys, stadiums, badges] = await Promise.all([
      db.collection('jerseys').countDocuments(),
      db.collection('stadiums').countDocuments(), 
      db.collection('badges').countDocuments()
    ]);

    const totalInMongo = jerseys + stadiums + badges;
    const expectedTotal = 20; // Sabemos que tem 20 no contrato

    return NextResponse.json({
      success: true,
      status: {
        totalInMongoDB: totalInMongo,
        expectedFromBlockchain: expectedTotal,
        needsSync: totalInMongo < expectedTotal,
        missing: Math.max(0, expectedTotal - totalInMongo),
        byCollection: {
          jerseys,
          stadiums,
          badges
        }
      }
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 