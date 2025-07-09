import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract, readContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { MongoClient } from 'mongodb';

/**
 * API para sincronizar dados REAIS da blockchain com MongoDB
 * Cruza: NFT Collection + Marketplace + MongoDB para corrigir discrepâncias
 */
export async function GET(request: Request) {
  try {
    console.log('🔄 Blockchain Sync: Starting comprehensive sync...');

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY!,
    });

    // Contratos
    const nftContract = getContract({
      client,
      chain: polygonAmoy,
      address: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // NFT Collection
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: '0x723436a84d57150A5109eFC540B2f0b2359Ac76d', // Marketplace
    });

    // 1. BUSCAR DADOS REAIS DA BLOCKCHAIN
    console.log('📡 Step 1: Fetching real blockchain data...');

    // 1.1 - Total Supply da Collection
    const totalSupply = await readContract({
      contract: nftContract,
      method: "function totalSupply() view returns (uint256)",
      params: []
    });

    console.log(`📊 Real NFTs minted: ${totalSupply}`);

    // 1.2 - Buscar todos os NFTs reais
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

        realNFTs.push({
          tokenId: i,
          owner,
          tokenUri,
          contractAddress: '0xfF973a4aFc5A96DEc81366461A461824c4f80254'
        });
      } catch (error: any) {
        console.log(`⚠️ Error fetching token ${i}:`, error?.message || error);
      }
    }

    // 1.3 - Buscar listings reais do marketplace
    let realListings = [];
    try {
      const totalListings = await readContract({
        contract: marketplaceContract,
        method: "function totalListings() view returns (uint256)",
        params: []
      });

      console.log(`📋 Total marketplace listings: ${totalListings}`);

      if (Number(totalListings) > 0) {
        const startId = 0;
        const endId = Number(totalListings) - 1;

        const listings = await readContract({
          contract: marketplaceContract,
          method: "function getAllValidListings(uint256 startId, uint256 endId) view returns ((uint256 listingId, address listingCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved, uint8 tokenType, uint8 status)[])",
          params: [BigInt(startId), BigInt(endId)]
        });

        // Filtrar apenas listings do nosso contrato NFT
        realListings = listings.filter(listing => 
          listing.assetContract.toLowerCase() === '0xff973a4afc5a96dec81366461a461824c4f80254'
        );

        console.log(`✅ Real listings from our contract: ${realListings.length}`);
      }
    } catch (listingError) {
      console.log('⚠️ Could not fetch marketplace listings');
    }

    // 2. CONECTAR COM MONGODB
    console.log('🗄️ Step 2: Connecting to MongoDB...');
    
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db('chz-app-db');

    // 2.1 - Buscar dados do MongoDB
    const jerseys = await db.collection('jerseys').find({}).toArray();
    const stadiums = await db.collection('stadiums').find({}).toArray();
    const badges = await db.collection('badges').find({}).toArray();

    console.log(`📊 MongoDB data: ${jerseys.length} jerseys, ${stadiums.length} stadiums, ${badges.length} badges`);

    // 3. CRUZAR DADOS E IDENTIFICAR DISCREPÂNCIAS
    console.log('🔍 Step 3: Cross-referencing data...');

    const syncResults = {
      totalRealNFTs: Number(totalSupply),
      totalRealListings: realListings.length,
      totalMongoDBRecords: jerseys.length + stadiums.length + badges.length,
      
      discrepancies: {
        mintedButNotInMongoDB: [],
        inMongoDBButNotMinted: [],
        listedButNotSynced: [],
        wrongTokenIds: []
      },

      correctionActions: []
    };

    // 3.1 - Identificar NFTs mintados mas não registrados no MongoDB
    for (const realNFT of realNFTs) {
      const foundInMongo = [...jerseys, ...stadiums, ...badges].find(item => 
        item.tokenId === realNFT.tokenId.toString() && 
        item.transactionHash && 
        item.isMinted === true
      );

      if (!foundInMongo) {
        syncResults.discrepancies.mintedButNotInMongoDB.push({
          tokenId: realNFT.tokenId,
          owner: realNFT.owner,
          tokenUri: realNFT.tokenUri
        });

        syncResults.correctionActions.push({
          action: 'UPDATE_MONGODB',
          type: 'MARK_AS_MINTED',
          tokenId: realNFT.tokenId,
          details: 'NFT exists on blockchain but not marked as minted in MongoDB'
        });
      }
    }

    // 3.2 - Identificar registros do MongoDB marcados como mintados mas não existem na blockchain
    const allMongoItems = [...jerseys, ...stadiums, ...badges];
    for (const mongoItem of allMongoItems) {
      if (mongoItem.isMinted && mongoItem.tokenId) {
        const foundOnChain = realNFTs.find(nft => nft.tokenId.toString() === mongoItem.tokenId);
        
        if (!foundOnChain) {
          syncResults.discrepancies.inMongoDBButNotMinted.push({
            mongoId: mongoItem._id,
            tokenId: mongoItem.tokenId,
            transactionHash: mongoItem.transactionHash
          });

          syncResults.correctionActions.push({
            action: 'UPDATE_MONGODB',
            type: 'MARK_AS_NOT_MINTED',
            mongoId: mongoItem._id,
            details: 'Marked as minted in MongoDB but does not exist on blockchain'
          });
        }
      }
    }

    // 3.3 - Identificar NFTs listados no marketplace mas não sincronizados no MongoDB
    for (const listing of realListings) {
      const foundInMongo = allMongoItems.find(item => 
        item.tokenId === listing.tokenId.toString() && 
        item.listingId === listing.listingId.toString()
      );

      if (!foundInMongo) {
        syncResults.discrepancies.listedButNotSynced.push({
          listingId: listing.listingId.toString(),
          tokenId: listing.tokenId.toString(),
          creator: listing.listingCreator,
          price: listing.pricePerToken.toString()
        });

        syncResults.correctionActions.push({
          action: 'UPDATE_MONGODB',
          type: 'ADD_LISTING_INFO',
          tokenId: listing.tokenId.toString(),
          listingId: listing.listingId.toString(),
          details: 'NFT listed on marketplace but not synced in MongoDB'
        });
      }
    }

    await mongoClient.close();

    // 4. SUMMARY E RECOMENDAÇÕES
    const summary = {
      status: syncResults.discrepancies.mintedButNotInMongoDB.length > 0 || 
              syncResults.discrepancies.inMongoDBButNotMinted.length > 0 || 
              syncResults.discrepancies.listedButNotSynced.length > 0 ? 
              'NEEDS_SYNC' : 'IN_SYNC',
      
      totalDiscrepancies: 
        syncResults.discrepancies.mintedButNotInMongoDB.length +
        syncResults.discrepancies.inMongoDBButNotMinted.length +
        syncResults.discrepancies.listedButNotSynced.length,

      recommendations: [
        syncResults.discrepancies.mintedButNotInMongoDB.length > 0 ? 
          `Update ${syncResults.discrepancies.mintedButNotInMongoDB.length} MongoDB records to match blockchain` : null,
        
        syncResults.discrepancies.listedButNotSynced.length > 0 ? 
          `Sync ${syncResults.discrepancies.listedButNotSynced.length} marketplace listings to MongoDB` : null,
        
        syncResults.discrepancies.inMongoDBButNotMinted.length > 0 ? 
          `Fix ${syncResults.discrepancies.inMongoDBButNotMinted.length} incorrect minting status in MongoDB` : null
      ].filter(Boolean)
    };

    return NextResponse.json({
      success: true,
      blockchainData: {
        totalSupply: Number(totalSupply),
        realNFTs: realNFTs.length,
        realListings: realListings.length
      },
      mongoDBData: {
        jerseys: jerseys.length,
        stadiums: stadiums.length,
        badges: badges.length,
        total: jerseys.length + stadiums.length + badges.length
      },
      syncResults,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Blockchain Sync Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync blockchain data',
      details: error?.message || error
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, corrections } = body;

    console.log('🔧 Blockchain Sync POST:', { action, corrections: corrections?.length });

    if (action !== 'APPLY_CORRECTIONS' || !corrections || !Array.isArray(corrections)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use APPLY_CORRECTIONS with corrections array'
      }, { status: 400 });
    }

    // Conectar ao MongoDB
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const db = mongoClient.db('chz-app-db');

    const results = [];

    for (const correction of corrections) {
      try {
        switch (correction.type) {
          case 'MARK_AS_MINTED':
            // Atualizar item para marcar como mintado
            const updateResult = await db.collection('jerseys').updateOne(
              { tokenId: correction.tokenId.toString() },
              { 
                $set: { 
                  isMinted: true,
                  tokenId: correction.tokenId.toString(),
                  syncedAt: new Date()
                }
              }
            );
            
            if (updateResult.matchedCount === 0) {
              // Tentar em stadiums e badges também
              const stadiumUpdate = await db.collection('stadiums').updateOne(
                { tokenId: correction.tokenId.toString() },
                { 
                  $set: { 
                    isMinted: true,
                    tokenId: correction.tokenId.toString(),
                    syncedAt: new Date()
                  }
                }
              );
              
              const badgeUpdate = await db.collection('badges').updateOne(
                { tokenId: correction.tokenId.toString() },
                { 
                  $set: { 
                    isMinted: true,
                    tokenId: correction.tokenId.toString(),
                    syncedAt: new Date()
                  }
                }
              );
            }

            results.push({
              type: correction.type,
              tokenId: correction.tokenId,
              success: true,
              message: 'Marked as minted'
            });
            break;

          case 'ADD_LISTING_INFO':
            // Adicionar informações de listing
            const listingUpdate = await db.collection('jerseys').updateOne(
              { tokenId: correction.tokenId },
              { 
                $set: { 
                  listingId: correction.listingId,
                  isListed: true,
                  syncedAt: new Date()
                }
              }
            );
            
            results.push({
              type: correction.type,
              tokenId: correction.tokenId,
              listingId: correction.listingId,
              success: true,
              message: 'Added listing info'
            });
            break;

          default:
            results.push({
              type: correction.type,
              success: false,
              message: 'Unknown correction type'
            });
        }
      } catch (correctionError: any) {
        results.push({
          type: correction.type,
          success: false,
          error: correctionError?.message || correctionError
        });
      }
    }

    await mongoClient.close();

    return NextResponse.json({
      success: true,
      applied: corrections.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Blockchain Sync POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to apply corrections',
      details: error?.message || error
    }, { status: 500 });
  }
} 