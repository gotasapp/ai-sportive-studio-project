import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import { convertIpfsToHttp } from '@/lib/utils';
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'chz-app-db';

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

// Thirdweb setup
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

import { getSupportedContractAddresses } from '@/lib/marketplace-config';

// 🎯 USAR MESMA CONFIGURAÇÃO DO MARKETPLACE (CHZ)
const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '0x2403863b192b649448793dfbB6926Cdd0d7A14Ad';

// 🎯 CONFIGURAÇÃO CHZ (MESMA DO MARKETPLACE)
const chzChain = defineChain({
  id: 88888,
  name: 'Chiliz Chain',
  nativeCurrency: { name: 'CHZ', symbol: 'CHZ', decimals: 18 },
  rpc: process.env.NEXT_PUBLIC_CHZ_RPC_URL || 'https://rpc.ankr.com/chiliz',
  blockExplorers: [{ name: 'ChilizScan', url: 'https://scan.chiliz.com' }]
});

// Cache TTL: 5 minutos para NFTs
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function determineCategory(metadata: any): 'jerseys' | 'stadiums' | 'badges' {
  const name = (metadata.name || '').toLowerCase();
  const description = (metadata.description || '').toLowerCase();
  const attributes = metadata.attributes || [];
  
  // Check attributes first (most reliable)
  const categoryAttribute = attributes.find((attr: any) => 
    attr.trait_type?.toLowerCase() === 'category' || 
    attr.trait_type?.toLowerCase() === 'type'
  );
  
  if (categoryAttribute) {
    const category = categoryAttribute.value?.toLowerCase();
    if (category === 'jersey' || category === 'jerseys') return 'jerseys';
    if (category === 'stadium' || category === 'stadiums') return 'stadiums';
    if (category === 'badge' || category === 'badges') return 'badges';
  }
  
  // Fallback to name/description analysis
  if (name.includes('jersey') || description.includes('jersey') || name.includes('#')) {
    return 'jerseys';
  }
  
  if (name.includes('stadium') || description.includes('stadium') || 
      name.includes('arena') || description.includes('arena')) {
    return 'stadiums';
  }
  
  if (name.includes('badge') || description.includes('badge') ||
      name.includes('achievement') || description.includes('achievement')) {
    return 'badges';
  }
  
  // Default to jerseys
  return 'jerseys';
}

// PRODUCTION-READY function using the same logic as marketplace
async function fetchUserNFTsProductionReady(userAddress: string) {
  console.log('🚀 Using PRODUCTION-READY marketplace logic for:', userAddress);

  try {
    // 🚀 Use the same robust system as marketplace
    const thirdwebData = await getThirdwebDataWithFallback();
    const { nfts, listings: marketplaceListings, auctions: marketplaceAuctions } = thirdwebData;

    console.log(`✅ Found ${nfts.length} NFTs in contract using PRODUCTION system`);
    console.log(`📋 Found ${marketplaceListings.length} total listings`);
    console.log(`🏆 Found ${marketplaceAuctions.length} total auctions`);

    // Filter only listings and auctions from our NFT contract
    const ourContractListings = marketplaceListings.filter((listing: any) =>
      listing.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
    );
    
    const ourContractAuctions = marketplaceAuctions.filter((auction: any) => 
      auction.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
    );

    // Create lookup maps for quick access
    const listingsByTokenId = new Map();
    const auctionsByTokenId = new Map();
    
    ourContractListings.forEach((listing: any) => {
      const tokenId = listing.tokenId?.toString();
      if (tokenId) {
        listingsByTokenId.set(tokenId, listing);
      }
    });
    
    ourContractAuctions.forEach((auction: any) => {
      const tokenId = auction.tokenId?.toString();
      if (tokenId) {
        auctionsByTokenId.set(tokenId, auction);
      }
    });

    // Create contract instance for owner lookup (same as marketplace)
    const nftContract = getContract({
      client,
      chain: chzChain,
      address: NFT_CONTRACT_ADDRESS,
    });

    // Process NFTs with MANUAL OWNER LOOKUP + MARKETPLACE DATA (same logic as marketplace)
    console.log('🔄 Processing NFTs with owner lookup + marketplace data...');
    
    const userNFTs = [];

    for (const nft of nfts) {
      try {
        const tokenId = nft.id.toString();
        const metadata = nft.metadata || {};

        // MANUALLY FETCH OWNER using ownerOf function (same as marketplace)
        let nftOwner = 'Unknown';
        try {
          nftOwner = await ownerOf({
            contract: nftContract,
            tokenId: BigInt(tokenId)
          });
        } catch (error) {
          console.warn(`⚠️ Could not fetch owner for NFT #${tokenId}:`, error);
          nftOwner = 'Unknown';
        }

        // Check if this user owns, listed, or auctioned this NFT
        const isOwned = nftOwner.toLowerCase() === userAddress.toLowerCase();
        
        const marketplaceListing = listingsByTokenId.get(tokenId);
        const isListed = marketplaceListing && marketplaceListing.creatorAddress?.toLowerCase() === userAddress.toLowerCase();
        
        const marketplaceAuction = auctionsByTokenId.get(tokenId);
        const isAuctioned = marketplaceAuction && marketplaceAuction.creatorAddress?.toLowerCase() === userAddress.toLowerCase();

        // Include NFT if user owns it, listed it, or has it in auction
        if (isOwned || isListed || isAuctioned) {
          let status = 'owned';
          let price = undefined;
          
          if (isListed) {
            status = 'listed';
            price = marketplaceListing.currencyValuePerToken?.displayValue || 'Not for sale';
                     } else if (isAuctioned) {
             status = 'listed';
             const minBidWei = marketplaceAuction.minimumBidAmount || BigInt(0);
             const minBidChz = Number(minBidWei) / Math.pow(10, 18);
             price = `${minBidChz.toFixed(2)} CHZ`;
           }

          // Check if user created this NFT
          const isCreatedByUser = 
            (metadata.creator as any)?.toLowerCase() === userAddress.toLowerCase() ||
            (metadata.minted_by as any)?.toLowerCase() === userAddress.toLowerCase() ||
            (Array.isArray(metadata.attributes) && metadata.attributes.some((attr: any) => 
              (attr.trait_type?.toLowerCase() === 'creator' || 
               attr.trait_type?.toLowerCase() === 'minted_by') &&
              attr.value?.toLowerCase() === userAddress.toLowerCase()
            ));
          
          if (isCreatedByUser) {
            status = 'created';
          }

          userNFTs.push({
            id: `${NFT_CONTRACT_ADDRESS}-${tokenId}`,
            tokenId,
            name: metadata.name || `NFT #${tokenId}`,
            imageUrl: convertIpfsToHttp(metadata.image || ''),
            price,
            status,
            createdAt: new Date().toISOString(),
            collection: determineCategory(metadata),
            owner: nftOwner,
            isOwned,
            isListed,
            isAuctioned
          });

          console.log(`✅ User NFT found: ${metadata.name} (Token ID: ${tokenId}, Status: ${status})`);
        }
      } catch (error) {
        console.warn(`⚠️ Error processing NFT ${nft.id}:`, error);
      }
    }

    return {
      userAddress,
      nfts: userNFTs,
      totalNFTs: userNFTs.length,
      owned: userNFTs.filter(nft => nft.status === 'owned').length,
      listed: userNFTs.filter(nft => nft.status === 'listed').length,
      created: userNFTs.filter(nft => nft.status === 'created').length,
      contractStats: {
        totalNFTsInContract: nfts.length,
        totalListings: ourContractListings.length,
        totalAuctions: ourContractAuctions.length
      },
      source: 'production'
    };

  } catch (error) {
    console.error('❌ Production fetch failed:', error);
    throw error;
  }
}

// NOVA FUNÇÃO: Buscar NFTs Legacy do MongoDB (contrato antigo)
async function fetchUserLegacyNFTs(userAddress: string) {
  console.log('🔄 Fetching legacy NFTs from MongoDB for:', userAddress);
  
  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    
    const collections = ['jerseys', 'stadiums', 'badges'];
    const userNFTs = [];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
             // Buscar NFTs criadas pelo usuário que foram mintadas
       const nfts = await collection
         .find({
           'creator.wallet': userAddress,
           status: 'Approved',
           $or: [
             { transactionHash: { $exists: true, $nin: [null, ''] } },
             { isMinted: true },
             { mintStatus: 'minted' },
             { mintStatus: 'success' }
           ],
           // 🎯 EXCLUIR NFTs de custom collections para evitar duplicatas
           $nor: [
             { 'metadata.image': { $regex: 'collection_' } },
             { name: { $regex: 'Collection #' } },
             { name: { $regex: 'Custom Collection' } },
             { name: { $regex: 'Batch Mint' } },
             // Excluir NFTs que fazem parte de coleções
             { 'metadata.attributes': { $elemMatch: { 'trait_type': 'collection' } } },
             { 'metadata.attributes': { $elemMatch: { 'trait_type': 'batch' } } }
           ]
         })
         .sort({ createdAt: -1 })
         .limit(50)
         .toArray();
      
      for (const nft of nfts) {
        userNFTs.push({
          id: nft._id.toString(),
          name: nft.name,
          imageUrl: nft.metadata?.image || nft.imageUrl || '',
          price: '0',
          contractAddress: NFT_CONTRACT_ADDRESS,
          tokenId: nft.tokenId || '0',
          category: determineCategory({ name: nft.name }),
          status: 'owned',
          transactionHash: nft.transactionHash,
          mintedAt: nft.createdAt || new Date().toISOString(),
          collectionName: collectionName,
          owner: userAddress,
          isLegacy: true
        });
      }
    }
    
    console.log(`✅ Found ${userNFTs.length} legacy NFTs from MongoDB`);
    
    return {
      userAddress,
      nfts: userNFTs,
      totalNFTs: userNFTs.length,
      owned: userNFTs.length,
      listed: 0,
      created: userNFTs.length,
      source: 'mongodb_legacy'
    };
    
  } catch (error) {
    console.error('❌ Error fetching legacy NFTs from MongoDB:', error);
    return {
      userAddress,
      nfts: [],
      totalNFTs: 0,
      owned: 0,
      listed: 0,
      created: 0,
      source: 'mongodb_legacy_error'
    };
  }
}

// NOVA FUNÇÃO: Buscar NFTs das Custom Collections (batch mints)
async function fetchUserCustomCollectionNFTs(userAddress: string) {
  console.log('🔄 Fetching custom collection NFTs for:', userAddress);
  
  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    
    // Buscar NFTs das custom collections que o usuário mintou
    const customCollectionMints = await db.collection('custom_collection_mints')
      .find({ minterAddress: userAddress })
      .toArray();
    
    console.log(`📦 Found ${customCollectionMints.length} custom collection NFTs for user`);
    
    const userNFTs = [];
    
    for (const mint of customCollectionMints) {
      try {
        // Buscar dados da collection
        const collection = await db.collection('custom_collections')
          .findOne({ _id: mint.customCollectionId });
        
        if (collection) {
          userNFTs.push({
            id: `custom_${mint.customCollectionId}_${mint.tokenId}`,
            name: `${collection.name} #${mint.tokenId}`,
            imageUrl: collection.imageUrl,
            price: mint.price || '0',
            contractAddress: mint.contractAddress,
            tokenId: mint.tokenId,
            category: determineCategory({ name: collection.name }),
            status: 'owned',
            transactionHash: mint.transactionHash,
            mintedAt: mint.mintedAt || new Date().toISOString(),
            collectionName: collection.name,
            collectionId: mint.customCollectionId.toString(),
            owner: userAddress,
            isCustomCollection: true
          });
        }
      } catch (error) {
        console.warn(`⚠️ Error processing custom NFT:`, error);
      }
    }
    
    console.log(`✅ Processed ${userNFTs.length} custom collection NFTs`);
    
    return {
      userAddress,
      nfts: userNFTs,
      totalNFTs: userNFTs.length,
      owned: userNFTs.length,
      listed: 0,
      created: userNFTs.length,
      source: 'custom_collections'
    };
    
  } catch (error) {
    console.error('❌ Error fetching custom collection NFTs:', error);
    return {
      userAddress,
      nfts: [],
      totalNFTs: 0,
      owned: 0,
      listed: 0,
      created: 0,
      source: 'custom_collections_error'
    };
  }
}

// NOVA FUNÇÃO: Buscar coleções do marketplace (custom e launchpad)
async function fetchUserMarketplaceCollections(userAddress: string) {
  console.log('🔄 Fetching marketplace collections for:', userAddress);
  
  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    
    const userCollections = [];
    
    // 1. Buscar Custom Collections criadas pelo usuário
    const customCollections = await db.collection('custom_collections').find({
      creatorWallet: userAddress,
      status: 'active'
    }).toArray();
    
    console.log(`🎨 Found ${customCollections.length} custom collections for user`);
    
    for (const collection of customCollections) {
      // Buscar NFTs mintadas desta coleção
      const mintedNFTs = await db.collection('custom_collection_mints')
        .find({ customCollectionId: collection._id })
        .toArray();
      
      if (mintedNFTs.length > 0) {
        userCollections.push({
          id: `custom_collection_${collection._id}`,
          name: collection.name,
          imageUrl: collection.imageUrl,
          price: '0', // Coleções não têm preço individual
          contractAddress: collection.contractAddress,
          tokenId: collection._id.toString(),
          category: collection.category || 'jersey',
          status: 'created',
          mintedAt: collection.createdAt || new Date().toISOString(),
          collectionName: collection.name,
          collectionId: collection._id.toString(),
          owner: userAddress,
          isCustomCollection: true,
          isCollection: true,
          mintedUnits: mintedNFTs.length,
          totalUnits: collection.totalSupply || 0,
          availableUnits: (collection.totalSupply || 0) - mintedNFTs.length
        });
      }
    }
    
    // 2. Buscar Launchpad Collections criadas pelo usuário
    const launchpadCollections = await db.collection('launchpad_collections').find({
      'creator.wallet': userAddress,
      status: { $in: ['active', 'upcoming', 'approved'] }
    }).toArray();
    
    console.log(`🚀 Found ${launchpadCollections.length} launchpad collections for user`);
    
    for (const collection of launchpadCollections) {
      // Buscar NFTs mintadas desta coleção
      const mintedNFTs = await db.collection('launchpad_collection_mints')
        .find({ contractAddress: collection.contractAddress })
        .toArray();
      
      if (mintedNFTs.length > 0) {
        userCollections.push({
          id: `launchpad_collection_${collection._id}`,
          name: collection.name,
          imageUrl: collection.image || collection.imageUrl,
          price: '0', // Coleções não têm preço individual
          contractAddress: collection.contractAddress,
          tokenId: collection._id.toString(),
          category: 'launchpad',
          status: 'created',
          mintedAt: collection.createdAt || new Date().toISOString(),
          collectionName: collection.name,
          collectionId: collection._id.toString(),
          owner: userAddress,
          isLaunchpadCollection: true,
          isCollection: true,
          mintedUnits: mintedNFTs.length,
          totalUnits: collection.totalSupply || 0,
          availableUnits: (collection.totalSupply || 0) - mintedNFTs.length
        });
      }
    }
    
    console.log(`✅ Processed ${userCollections.length} marketplace collections`);
    
    return {
      userAddress,
      nfts: userCollections,
      totalNFTs: userCollections.length,
      owned: 0,
      listed: 0,
      created: userCollections.length,
      source: 'marketplace_collections'
    };
    
  } catch (error) {
    console.error('❌ Error fetching marketplace collections:', error);
    return {
      userAddress,
      nfts: [],
      totalNFTs: 0,
      owned: 0,
      listed: 0,
      created: 0,
      source: 'marketplace_collections_error'
    };
  }
}

// Original Thirdweb-only function (kept as fallback)
async function fetchUserNFTsFromThirdweb(userAddress: string) {
  console.log('🔄 Fetching fresh NFT data from Thirdweb for:', userAddress);

  // Create contracts
  const nftContract = getContract({
    client,
    chain: chzChain,
    address: NFT_CONTRACT_ADDRESS,
  });

  const marketplaceContract = getContract({
    client,
    chain: chzChain,
    address: MARKETPLACE_CONTRACT_ADDRESS,
  });

  // Get all NFTs and marketplace data with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Thirdweb timeout')), 15000); // 15 second timeout
  });

  const [allNFTs, listings, auctions] = await Promise.race([
    Promise.all([
      getNFTs({ contract: nftContract, start: 0, count: 100 }),
      getAllValidListings({ contract: marketplaceContract, start: 0, count: BigInt(100) }),
      getAllAuctions({ contract: marketplaceContract, start: 0, count: BigInt(100) })
    ]),
    timeoutPromise
  ]) as any;

  console.log(`📊 Total NFTs in contract: ${allNFTs.length}`);

  // Filter marketplace data for our contract
  const ourListings = listings.filter((listing: any) => 
    listing.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
  );
  
  const ourAuctions = auctions.filter((auction: any) => 
    auction.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
  );

  // Create lookup maps
  const listingsByTokenId = new Map();
  const auctionsByTokenId = new Map();
  
  ourListings.forEach((listing: any) => {
    const tokenId = listing.tokenId?.toString();
    if (tokenId) {
      listingsByTokenId.set(tokenId, listing);
    }
  });
  
  ourAuctions.forEach((auction: any) => {
    const tokenId = auction.tokenId?.toString();
    if (tokenId) {
      auctionsByTokenId.set(tokenId, auction);
    }
  });

  // Check ownership for each NFT
  const userNFTs = [];
  
  for (const nft of allNFTs) {
    try {
      const tokenId = nft.id?.toString();
      if (!tokenId) continue;

      // Check actual ownership
      const owner = await ownerOf({
        contract: nftContract,
        tokenId: BigInt(tokenId)
      });

      const isOwned = owner.toLowerCase() === userAddress.toLowerCase();
      
      // Check if user has this NFT listed
      const listing = listingsByTokenId.get(tokenId);
      const isListed = listing && listing.creatorAddress?.toLowerCase() === userAddress.toLowerCase();
      
      // Check if user has this NFT in auction
      const auction = auctionsByTokenId.get(tokenId);
      const isAuctioned = auction && auction.creatorAddress?.toLowerCase() === userAddress.toLowerCase();

      // Include NFT if user owns it, listed it, or has it in auction
      if (isOwned || isListed || isAuctioned) {
        const metadata = nft.metadata || {};
        
        let status = 'owned';
        let price = undefined;
        
                 if (isListed) {
           status = 'listed';
           price = listing.currencyValuePerToken?.displayValue || 
                  `${(Number(listing.pricePerToken || 0) / 1e18).toFixed(2)} CHZ`;
         } else if (isAuctioned) {
           status = 'listed';
           const minBidWei = auction.minimumBidAmount || BigInt(0);
           const minBidChz = Number(minBidWei) / Math.pow(10, 18);
           price = `${minBidChz.toFixed(2)} CHZ`;
         }

        // Check if user created this NFT
        const isCreatedByUser = 
          (metadata.creator as any)?.toLowerCase() === userAddress.toLowerCase() ||
          (metadata.minted_by as any)?.toLowerCase() === userAddress.toLowerCase() ||
          (Array.isArray(metadata.attributes) && metadata.attributes.some((attr: any) => 
            (attr.trait_type?.toLowerCase() === 'creator' || 
             attr.trait_type?.toLowerCase() === 'minted_by') &&
            attr.value?.toLowerCase() === userAddress.toLowerCase()
          ));
        
        if (isCreatedByUser) {
          status = 'created';
        }

        userNFTs.push({
          id: `${NFT_CONTRACT_ADDRESS}-${tokenId}`,
          tokenId,
          name: metadata.name || `NFT #${tokenId}`,
          imageUrl: convertIpfsToHttp(metadata.image || ''),
          price,
          status,
          createdAt: new Date().toISOString(),
          collection: determineCategory(metadata),
          owner,
          isOwned,
          isListed,
          isAuctioned
        });

        console.log(`✅ User NFT found: ${metadata.name} (Token ID: ${tokenId}, Status: ${status})`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not check ownership for NFT ${nft.id}:`, error);
    }
  }

  return {
    userAddress,
    nfts: userNFTs,
    totalNFTs: userNFTs.length,
    owned: userNFTs.filter(nft => nft.status === 'owned').length,
    listed: userNFTs.filter(nft => nft.status === 'listed').length,
    created: userNFTs.filter(nft => nft.status === 'created').length,
    contractStats: {
      totalNFTsInContract: allNFTs.length,
      totalListings: ourListings.length,
      totalAuctions: ourAuctions.length
    }
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    if (!userAddress) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    console.log('🔍 Fetching NFTs for user:', userAddress);

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const cacheCollection = db.collection('nft_cache');

    // Verificar cache primeiro
    const cacheKey = `user_nfts_${userAddress.toLowerCase()}`;
    const cached = await cacheCollection.findOne({ 
      key: cacheKey,
      expiresAt: { $gt: new Date() }
    });

    if (cached) {
      console.log('✅ Cache hit - returning cached NFTs');
      return NextResponse.json({
        success: true,
        data: cached.data,
        source: 'cache',
        cachedAt: cached.createdAt
      });
    }

    console.log('⚠️ Cache miss - fetching fresh data');
    
    try {
      // COMBINAR: NFTs Legacy (MongoDB) + Custom Collections + Marketplace Collections + Blockchain Verification
      console.log('🔄 Fetching from multiple sources: MongoDB legacy + custom collections + marketplace collections + blockchain verification');
      
      const [legacyData, customData, marketplaceCollectionsData, blockchainData] = await Promise.all([
        fetchUserLegacyNFTs(userAddress),
        fetchUserCustomCollectionNFTs(userAddress),
        fetchUserMarketplaceCollections(userAddress),
        // Verificar blockchain para NFTs que podem não estar no MongoDB
        fetchUserNFTsFromThirdweb(userAddress).catch(err => {
          console.warn('⚠️ Blockchain verification failed:', err);
          return { userAddress, nfts: [], totalNFTs: 0, owned: 0, listed: 0, created: 0, source: 'blockchain_failed' };
        })
      ]);
      
             // Combinar e deduplificar NFTs de todas as fontes
       const existingIds = new Set();
       const existingTokenIds = new Set(); // Para evitar duplicatas por tokenId
       const allNFTs: any[] = [];
       
       // 🎯 FUNÇÃO DE DEDUPLICAÇÃO MELHORADA (arrow function para evitar erro de strict mode)
       const addNFTIfNotDuplicate = (nft: any, source: string) => {
         // Criar IDs únicos baseados em diferentes critérios
         const id1 = nft.id || `${nft.contractAddress}_${nft.tokenId}`;
         const id2 = `${nft.contractAddress}_${nft.tokenId}`;
         const id3 = nft.tokenId ? `token_${nft.tokenId}` : null;
         
         // Verificar se já existe por qualquer critério
         const isDuplicate = existingIds.has(id1) || 
                           existingIds.has(id2) || 
                           (id3 && existingTokenIds.has(id3)) ||
                           // Verificar se é a mesma NFT por nome e categoria
                           allNFTs.some(existing => 
                             existing.name === nft.name && 
                             existing.category === nft.category &&
                             existing.contractAddress === nft.contractAddress
                           );
         
         if (!isDuplicate) {
           existingIds.add(id1);
           existingIds.add(id2);
           if (id3) existingTokenIds.add(id3);
           
           // Adicionar source para debug
           const nftWithSource = { ...nft, source };
           allNFTs.push(nftWithSource);
           console.log(`✅ Added NFT: ${nft.name} (${source})`);
         } else {
           console.log(`⚠️ Skipped duplicate: ${nft.name} (${source})`);
         }
       };
       
       // Adicionar NFTs legacy (MongoDB) primeiro
       for (const nft of legacyData.nfts) {
         addNFTIfNotDuplicate(nft, 'legacy');
       }
       
       // Adicionar custom collections
       for (const nft of customData.nfts) {
         addNFTIfNotDuplicate(nft, 'custom');
       }
       
       // Adicionar marketplace collections (custom e launchpad)
       for (const nft of marketplaceCollectionsData.nfts) {
         addNFTIfNotDuplicate(nft, 'marketplace');
       }
       
       // Adicionar NFTs do blockchain que não estão no MongoDB
       for (const nft of blockchainData.nfts) {
         addNFTIfNotDuplicate(nft, 'blockchain');
       }
      
      const freshData = {
        userAddress,
        nfts: allNFTs,
        totalNFTs: allNFTs.length,
        owned: allNFTs.filter(nft => nft.status === 'owned').length,
        listed: allNFTs.filter(nft => nft.status === 'listed').length,
        created: allNFTs.filter(nft => nft.status === 'created' || nft.status === 'owned').length,
        source: 'combined_all_sources',
        breakdown: {
          legacy: { count: legacyData.nfts.length, source: legacyData.source },
          custom: { count: customData.nfts.length, source: customData.source },
          marketplace_collections: { count: marketplaceCollectionsData.nfts.length, source: marketplaceCollectionsData.source },
          blockchain: { count: blockchainData.nfts.length, source: 'thirdweb_blockchain' },
          blockchainOnly: { count: allNFTs.filter(nft => (nft as any).source === 'blockchain_only').length }
        }
      };
      
      console.log(`✅ Combined ALL sources: ${freshData.totalNFTs} total`);
      console.log(`📊 Breakdown: ${legacyData.nfts.length} legacy + ${customData.nfts.length} custom + ${marketplaceCollectionsData.nfts.length} marketplace collections + ${blockchainData.nfts.length} blockchain (${allNFTs.filter(nft => (nft as any).source === 'blockchain_only').length} blockchain-only)`);
      
      // Salvar no cache
      const cacheDoc = {
        key: cacheKey,
        data: freshData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_TTL)
      };

      await cacheCollection.replaceOne(
        { key: cacheKey },
        cacheDoc,
        { upsert: true }
      );

      console.log(`✅ Fresh data cached for ${userAddress}`);
      
      return NextResponse.json({
        success: true,
        data: freshData,
        source: freshData.source || 'hybrid',
        cachedAt: new Date()
      });

    } catch (productionError) {
      console.error('❌ Production fetch error:', productionError);
      
      // Fallback to Thirdweb-only approach
      try {
        console.log('🔄 Falling back to Thirdweb-only approach');
        const thirdwebData = await fetchUserNFTsFromThirdweb(userAddress);
        
        return NextResponse.json({
          success: true,
          data: thirdwebData,
          source: 'thirdweb_fallback',
          warning: 'Using fallback method'
        });
      } catch (thirdwebError) {
        console.error('❌ Thirdweb fallback also failed:', thirdwebError);
        
        // Try expired cache as last resort
        const expiredCache = await cacheCollection.findOne({ key: cacheKey });
        
        if (expiredCache) {
          console.log('🔄 Using expired cache as last resort');
          return NextResponse.json({
            success: true,
            data: expiredCache.data,
            source: 'expired_cache',
            cachedAt: expiredCache.createdAt,
            warning: 'Data may be outdated'
          });
        }

        // Return empty result if everything fails
        const emptyResult = {
          userAddress,
          nfts: [],
          totalNFTs: 0,
          owned: 0,
          listed: 0,
          created: 0,
          contractStats: {
            totalNFTsInContract: 0,
            totalListings: 0,
            totalAuctions: 0
          }
        };

        return NextResponse.json({
          success: true,
          data: emptyResult,
          source: 'error_fallback',
          error: thirdwebError instanceof Error ? thirdwebError.message : 'Unknown error'
        });
      }
    }

  } catch (error) {
    console.error('❌ Error in NFT API:', error);
    
    // Sempre retornar resultado vazio em caso de erro
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    const emptyResult = {
      userAddress,
      nfts: [],
      totalNFTs: 0,
      owned: 0,
      listed: 0,
      created: 0,
      contractStats: {
        totalNFTsInContract: 0,
        totalListings: 0,
        totalAuctions: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: emptyResult,
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Função para popular o cache (será chamada por job em background)
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    
    if (!userAddress) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    console.log('🔄 Populating cache for user:', userAddress);

    const freshData = await fetchUserNFTsProductionReady(userAddress);
    
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const cacheCollection = db.collection('nft_cache');

    const cacheKey = `user_nfts_${userAddress.toLowerCase()}`;
    const cacheDoc = {
      key: cacheKey,
      data: freshData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_TTL)
    };

    await cacheCollection.replaceOne(
      { key: cacheKey },
      cacheDoc,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Cache populated successfully',
      userAddress,
      totalNFTs: freshData.totalNFTs
    });

  } catch (error) {
    console.error('❌ Error populating cache:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to populate cache'
    }, { status: 500 });
  }
} 