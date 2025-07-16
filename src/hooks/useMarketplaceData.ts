'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarketplaceNFT } from '@/types';
import { convertIpfsToHttp } from '@/lib/utils';
import { useActiveWalletChain } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721';
import { getNFTs as getNFTsERC1155, balanceOf as balanceOfERC1155 } from 'thirdweb/extensions/erc1155';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix';

// Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses - Updated to include Edition Drop
const NFT_CONTRACT_ADDRESSES = {
  // ERC721 NFT Collection Contract
  erc721: {
    80002: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // Polygon Amoy
    137: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // Polygon Mainnet
    88888: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // CHZ Mainnet
  },
  // ERC1155 Edition Drop Contract
  erc1155: {
    80002: '0xdFE746c26D3a7d222E89469C8dcb033fbBc75236', // Polygon Amoy - Edition Drop
    137: '0xdFE746c26D3a7d222E89469C8dcb033fbBc75236', // Polygon Mainnet (if needed)
    88888: '0xdFE746c26D3a7d222E89469C8dcb033fbBc75236', // CHZ Mainnet (if needed)
  }
};

// Marketplace contract address
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

interface MarketplaceData {
  nfts: MarketplaceNFT[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  categories: {
    jerseys: MarketplaceNFT[];
    stadiums: MarketplaceNFT[];
    badges: MarketplaceNFT[];
  };
  featuredNFTs: MarketplaceNFT[];
}

/**
 * Hook para buscar dados do marketplace usando Thirdweb hooks nativos
 * APENAS NFTs realmente mintados no contrato
 */
export function useMarketplaceData() {
  const chain = useActiveWalletChain();
  const [data, setData] = useState<MarketplaceData>({
    nfts: [],
    loading: true,
    error: null,
    totalCount: 0,
    categories: {
      jerseys: [],
      stadiums: [],
      badges: []
    },
    featuredNFTs: []
  });

  const fetchNFTsFromContract = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      console.log('🎯 Fetching NFTs using PRODUCTION-READY system...');
      
      // 🚀 USAR NOSSA SOLUÇÃO DE PRODUÇÃO
      const thirdwebData = await getThirdwebDataWithFallback();
      const { nfts, listings: marketplaceListings, auctions: marketplaceAuctions } = thirdwebData;

      // Get contract addresses for filtering (both ERC721 and ERC1155)
      const chainId = 80002; // Polygon Amoy where our NFTs exist
      const erc721Address = NFT_CONTRACT_ADDRESSES.erc721[chainId];
      const erc1155Address = NFT_CONTRACT_ADDRESSES.erc1155[chainId];
      console.log('🎯 Searching in contracts:', { erc721Address, erc1155Address });
      
      console.log(`✅ Found ${nfts.length} NFTs in contract`);
      console.log(`📋 Found ${marketplaceListings.length} total listings`);
      console.log(`🏆 Found ${marketplaceAuctions.length} total auctions`);
      
                  // Filter listings and auctions from both our NFT contracts (ERC721 and ERC1155)
      const ourContractListings = marketplaceListings.filter((listing: any) => {
        const listingContract = listing.assetContractAddress.toLowerCase();
        return listingContract === erc721Address.toLowerCase() || 
               listingContract === erc1155Address.toLowerCase();
      });
      
      const ourContractAuctions = marketplaceAuctions.filter((auction: any) => {
        const auctionContract = auction.assetContractAddress.toLowerCase();
        return auctionContract === erc721Address.toLowerCase() || 
               auctionContract === erc1155Address.toLowerCase();
      });
      
      // Create lookup maps for quick access
      const listingsByTokenId = new Map();
      const auctionsByTokenId = new Map();
      
      ourContractListings.forEach((listing: any) => {
        const tokenId = listing.tokenId.toString();
        listingsByTokenId.set(tokenId, listing);
      });
      
      ourContractAuctions.forEach((auction: any) => {
        const tokenId = auction.tokenId.toString();
        auctionsByTokenId.set(tokenId, auction);
      });
      
      console.log(`📋 Found ${marketplaceListings.length} total listings (${ourContractListings.length} from our contract)`);
      console.log(`🏆 Found ${marketplaceAuctions.length} total auctions (${ourContractAuctions.length} from our contract)`);
      
      // 🚨 DEBUG: Log detailed auction data from Thirdweb
      console.log('🔍 DETAILED AUCTION ANALYSIS:');
      ourContractAuctions.forEach((auction: any, index: number) => {
        console.log(`🏆 Auction ${index}:`, {
          tokenId: auction.tokenId?.toString(),
          id: auction.id, // ← Verificar se é 'id' em vez de 'auctionId'
          auctionId: auction.id, // Use 'id' instead of 'auctionId'
          auctionIdType: typeof auction.id,
          auctionCreator: auction.creatorAddress, // Use 'creatorAddress' instead of 'auctionCreator'
          minimumBidAmount: auction.minimumBidAmount?.toString(),
          endTimestamp: auction.endTimeInSeconds,
          rawAuction: auction
        });
      });
      
      // 🚨 DEBUG: Log all valid listings to find the correct ID
      console.log('🔍 ALL MARKETPLACE LISTINGS DEBUG:');
      marketplaceListings.forEach((listing: any, index: number) => {
        const listingContract = listing.assetContractAddress.toLowerCase();
        const isOurContract = listingContract === erc721Address.toLowerCase() || 
                             listingContract === erc1155Address.toLowerCase();
        
        console.log(`📋 Listing ${index}:`, {
          id: listing.id?.toString(),
          assetContract: listing.assetContractAddress,
          tokenId: listing.tokenId?.toString(),
          price: listing.currencyValuePerToken?.displayValue,
          creator: listing.creatorAddress,
          isOurContract
        });
      });
      
      // 🚨 DEBUG: Log specifically our contract listings
      console.log('🎯 OUR CONTRACT LISTINGS:');
      ourContractListings.forEach((listing: any, index: number) => {
        console.log(`📋 Our Listing ${index}:`, {
          id: listing.id?.toString(),
          tokenId: listing.tokenId?.toString(),
          price: listing.currencyValuePerToken?.displayValue,
          creator: listing.creatorAddress
        });
      });

      // Create contract instances for both ERC721 and ERC1155
      const erc721Contract = getContract({
        client,
        chain: polygonAmoy,
        address: erc721Address,
      });

      const erc1155Contract = getContract({
        client,
        chain: polygonAmoy,
        address: erc1155Address,
      });

      // Fetch NFTs from both contracts
      console.log('🔄 Fetching NFTs from both ERC721 and ERC1155 contracts...');
      
      let allNFTs: any[] = [];
      
      try {
        // Fetch ERC721 NFTs
        console.log('📦 Fetching ERC721 NFTs from:', erc721Address);
        const erc721NFTs = await getNFTs({ contract: erc721Contract, start: 0, count: 50 });
        console.log(`✅ Found ${erc721NFTs.length} ERC721 NFTs`);
        
        // Add contract type for later processing
        const taggedERC721NFTs = erc721NFTs.map(nft => ({
          ...nft,
          contractType: 'ERC721',
          contractAddress: erc721Address
        }));
        
        allNFTs = [...allNFTs, ...taggedERC721NFTs];
      } catch (error) {
        console.warn('⚠️ Failed to fetch ERC721 NFTs:', error);
      }
      
      try {
        // Fetch ERC1155 NFTs
        console.log('📦 Fetching ERC1155 NFTs from:', erc1155Address);
        const erc1155NFTs = await getNFTsERC1155({ contract: erc1155Contract, start: 0, count: 50 });
        console.log(`✅ Found ${erc1155NFTs.length} ERC1155 NFTs`);
        
        // Add contract type for later processing
        const taggedERC1155NFTs = erc1155NFTs.map(nft => ({
          ...nft,
          contractType: 'ERC1155',
          contractAddress: erc1155Address
        }));
        
        allNFTs = [...allNFTs, ...taggedERC1155NFTs];
      } catch (error) {
        console.warn('⚠️ Failed to fetch ERC1155 NFTs:', error);
      }
      
      console.log(`🎯 Total NFTs found: ${allNFTs.length} (ERC721 + ERC1155)`);
      
      // Process NFTs with MANUAL OWNER LOOKUP + MARKETPLACE DATA
      console.log('🔄 Processing NFTs with owner lookup + marketplace data...');
      console.log('📋 Sample NFT from combined results:', allNFTs[0]);
       
       const processedNFTsPromises = allNFTs.map(async (nft: any, index: number) => {
         try {
           const tokenId = nft.id.toString();
           const metadata = nft.metadata || {};
           const contractType = nft.contractType;
           const contractAddress = nft.contractAddress;
           
           console.log(`🔍 Processing NFT #${tokenId} from ${contractType} contract:`, contractAddress);
           
           let nftOwner = 'Unknown';
           if (contractType === 'ERC721') {
               nftOwner = await ownerOf({
                 contract: getContract({ client, chain: polygonAmoy, address: contractAddress }),
                 tokenId: BigInt(tokenId)
               });
           } else {
             nftOwner = nft.owner || 'Not available for ERC1155';
           }

           const listing = listingsByTokenId.get(tokenId);
           const auction = auctionsByTokenId.get(tokenId);
           const imageUrlHttp = convertIpfsToHttp(metadata.image || '');

           const finalNFT: MarketplaceNFT = {
             id: tokenId,
             tokenId: tokenId,
             name: metadata.name || 'Untitled NFT',
             description: metadata.description || '',
             image: imageUrlHttp,
             imageUrl: imageUrlHttp,
             price: listing?.currencyValuePerToken?.displayValue || (auction ? `${auction.minimumBidAmount?.toString()} (Bid)` : 'Not for sale'),
             currency: listing?.currencyValuePerToken?.symbol || 'MATIC',
             owner: nftOwner,
             creator: nftOwner,
             category: determineNFTCategoryFromMetadata(metadata),
             type: contractType,
             attributes: metadata.attributes || [],
             isListed: !!listing,
             isVerified: true,
             blockchain: {
               verified: true,
               tokenId: tokenId,
               owner: nftOwner,
               contractType: contractType,
             },
             contractAddress: contractAddress,
             isAuction: !!auction,
             activeOffers: 0, 
             listingId: listing?.id.toString(),
             auctionId: auction?.id.toString(),
             currentBid: auction?.minimumBidAmount?.toString(),
             endTime: auction?.endTimeInSeconds ? new Date(Number(auction.endTimeInSeconds) * 1000) : undefined,
           };
           return finalNFT;

         } catch (error) {
           console.error(`❌ Failed to process NFT at index ${index} (ID: ${nft.id?.toString()}):`, error);
           return null; 
         }
       });

       const processedNFTsResults = await Promise.all(processedNFTsPromises);
       const validProcessedNFTs = processedNFTsResults.filter(Boolean) as MarketplaceNFT[];
      
      console.log(`✅ Processed ${validProcessedNFTs.length} valid NFTs successfully`);
      
      // Categorize and set final data
       const categorizedNFTs = {
         jerseys: [],
         stadiums: [],
         badges: []
       };
       const featuredNFTs = validProcessedNFTs.slice(0, 6); // Use first 6 as featured

       console.log('✅ Marketplace data processed successfully:', {
         total: validProcessedNFTs.length,
         featured: featuredNFTs.length,
         sampleNFT: validProcessedNFTs[0] ? {
           name: validProcessedNFTs[0].name,
           image: validProcessedNFTs[0].image ? 'has image' : 'no image'
         } : 'none'
       });

      setData({
        nfts: validProcessedNFTs,
        loading: false,
        error: null,
        totalCount: validProcessedNFTs.length,
        categories: categorizedNFTs,
        featuredNFTs
      });

    } catch (error) {
      console.error('❌ Error fetching NFTs from contract:', error);
      
      // In production, try to fetch from MongoDB API as fallback
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log('🔄 Trying MongoDB fallback...');
          const fallbackData = await fetchFromMongoDB();
          setData(prev => ({ 
            ...prev, 
            loading: false, 
            error: null,
            ...fallbackData
          }));
          return;
        } catch (fallbackError) {
          console.error('❌ MongoDB fallback also failed:', fallbackError);
        }
      }
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs from contract'
      }));
    }
  }, [chain]);

  useEffect(() => {
    fetchNFTsFromContract();
  }, [fetchNFTsFromContract]);

  // Fallback function to fetch from MongoDB
  const fetchFromMongoDB = async () => {
    const timestamp = Date.now();
    const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
      fetch(`/api/jerseys/minted?_t=${timestamp}`),
      fetch(`/api/stadiums/minted?_t=${timestamp}`), 
      fetch(`/api/badges/minted?_t=${timestamp}`)
    ]);

    const jerseysData = await jerseysResponse.json();
    const stadiumsData = await stadiumsResponse.json();
    const badgesData = await badgesResponse.json();

    const jerseys = jerseysData.data || [];
    const stadiums = stadiumsData.data || [];
    const badges = badgesData.data || [];

    const allNFTs = [...jerseys, ...stadiums, ...badges];
    
    return {
      nfts: allNFTs,
      totalCount: allNFTs.length,
      categories: {
        jerseys: jerseys,
        stadiums: stadiums,
        badges: badges
      },
      featuredNFTs: allNFTs.slice(0, 6)
    };
  };

  return { ...data, refetch: fetchNFTsFromContract };
}

// Removed fetchMarketplaceListings - now using native getAllValidListings directly

/**
 * Process Thirdweb NFT for marketplace display
 */
function processThirdwebNFT(nft: any, marketplaceListing?: any): MarketplaceNFT {
  try {
    const tokenId = nft.id.toString();
    const metadata = nft.metadata;
    const owner = nft.owner || 'Unknown';
  
  // Process image URL
  const rawImage = metadata?.image || '';
  const processedImage = rawImage ? convertIpfsToHttp(rawImage) : '';
  
  // Determine category from metadata
  const category = determineNFTCategoryFromMetadata(metadata);
  
  // Marketplace data if listed
  const isListed = !!marketplaceListing;
  const price = marketplaceListing?.currencyValuePerToken?.displayValue || 'Not for sale';
  const currency = marketplaceListing?.currencyValuePerToken?.symbol || 'MATIC';

     console.log(`📦 Processing NFT #${tokenId}:`, {
     name: metadata?.name || `NFT #${tokenId}`,
     category,
     isListed,
     price,
     hasImage: !!processedImage,
     rawImage,
     processedImage: processedImage.slice(0, 50) + '...',
     metadata: metadata ? 'exists' : 'missing'
   });

  return {
    id: tokenId,
    tokenId,
    name: metadata?.name || `NFT #${tokenId}`,
    description: metadata?.description || '',
    image: processedImage,
    imageUrl: processedImage,
    price,
    currency,
    owner,
    creator: owner.slice(0, 6) + '...',
    category,
    type: category,
    attributes: metadata?.attributes || [],
    isListed,
    isVerified: true,
    blockchain: {
      verified: true,
      tokenId,
      owner,
      contractAddress: nft.contract?.address
    },
    marketplace: marketplaceListing ? {
          isListed: true,
      listingId: marketplaceListing.id?.toString(),
      price: marketplaceListing.pricePerToken,
      priceFormatted: price,
      currency: marketplaceListing.currencyContractAddress,
      currencySymbol: currency
    } : {
      isListed: false
    },
    contractAddress: nft.contract?.address || '',
    listingId: marketplaceListing?.id?.toString(),
          isAuction: false,
     activeOffers: 0
   };
   
 } catch (error) {
   console.error(`❌ Error in processThirdwebNFT for token ${nft.id}:`, error);
   // Return a basic NFT object
   return {
     id: nft.id?.toString() || 'unknown',
     tokenId: nft.id?.toString() || 'unknown',
     name: `NFT #${nft.id || 'unknown'}`,
     description: '',
     image: '',
     imageUrl: '',
     price: 'Not for sale',
     currency: 'MATIC',
     owner: 'Unknown',
     creator: 'Unknown',
     category: 'nft',
     type: 'nft',
     attributes: [],
     isListed: false,
     isVerified: true,
     blockchain: {},
     marketplace: { isListed: false },
     contractAddress: '',
     isAuction: false,
     activeOffers: 0
   };
 }
}

/**
 * Determine NFT category from metadata
 */
function determineNFTCategoryFromMetadata(metadata: any): string {
  if (!metadata) return 'nft';
  
  const name = metadata.name?.toLowerCase() || '';
  const description = metadata.description?.toLowerCase() || '';
  
  if (name.includes('jersey') || description.includes('jersey')) {
    return 'jersey';
  }
  if (name.includes('stadium') || description.includes('stadium')) {
    return 'stadium';
  }
  if (name.includes('badge') || description.includes('badge')) {
    return 'badge';
  }
  
  return 'nft';
}

/**
 * Categorize NFTs by type
 */
function categorizeNFTs(nfts: MarketplaceNFT[]) {
  return {
    jerseys: nfts.filter(nft => nft.type === 'jersey'),
    stadiums: nfts.filter(nft => nft.type === 'stadium'),
    badges: nfts.filter(nft => nft.type === 'badge')
  };
}

/**
 * Select featured NFTs
 */
function selectFeaturedNFTs(nfts: MarketplaceNFT[]): MarketplaceNFT[] {
  // Prioritize NFTs with images and good metadata
        const withImages = nfts.filter((nft: any) => 
    nft.image && 
    nft.name
  );
  
  console.log('🌟 Featured NFTs selection:', {
    totalNFTs: nfts.length,
    withImages: withImages.length,
    sampleNFT: nfts[0] ? {
      name: nfts[0].name,
      hasImage: !!nfts[0].image,
      hasDescription: !!nfts[0].description
    } : 'none'
  });
  
  return withImages.slice(0, 6);
} 