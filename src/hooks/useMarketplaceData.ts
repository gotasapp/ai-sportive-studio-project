'use client';

import { useState, useEffect } from 'react';
import { MarketplaceNFT } from '@/types';
import { convertIpfsToHttp } from '@/lib/utils';
import { useActiveWalletChain } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';

// Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses
const NFT_CONTRACT_ADDRESSES = {
  80002: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // Polygon Amoy
  137: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // Polygon Mainnet (if needed)
  88888: '0xfF973a4aFc5A96DEc81366461A461824c4f80254', // CHZ Mainnet (if needed)
};

// Marketplace contract address
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET!;

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

  useEffect(() => {
    fetchNFTsFromContract();
  }, [chain?.id]);

  const fetchNFTsFromContract = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      console.log('🎯 Fetching NFTs using Thirdweb native hooks...');

             // ALWAYS use Polygon Amoy where NFTs are minted (override user's chain)
       const chainId = 80002; // Force Polygon Amoy where our NFTs exist
       const contractAddress = NFT_CONTRACT_ADDRESSES[chainId as keyof typeof NFT_CONTRACT_ADDRESSES];
       
       if (!contractAddress) {
         throw new Error(`Contract not deployed on chain ${chainId}`);
       }

       console.log('🔗 Contract:', contractAddress, 'on chain:', chainId, '(forced to Amoy where NFTs exist)');
       
       if (chain?.id && chain.id !== 80002) {
         console.warn(`⚠️ User is on chain ${chain.id} but NFTs are on Polygon Amoy (80002). Forcing Amoy for NFT data.`);
       }

      // Always use Polygon Amoy where our NFTs are deployed
      const currentChain = polygonAmoy;
      const contract = getContract({
        client,
        chain: currentChain,
        address: contractAddress,
      });

      // Fetch all NFTs from the contract using Thirdweb's getNFTs
      console.log('📦 Fetching NFTs from contract...');
      const nfts = await getNFTs({
        contract,
        start: 0,
        count: 100, // Fetch up to 100 NFTs
      });

            console.log(`✅ Found ${nfts.length} NFTs in contract`);

      // Fetch marketplace listings using NATIVE Thirdweb function
      console.log('🏪 Fetching marketplace listings using getAllValidListings...');
      
      const marketplaceContract = getContract({
        client,
        chain: currentChain,
        address: MARKETPLACE_CONTRACT_ADDRESS,
      });
      
      const marketplaceListings = await getAllValidListings({
        contract: marketplaceContract,
        start: 0,
        count: 100, // Get up to 100 listings
      });
      
      // Filter only listings from our NFT contract
      const ourContractListings = marketplaceListings.filter(listing => 
        listing.assetContractAddress.toLowerCase() === contractAddress.toLowerCase()
      );
      
      // Create lookup map for quick access
      const listingsByTokenId = new Map();
      ourContractListings.forEach(listing => {
        const tokenId = listing.tokenId.toString();
        listingsByTokenId.set(tokenId, listing);
      });
      
      console.log(`📋 Found ${marketplaceListings.length} total listings, ${ourContractListings.length} from our contract, mapped ${listingsByTokenId.size} by tokenId`);

      // Process NFTs with MANUAL OWNER LOOKUP + MARKETPLACE DATA
      console.log('🔄 Processing NFTs with owner lookup + marketplace data...');
      console.log('📋 Sample NFT from Thirdweb:', nfts[0]);
       
       const processedNFTs = await Promise.all(nfts.map(async (nft, index) => {
         const tokenId = nft.id.toString();
         const metadata = nft.metadata || {};
         
         // MANUALLY FETCH OWNER using ownerOf function
         let nftOwner = 'Unknown';
         try {
           nftOwner = await ownerOf({
             contract,
             tokenId: BigInt(tokenId)
           });
           console.log(`✅ NFT #${tokenId} owner found:`, nftOwner);
         } catch (error) {
           console.warn(`⚠️ Could not fetch owner for NFT #${tokenId}:`, error);
           nftOwner = nft.owner || 'Unknown';
         }
         
         // Check if this NFT is listed in marketplace
         const marketplaceListing = listingsByTokenId.get(tokenId);
         const isListed = !!marketplaceListing;
         const listingPrice = marketplaceListing?.currencyValuePerToken?.displayValue || 'Not for sale';
         const currency = marketplaceListing?.currencyValuePerToken?.symbol || 'MATIC';
         
         console.log(`🔍 NFT #${tokenId} FULL DEBUG:`, {
           rawNftOwner: nft.owner,
           fetchedOwner: nftOwner,
           nftOwnerType: typeof nft.owner,
           hasMetadata: !!metadata,
           hasImage: !!metadata.image,
           isListed,
           listingPrice,
           listingId: marketplaceListing?.id
         });
         
         const marketplaceNFT: MarketplaceNFT = {
           id: tokenId,
           tokenId: tokenId,
           name: metadata.name || `NFT #${tokenId}`,
           description: metadata.description || '',
           image: metadata.image ? convertIpfsToHttp(metadata.image) : '',
           imageUrl: metadata.image ? convertIpfsToHttp(metadata.image) : '',
           price: isListed ? listingPrice : 'Not for sale',
           currency: currency,
           owner: nftOwner,
           creator: nftOwner ? nftOwner.slice(0, 6) + '...' : 'Unknown',
           category: 'nft',
           type: 'nft', 
           attributes: metadata.attributes || [],
           isListed: isListed,
           isVerified: true,
           blockchain: { verified: true, tokenId, owner: nft.owner },
           contractAddress: contractAddress,
           isAuction: false,
           activeOffers: 0,
           listingId: marketplaceListing?.id
         };
         
         console.log(`✅ NFT #${tokenId} processed:`, {
           name: marketplaceNFT.name,
           hasImage: !!marketplaceNFT.image,
           imageUrl: marketplaceNFT.image?.slice(0, 50) + '...'
         });
         
         return marketplaceNFT;
       }));
       
       console.log('🎯 All NFTs processed successfully:', processedNFTs.length);

             // Categorize and select featured NFTs (simplified)
       const categorizedNFTs = {
         jerseys: [],
         stadiums: [],
         badges: []
       };
       const featuredNFTs = processedNFTs.slice(0, 6); // Use first 6 as featured

       console.log('✅ Marketplace data processed successfully:', {
         total: processedNFTs.length,
         featured: featuredNFTs.length,
         sampleNFT: processedNFTs[0] ? {
           name: processedNFTs[0].name,
           image: processedNFTs[0].image ? 'has image' : 'no image'
         } : 'none'
       });

      setData({
        nfts: processedNFTs,
        loading: false,
        error: null,
        totalCount: processedNFTs.length,
        categories: categorizedNFTs,
        featuredNFTs
      });

    } catch (error) {
      console.error('❌ Error fetching NFTs from contract:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs from contract'
      }));
    }
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
      listingId: marketplaceListing.id,
      price: marketplaceListing.pricePerToken,
      priceFormatted: price,
      currency: marketplaceListing.currencyContractAddress,
      currencySymbol: currency
    } : {
      isListed: false
    },
    contractAddress: nft.contract?.address || '',
    listingId: marketplaceListing?.id,
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
  const withImages = nfts.filter(nft => 
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