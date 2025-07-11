import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import { convertIpfsToHttp } from '@/lib/utils';

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

const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

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

async function fetchUserNFTsFromThirdweb(userAddress: string) {
  console.log('🔄 Fetching fresh NFT data from Thirdweb for:', userAddress);

  // Create contracts
  const nftContract = getContract({
    client,
    chain: polygonAmoy,
    address: NFT_CONTRACT_ADDRESS,
  });

  const marketplaceContract = getContract({
    client,
    chain: polygonAmoy,
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
                 `${(Number(listing.pricePerToken || 0) / 1e18).toFixed(2)} MATIC`;
        } else if (isAuctioned) {
          status = 'listed';
          const minBidWei = auction.minimumBidAmount || BigInt(0);
          const minBidMatic = Number(minBidWei) / Math.pow(10, 18);
          price = `${minBidMatic.toFixed(2)} MATIC`;
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

    console.log('⚠️ Cache miss - fetching from Thirdweb');
    
    try {
      // Buscar dados frescos do Thirdweb
      const freshData = await fetchUserNFTsFromThirdweb(userAddress);
      
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
        source: 'thirdweb',
        cachedAt: new Date()
      });

    } catch (thirdwebError) {
      console.error('❌ Thirdweb error:', thirdwebError);
      
      // Tentar cache expirado como fallback
      const expiredCache = await cacheCollection.findOne({ key: cacheKey });
      
      if (expiredCache) {
        console.log('🔄 Using expired cache as fallback');
        return NextResponse.json({
          success: true,
          data: expiredCache.data,
          source: 'expired_cache',
          cachedAt: expiredCache.createdAt,
          warning: 'Data may be outdated'
        });
      }

      // Retornar resultado vazio se tudo falhar
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

    const freshData = await fetchUserNFTsFromThirdweb(userAddress);
    
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