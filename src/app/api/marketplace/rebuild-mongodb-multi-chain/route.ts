import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { defineChain } from 'thirdweb/chains';
import { MongoClient } from 'mongodb';

// Definir CHZ Chain
const chzMainnet = defineChain({
  id: 88888,
  name: 'Chiliz Chain',
  nativeCurrency: { decimals: 18, name: 'Chiliz', symbol: 'CHZ' },
  rpcUrls: { default: { http: ['https://rpc.ankr.com/chiliz'] } },
  blockExplorers: { default: { name: 'ChilizScan', url: 'https://scan.chiliz.com' } },
});

// Configuração de contratos multi-chain
const CHAIN_CONFIGS = {
  // Polygon Amoy Testnet
  80002: {
    name: 'Polygon Amoy',
    chain: polygonAmoy,
    nftContract: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
    marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
    explorerUrl: 'https://amoy.polygonscan.com',
    prefix: 'polygon_amoy'
  },
  // CHZ Mainnet  
  88888: {
    name: 'CHZ Chain',
    chain: chzMainnet,
    nftContract: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ || '0x3db78Cf4543cff5c4f514bcDA5a56c3234d5EC78',
    marketplaceContract: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '',
    explorerUrl: 'https://scan.chiliz.com',
    prefix: 'chz_mainnet'
  }
};

/**
 * API para reconstruir MongoDB com separação multi-chain
 * Cria registros separados por chainId e contractAddress
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Multi-Chain Rebuild: Starting reconstruction...');

    const body = await request.json();
    const { action, chainIds } = body;

    if (action !== 'REBUILD_MULTI_CHAIN') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use REBUILD_MULTI_CHAIN'
      }, { status: 400 });
    }

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    const selectedChains = chainIds || [80002, 88888]; // Default: Polygon Amoy + CHZ
    const results = {
      total: { created: 0, errors: 0, chains: 0 },
      byChain: {}
    };

    // Conectar ao MongoDB
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db('chz-app-db');

    for (const chainId of selectedChains) {
      const config = CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS];
      if (!config || !config.nftContract) {
        console.log(`⚠️ Skipping chain ${chainId}: No configuration found`);
        continue;
      }

      console.log(`\n🔗 Processing ${config.name} (${chainId})...`);
      
      try {
        const nftContract = getContract({
          client,
          chain: config.chain,
          address: config.nftContract,
        });

        // Buscar total supply
        const totalSupply = await readContract({
          contract: nftContract,
          method: "function totalSupply() view returns (uint256)",
          params: []
        });

        console.log(`📊 ${config.name}: Found ${totalSupply} NFTs`);

        const chainResults = {
          jerseys: { created: 0, errors: 0 },
          stadiums: { created: 0, errors: 0 },
          badges: { created: 0, errors: 0 },
          total: { created: 0, errors: 0 }
        };

        // Processar cada NFT
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
            let nftType = 'jersey';
            let team = 'Unknown';
            let name = 'Unknown NFT';

            if (tokenUri && (tokenUri.startsWith('http') || tokenUri.startsWith('ipfs://'))) {
              try {
                let fetchUrl = tokenUri;
                if (tokenUri.startsWith('ipfs://')) {
                  fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }
                
                const metadataResponse = await fetch(fetchUrl, {
                  headers: { 'Accept': 'application/json' }
                });
                
                if (metadataResponse.ok) {
                  metadata = await metadataResponse.json();
                  
                  if (metadata.name) {
                    name = metadata.name;
                    if (metadata.name.toLowerCase().includes('stadium')) {
                      nftType = 'stadium';
                    } else if (metadata.name.toLowerCase().includes('badge')) {
                      nftType = 'badge';
                    }
                  }

                  // Extrair team
                  if (metadata.attributes) {
                    const teamAttr = metadata.attributes.find(attr => 
                      attr.trait_type === 'Team' && attr.value !== 'Legacy Mint'
                    );
                    if (teamAttr) team = teamAttr.value;
                  }
                }
              } catch (metadataError) {
                console.log(`⚠️ Could not fetch metadata for ${config.name} token ${i}`);
              }
            }

            // Criar documento com separação por chain
            const baseDoc = {
              // Identificadores únicos multi-chain
              chainId: chainId,
              contractAddress: config.nftContract.toLowerCase(),
              tokenId: i.toString(),
              globalId: `${chainId}_${config.nftContract.toLowerCase()}_${i}`, // ID único global
              
              // Dados do NFT
              owner: owner.toLowerCase(),
              tokenUri,
              metadata,
              name,
              team,
              nftType,
              
              // Status
              isMinted: true,
              isListed: false,
              
              // Network info
              network: {
                chainId: chainId,
                name: config.name,
                prefix: config.prefix,
                explorerUrl: config.explorerUrl,
                contractAddress: config.nftContract.toLowerCase()
              },
              
              // Timestamps
              mintedAt: new Date(),
              syncedAt: new Date(),
              reconstructedFromBlockchain: true,
              
              // Marketplace
              marketplace: {
                isListable: true,
                canTrade: true,
                verified: true
              }
            };

            // Determinar coleção específica
            let collectionName;
            let specificDoc = { ...baseDoc };

            switch (nftType) {
              case 'jersey':
                collectionName = 'jerseys';
                specificDoc = {
                  ...baseDoc,
                  teamName: team,
                  playerName: metadata?.attributes?.find(a => a.trait_type === 'Player Name')?.value || 'Unknown',
                  playerNumber: metadata?.attributes?.find(a => a.trait_type === 'Player Number')?.value || '00',
                  style: metadata?.attributes?.find(a => a.trait_type === 'Style')?.value || 'modern',
                  type: 'jersey'
                };
                break;

              case 'stadium':
                collectionName = 'stadiums';
                specificDoc = {
                  ...baseDoc,
                  stadiumName: name.replace(' Stadium NFT', ''),
                  teamName: team,
                  style: 'realistic',
                  type: 'stadium'
                };
                break;

              case 'badge':
                collectionName = 'badges';
                specificDoc = {
                  ...baseDoc,
                  badgeName: name,
                  teamName: team,
                  type: 'badge'
                };
                break;

              default:
                collectionName = 'jerseys';
                specificDoc.type = 'jersey';
            }

            // Verificar se já existe (por globalId único)
            const existing = await db.collection(collectionName).findOne({
              globalId: specificDoc.globalId
            });

            if (!existing) {
              await db.collection(collectionName).insertOne(specificDoc);
              chainResults[nftType as keyof typeof chainResults] = chainResults[nftType as keyof typeof chainResults] || { created: 0, errors: 0 };
              (chainResults[nftType as keyof typeof chainResults] as any).created++;
              chainResults.total.created++;
              console.log(`✅ Created ${config.name} ${nftType} tokenId ${i}: ${name}`);
            } else {
              // Atualizar se já existe
              await db.collection(collectionName).updateOne(
                { globalId: specificDoc.globalId },
                { $set: { ...specificDoc, updatedAt: new Date() } }
              );
              console.log(`🔄 Updated ${config.name} ${nftType} tokenId ${i}: ${name}`);
            }

          } catch (tokenError: any) {
            console.error(`❌ Error processing ${config.name} token ${i}:`, tokenError?.message || tokenError);
            chainResults.total.errors++;
          }
        }

        (results.byChain as any)[chainId] = {
          name: config.name,
          contract: config.nftContract,
          totalSupply: Number(totalSupply),
          results: chainResults
        };

        results.total.created += chainResults.total.created;
        results.total.errors += chainResults.total.errors;
        results.total.chains++;

      } catch (chainError) {
        console.error(`❌ Error processing chain ${chainId}:`, chainError);
        (results.byChain as any)[chainId] = {
          name: config?.name || 'Unknown',
          error: (chainError as any)?.message || chainError
        };
      }
    }

    await mongoClient.close();

    return NextResponse.json({
      success: true,
      message: `Multi-chain reconstruction completed for ${results.total.chains} chains`,
      summary: {
        totalCreated: results.total.created,
        totalErrors: results.total.errors,
        chainsProcessed: results.total.chains,
        byChain: results.byChain
      },
      config: {
        chainsSupported: Object.keys(CHAIN_CONFIGS),
        separation: 'globalId = chainId_contractAddress_tokenId'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Multi-Chain Rebuild Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to rebuild multi-chain MongoDB',
      details: error?.message || error
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId');

    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db('chz-app-db');

    let filter = {};
    if (chainId) {
      filter = { chainId: parseInt(chainId) };
    }

    const [jerseys, stadiums, badges] = await Promise.all([
      db.collection('jerseys').countDocuments(filter),
      db.collection('stadiums').countDocuments(filter),
      db.collection('badges').countDocuments(filter)
    ]);

    // Estatísticas por chain
    const chainStats = {};
    for (const [cId, config] of Object.entries(CHAIN_CONFIGS)) {
      const chainFilter = { chainId: parseInt(cId) };
      const chainJerseys = await db.collection('jerseys').countDocuments(chainFilter);
      const chainStadiums = await db.collection('stadiums').countDocuments(chainFilter);
      const chainBadges = await db.collection('badges').countDocuments(chainFilter);
      
      (chainStats as any)[cId] = {
        name: config.name,
        contract: config.nftContract,
        jerseys: chainJerseys,
        stadiums: chainStadiums,
        badges: chainBadges,
        total: chainJerseys + chainStadiums + chainBadges
      };
    }

    await mongoClient.close();

    return NextResponse.json({
      success: true,
      currentStatus: {
        filtered: { chainId, jerseys, stadiums, badges, total: jerseys + stadiums + badges },
        byChain: chainStats,
        globalTotal: Object.values(chainStats).reduce((sum, chain) => sum + chain.total, 0)
      },
      supportedChains: CHAIN_CONFIGS,
      message: 'Multi-chain MongoDB status. Use POST with action: REBUILD_MULTI_CHAIN',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check multi-chain status',
      details: error?.message || error
    }, { status: 500 });
  }
} 