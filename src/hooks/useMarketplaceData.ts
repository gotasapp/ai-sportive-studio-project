'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarketplaceNFT } from '@/types';
import { convertIpfsToHttp } from '@/lib/utils';
import { useActiveWalletChain } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { ownerOf } from 'thirdweb/extensions/erc721';
import { balanceOf as balanceOfERC1155 } from 'thirdweb/extensions/erc1155';
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS!;
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
      console.log('🎯 [V2] Fetching NFTs from marketplace API (includes launchpad)...');
      
      // Usar nossa API que inclui coleções launchpad
      const response = await fetch('/api/marketplace/nfts');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const apiData = await response.json();
      if (!apiData.success) {
        throw new Error(apiData.error || 'API returned error');
      }
      
      console.log('✅ [V2] API Data received:', {
        total: apiData.data.length,
        stats: apiData.stats
      });
      
      // Processar dados da API (já vem formatados)
      const allNFTs = apiData.data;
      const listings: any[] = []; // A API já inclui informações de listing
      const auctions: any[] = []; // A API já inclui informações de auction

      console.log(`✅ [V2] Found ${allNFTs.length} NFTs, ${listings.length} listings, ${auctions.length} auctions.`);
      
      // Os dados já vêm processados da nossa API
      const validProcessedNFTs = allNFTs.map((nft: any) => ({
        id: nft._id || nft.tokenId,
        tokenId: nft.tokenId,
        name: nft.metadata?.name || nft.name || 'Untitled',
        description: nft.metadata?.description || nft.description || '',
        image: nft.metadata?.image || nft.image || nft.imageUrl,
        imageUrl: nft.metadata?.image || nft.image || nft.imageUrl,
        price: nft.marketplace?.isListed ? 'Listed' : 'Not for sale',
        currency: 'MATIC',
        owner: nft.owner || 'Unknown',
        creator: nft.creator || nft.owner || 'Unknown',
        category: nft.marketplace?.category || nft.category || nft.type || 'nft',
        type: nft.type || 'ERC721',
        attributes: nft.metadata?.attributes || [],
        isListed: nft.marketplace?.isListed || false,
        isVerified: nft.marketplace?.verified || true,
        blockchain: {
          verified: true,
          tokenId: nft.tokenId,
          owner: nft.owner,
          contractType: nft.type || 'ERC721',
        },
        contractAddress: nft.contractAddress,
        isAuction: false,
        activeOffers: 0,
        listingId: undefined,
        auctionId: undefined,
        currentBid: undefined,
        endTime: undefined,
      }));
      
      console.log(`✅ [V2] Processed ${validProcessedNFTs.length} valid NFTs successfully`);
      
      const categorizedNFTs = categorizeNFTs(validProcessedNFTs);
      const featuredNFTs = selectFeaturedNFTs(validProcessedNFTs);

      setData({
        nfts: validProcessedNFTs,
        loading: false,
        error: null,
        totalCount: validProcessedNFTs.length,
        categories: categorizedNFTs,
        featuredNFTs
      });

    } catch (error) {
      console.error('❌ [V2] Error fetching NFTs from contract:', error);
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

  return { ...data, refetch: fetchNFTsFromContract };
}

function determineNFTCategoryFromMetadata(metadata: any): string {
  if (!metadata) return 'nft';
  
  const name = metadata.name?.toLowerCase() || '';
  const description = metadata.description?.toLowerCase() || '';
  const attributes = metadata.attributes || [];

  const typeAttribute = attributes.find((attr: any) => attr.trait_type?.toLowerCase() === 'type');
  if (typeAttribute) {
    const value = typeAttribute.value?.toLowerCase();
    if (['jersey', 'stadium', 'badge'].includes(value)) {
      return value;
    }
  }
  
  if (name.includes('jersey') || description.includes('jersey')) return 'jersey';
  if (name.includes('stadium') || description.includes('stadium')) return 'stadium';
  if (name.includes('badge') || description.includes('badge')) return 'badge';
  
  return 'nft';
}

function categorizeNFTs(nfts: MarketplaceNFT[]) {
  const categories: { [key: string]: MarketplaceNFT[] } = {
    jerseys: [],
    stadiums: [],
    badges: [],
    nfts: []
  };

  nfts.forEach(nft => {
    const category = nft.category || 'nfts';
    if (categories[category]) {
      categories[category].push(nft);
    } else {
      categories.nfts.push(nft);
    }
  });

  return {
    jerseys: categories.jerseys,
    stadiums: categories.stadiums,
    badges: categories.badges,
  };
}

function selectFeaturedNFTs(nfts: MarketplaceNFT[]): MarketplaceNFT[] {
  const withImages = nfts.filter((nft: any) => nft.image && nft.name);
  return withImages.slice(0, 6);
} 