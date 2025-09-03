import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { MongoClient } from 'mongodb';

/**
 * API para reconstruir MongoDB com dados REAIS da blockchain
 * Cria registros no MongoDB para todos os NFTs que realmente existem na blockchain
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Rebuild MongoDB: Starting reconstruction from blockchain...');

    const body = await request.json();
    const { action } = body;

    if (action !== 'REBUILD_FROM_BLOCKCHAIN') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use REBUILD_FROM_BLOCKCHAIN'
      }, { status: 400 });
    }

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // 1. BUSCAR DADOS REAIS DA BLOCKCHAIN
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
    });

    console.log('📡 Fetching real NFTs from blockchain...');

    const totalSupply = await readContract({
      contract: nftContract,
      method: "function totalSupply() view returns (uint256)",
      params: []
    });

    console.log(`📊 Found ${totalSupply} NFTs on blockchain`);

    // Buscar dados de todos os NFTs
    const realNFTs = [];
    for (let i = 0; i < Number(totalSupply); i++) {
      try {
        const owner = await readContract({
          contract: nftContract,
          method: "function ownerOf(uint256) view returns (address)",
          params: [BigInt(i)]
        });

        const tokenUri = await readContract({
          contract: nftContract,
          method: "function tokenURI(uint256) view returns (string)",
          params: [BigInt(i)]
        });

        // Buscar metadata
        let metadata = null;
        let nftType = 'jersey'; // default
        let team = 'Unknown';
        let name = 'Unknown NFT';

        if (tokenUri && (tokenUri.startsWith('http') || tokenUri.startsWith('ipfs://'))) {
          try {
            let fetchUrl = tokenUri;
            if (tokenUri.startsWith('ipfs://')) {
              fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            const metadataResponse = await fetch(fetchUrl);
            if (metadataResponse.ok) {
              metadata = await metadataResponse.json();
              
              // Determinar tipo baseado no nome/atributos
              if (metadata.name) {
                name = metadata.name;
                if (metadata.name.toLowerCase().includes('stadium')) {
                  nftType = 'stadium';
                } else if (metadata.name.toLowerCase().includes('badge')) {
                  nftType = 'badge';
                } else {
                  nftType = 'jersey';
                }
              }

              // Extrair team dos atributos
              if (metadata.attributes) {
                const teamAttr = metadata.attributes.find((attr: any) => 
                  attr.trait_type === 'Team' && 
                  attr.value !== 'Legacy Mint'
                );
                if (teamAttr) {
                  team = teamAttr.value;
                }
              }
            }
          } catch (metadataError) {
            console.log(`⚠️ Could not fetch metadata for token ${i}`);
          }
        }

        realNFTs.push({
          tokenId: i,
          owner,
          tokenUri,
          metadata,
          nftType,
          team,
          name
        });

      } catch (error: any) {
        console.log(`⚠️ Error fetching token ${i}:`, error?.message || error);
        continue;
      }
    }

    // 2. CONECTAR AO MONGODB E RECONSTRUIR
    console.log('🗄️ Connecting to MongoDB...');
    
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db('chz-app-db');

    // 2.1 - Limpar coleções existentes (opcional - comentar se quiser manter dados)
    // await db.collection('jerseys').deleteMany({});
    // await db.collection('stadiums').deleteMany({});
    // await db.collection('badges').deleteMany({});

    const results: any = {
      jerseys: { created: 0, errors: 0 },
      stadiums: { created: 0, errors: 0 },
      badges: { created: 0, errors: 0 },
      total: { created: 0, errors: 0 }
    };

    // 2.2 - Criar registros baseados nos NFTs reais
    for (const nft of realNFTs) {
      try {
        const baseDoc = {
          tokenId: nft.tokenId.toString(),
          owner: nft.owner,
          tokenUri: nft.tokenUri,
          metadata: nft.metadata,
          name: nft.name,
          team: nft.team,
          isMinted: true,
          isListed: false,
          mintedAt: new Date(),
          syncedAt: new Date(),
          reconstructedFromBlockchain: true,
          contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
        };

        let collectionName;
        let specificDoc: any = { ...baseDoc };

        switch (nft.nftType) {
          case 'jersey':
            collectionName = 'jerseys';
            specificDoc = {
              ...baseDoc,
              teamName: nft.team,
              playerName: nft.metadata?.attributes?.find((a: any) => a.trait_type === 'Player Name')?.value || 'Unknown',
              playerNumber: nft.metadata?.attributes?.find((a: any) => a.trait_type === 'Player Number')?.value || '00',
              style: nft.metadata?.attributes?.find((a: any) => a.trait_type === 'Style')?.value || 'modern',
              type: 'jersey'
            };
            break;

          case 'stadium':
            collectionName = 'stadiums';
            specificDoc = {
              ...baseDoc,
              stadiumName: nft.name.replace(' Stadium NFT', ''),
              teamName: nft.team,
              style: 'realistic',
              type: 'stadium'
            };
            break;

          case 'badge':
            collectionName = 'badges';
            specificDoc = {
              ...baseDoc,
              badgeName: nft.name,
              teamName: nft.team,
              type: 'badge'
            };
            break;

          default:
            collectionName = 'jerseys'; // fallback
            specificDoc.type = 'jersey';
        }

        // Verificar se já existe
        const existing = await db.collection(collectionName).findOne({
          tokenId: nft.tokenId.toString()
        });

        if (!existing) {
          await db.collection(collectionName).insertOne(specificDoc);
          results[nft.nftType] = results[nft.nftType] || { created: 0, errors: 0 };
          results[nft.nftType].created++;
          results.total.created++;
          console.log(`✅ Created ${nft.nftType} tokenId ${nft.tokenId}: ${nft.name}`);
        } else {
          // Atualizar dados se já existe
          await db.collection(collectionName).updateOne(
            { tokenId: nft.tokenId.toString() },
            { 
              $set: { 
                ...specificDoc,
                updatedAt: new Date()
              }
            }
          );
          console.log(`🔄 Updated ${nft.nftType} tokenId ${nft.tokenId}: ${nft.name}`);
        }

      } catch (insertError) {
        console.error(`❌ Error creating record for token ${nft.tokenId}:`, insertError);
        results[nft.nftType] = results[nft.nftType] || { created: 0, errors: 0 };
        results[nft.nftType].errors++;
        results.total.errors++;
      }
    }

    await mongoClient.close();

    console.log('✅ MongoDB reconstruction completed!');

    return NextResponse.json({
      success: true,
      blockchainData: {
        totalSupply: Number(totalSupply),
        nftsProcessed: realNFTs.length
      },
      reconstructionResults: results,
      summary: {
        totalCreated: results.total.created,
        totalErrors: results.total.errors,
        byType: {
          jerseys: results.jerseys,
          stadiums: results.stadiums,
          badges: results.badges
        }
      },
      message: `Successfully reconstructed MongoDB with ${results.total.created} NFT records from blockchain`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ MongoDB Rebuild Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to rebuild MongoDB from blockchain',
      details: error?.message || error
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Apenas mostrar o status atual sem fazer mudanças
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db('chz-app-db');

    const [jerseys, stadiums, badges] = await Promise.all([
      db.collection('jerseys').countDocuments(),
      db.collection('stadiums').countDocuments(),
      db.collection('badges').countDocuments()
    ]);

    await mongoClient.close();

    return NextResponse.json({
      success: true,
      currentStatus: {
        jerseys,
        stadiums,
        badges,
        total: jerseys + stadiums + badges
      },
      message: 'Current MongoDB status. Use POST with action: REBUILD_FROM_BLOCKCHAIN to rebuild.',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check MongoDB status',
      details: error?.message || error
    }, { status: 500 });
  }
} 