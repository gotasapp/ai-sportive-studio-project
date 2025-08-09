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
      console.log('🎯 [V2] Fetching NFTs from BOTH sources (API + Thirdweb)...');
      
      // 1. Buscar da nossa API (inclui launchpad)
      const [apiResponse, thirdwebData] = await Promise.all([
        fetch('/api/marketplace/nfts').then(res => res.json()),
        getThirdwebDataWithFallback()
      ]);
      
      console.log('✅ [V2] Data sources loaded:', {
        apiItems: apiResponse.success ? apiResponse.data.length : 0,
        thirdwebNFTs: thirdwebData.nfts.length,
        thirdwebListings: thirdwebData.listings.length,
        thirdwebAuctions: thirdwebData.auctions.length
      });
      
      // 2. Processar dados da API (coleções launchpad)
      const apiNFTs = apiResponse.success ? apiResponse.data.map((nft: any) => ({
        id: nft._id || nft.tokenId,
        tokenId: nft.tokenId,
        name: nft.metadata?.name || nft.name || 'Untitled',
        description: nft.metadata?.description || nft.description || '',
        image: convertIpfsToHttp(nft.metadata?.image || nft.image || nft.imageUrl || ''),
        imageUrl: convertIpfsToHttp(nft.metadata?.image || nft.image || nft.imageUrl || ''),
        price: nft.marketplace?.isListed ? (nft.marketplace?.price || 'Listed') : 'Not for sale',
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
        isAuction: nft.marketplace?.isAuction || false,
        activeOffers: 0,
        listingId: nft.marketplace?.thirdwebData?.listingId || nft.marketplace?.listingId,
        auctionId: nft.marketplace?.thirdwebAuctionData?.auctionId,
        currentBid: nft.marketplace?.thirdwebAuctionData?.minimumBidAmount,
        endTime: nft.marketplace?.thirdwebAuctionData?.endTime ? new Date(Number(nft.marketplace.thirdwebAuctionData.endTime) * 1000) : undefined,
        source: 'api'
      })) : [];

      // 3. Processar dados do Thirdweb (NFTs normais)
      const { nfts: thirdwebNFTs, listings, auctions } = thirdwebData;
      
      // === BUSCAR BLACKLIST DO BACKEND ===
      let hiddenIds: string[] = [];
      try {
        const res = await fetch('/api/marketplace/hidden-nfts');
        if (res.ok) {
          const data = await res.json();
          hiddenIds = data.hiddenIds || [];
        }
      } catch (err) {
        console.warn('Não foi possível buscar a blacklist de NFTs ocultas:', err);
      }
      
      const filteredThirdwebNFTs = thirdwebNFTs.filter((nft: any) => !hiddenIds.includes(nft.id?.toString()));
      const listingsByTokenId = new Map(listings.map((l: any) => [l.tokenId.toString(), l]));
      const auctionsByTokenId = new Map(auctions.map((a: any) => [a.tokenId.toString(), a]));
      
      const thirdwebProcessedPromises = filteredThirdwebNFTs.map(async (nft: any, index: number) => {
        try {
          const tokenId = nft.id.toString();
          const metadata = nft.metadata || {};
          const contractAddress = NFT_CONTRACT_ADDRESS;
          const contractType = nft.type || 'ERC721';
          
          let nftOwner = nft.owner || 'Unknown';

          // Buscar owner real da blockchain
          try {
            const contract = getContract({ client, chain: polygonAmoy, address: contractAddress });
            const realOwner = await ownerOf({ contract, tokenId: BigInt(tokenId) });
            if (realOwner) {
              nftOwner = realOwner;
            }
          } catch (ownerError) {
            console.warn(`[V2] Não foi possível buscar owner real para tokenId ${tokenId}:`, ownerError);
          }
          
          const listing = listingsByTokenId.get(tokenId);
          const auction = auctionsByTokenId.get(tokenId);
          const imageUrlHttp = convertIpfsToHttp(metadata.image || '');

          return {
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
            source: 'thirdweb'
          };

        } catch (error) {
          console.error(`❌ [V2] Failed to process NFT at index ${index} (ID: ${nft.id?.toString()}):`, error);
          return null; 
        }
      });

      const thirdwebProcessedResults = await Promise.all(thirdwebProcessedPromises);
      const validThirdwebNFTs = thirdwebProcessedResults.filter(Boolean) as MarketplaceNFT[];
      
      // 4. Combinar todos os NFTs
      const validProcessedNFTs = [...apiNFTs, ...validThirdwebNFTs];

      console.log(`✅ [V2] Combined NFTs:`, {
        apiNFTs: apiNFTs.length,
        thirdwebNFTs: validThirdwebNFTs.length,
        total: validProcessedNFTs.length
      });
      
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