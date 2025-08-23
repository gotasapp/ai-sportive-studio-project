'use client';

import { useState, useCallback, useEffect } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix';
import { convertIpfsToHttp } from '@/lib/utils';
import { USE_CHZ_MAINNET, ACTIVE_CHAIN_ID, NETWORK_NAME } from '@/lib/network-config';

interface MarketplaceNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  price: string;
  currency: string;
  owner: string;
  creator: string;
  category: string;
  type: string;
  attributes: any[];
  isListed: boolean;
  isVerified: boolean;
  blockchain: {
    verified: boolean;
    tokenId: string;
    owner: string;
    contractType: string;
  };
  contractAddress: string;
  isAuction: boolean;
  activeOffers: number;
  listingId?: string;
  auctionId?: string;
  currentBid?: string;
  endTime?: Date;
  source: 'api' | 'thirdweb';
  
  // Collection identification
  isCollection?: boolean;
  isCustomCollection?: boolean;
  collectionId?: string;
  
  // Collection stats
  mintedUnits?: number;
  totalUnits?: number;
  availableUnits?: number;
  uniqueOwners?: number;
  listedCount?: number;
  auctionCount?: number;
}

interface MarketplaceData {
  nfts: MarketplaceNFT[];
  collections: MarketplaceNFT[]; // ✅ novo
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
  
  // 🎯 LOG INICIAL PARA CONFIRMAR QUE O HOOK ESTÁ SENDO CHAMADO
  console.log('🚀 [HOOK] useMarketplaceData iniciado!', {
    timestamp: new Date().toISOString(),
    USE_CHZ_MAINNET,
    ACTIVE_CHAIN_ID,
    NETWORK_NAME
  });
  
  const [data, setData] = useState<MarketplaceData>({
    nfts: [],
    collections: [], // ✅
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

  const fetchNFTsFromContract = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setData(prev => ({ ...prev, loading: true, error: null }));
      }
      
      // 🎯 LOGS DETALHADOS PARA VERIFICAR REDE
      console.log('🎯 [MARKETPLACE DATA] Iniciando busca de dados...');
      console.log('🔧 [NETWORK CONFIG]', {
        USE_CHZ_MAINNET,
        ACTIVE_CHAIN_ID,
        NETWORK_NAME,
        userChainId: chain?.id,
        userChainName: chain?.name,
        isUserOnCorrectNetwork: chain?.id === ACTIVE_CHAIN_ID
      });
      
      console.log('🎯 [V2] Fetching NFTs from BOTH sources (API + Thirdweb)...');
      
             // 1. Fetch from our API (includes launchpad) - ALWAYS FRESH DATA
       const [apiResponse, thirdwebData] = await Promise.all([
         fetch('/api/marketplace/nfts?_t=' + Date.now()).then(res => res.json()), // Cache bust
         getThirdwebDataWithFallback()
       ]);

              // 2. Fetch individual minted NFTs from specific APIs
       const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.allSettled([
         fetch('/api/jerseys/minted?_t=' + Date.now()).then(res => res.json()),
         fetch('/api/stadiums/minted?_t=' + Date.now()).then(res => res.json()),
         fetch('/api/badges/minted?_t=' + Date.now()).then(res => res.json())
       ]);

       // Initialize individual minted NFTs array
       const individualMintedNFTs: any[] = [];
       
       console.log('✅ [V2] Data sources loaded:', {
         apiItems: apiResponse.success ? apiResponse.data.length : 0,
         individualMintedNFTs: individualMintedNFTs.length,
         thirdwebNFTs: thirdwebData.nfts.length,
         thirdwebListings: thirdwebData.listings.length,
         thirdwebAuctions: thirdwebData.auctions.length,
         network: USE_CHZ_MAINNET ? 'CHZ' : 'AMOY'
       });
      
             // 3. Process API data (collections only – exclude minted NFTs)
       const apiNFTs = apiResponse.success
        ? apiResponse.data
                         .filter((nft: any) => {
               const type = nft.type?.toLowerCase?.() || 'undefined';
               
               const shouldInclude = type !== 'custom_collection_mint' && type !== 'launchpad_collections_mint';

               if (!shouldInclude) {
                 console.log('🚫 NFT MINTADA EXCLUÍDA DO MARKETPLACE:', {
                   name: nft.name,
                   tokenId: nft.tokenId,
                   type,
                   collectionId: nft.collectionId,
                 });
               } else {
                 console.log('✅ NFT INCLUÍDA NO MARKETPLACE:', {
                   name: nft.name,
                   tokenId: nft.tokenId,
                   type,
                   collectionId: nft.collectionId,
                 });
               }

               return shouldInclude;
             })
            .map((nft: any) => ({
              id: nft._id || nft.tokenId,
              tokenId: nft.tokenId,
              name: nft.metadata?.name || nft.name || 'Untitled',
              description: nft.metadata?.description || nft.description || '',
              image: convertIpfsToHttp(nft.metadata?.image || nft.image || nft.imageUrl || ''),
              imageUrl: convertIpfsToHttp(nft.metadata?.image || nft.image || nft.imageUrl || ''),
              price: nft.marketplace?.isListed ? (nft.marketplace?.price || 'Listed') : 'Not for sale',
              currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
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
              source: 'api',
              
              // 🎯 Collection identification
              isCollection: nft.marketplace?.isCollection || false,
              isCustomCollection: nft.marketplace?.isCustomCollection || false,
              collectionId: nft.mongoId || nft._id,

              // 🎯 Collection stats for overview
              mintedUnits: nft.marketplace?.mintedUnits || 0,
              totalUnits: nft.marketplace?.totalUnits || 0,
              availableUnits: nft.marketplace?.availableUnits || 0,
              uniqueOwners: nft.stats?.uniqueOwners || 0,
              listedCount: nft.marketplace?.thirdwebListedCount || 0,
              auctionCount: nft.marketplace?.thirdwebAuctionCount || 0
                         }))
         : [];

       // 4. Process individual minted NFTs
       
       // Process jerseys
       if (jerseysResponse.status === 'fulfilled' && jerseysResponse.value.success) {
         const jerseys = jerseysResponse.value.data.map((jersey: any) => ({
           id: jersey._id || jersey.tokenId,
           tokenId: jersey.tokenId,
           name: jersey.name || 'Untitled Jersey',
           description: jersey.description || '',
           image: convertIpfsToHttp(jersey.imageUrl || jersey.image || ''),
           imageUrl: convertIpfsToHttp(jersey.imageUrl || jersey.image || ''),
           price: 'Not for sale',
           currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
           owner: jersey.owner || jersey.creator?.wallet || 'Unknown',
           creator: jersey.creator?.name || jersey.creator?.wallet || 'Unknown',
           category: 'jersey',
           type: 'ERC721',
           attributes: jersey.attributes || [],
           isListed: false,
           isVerified: true,
           blockchain: {
             verified: true,
             tokenId: jersey.tokenId,
             owner: jersey.owner || jersey.creator?.wallet || 'Unknown',
             contractType: 'ERC721',
           },
           contractAddress: jersey.contractAddress || '',
           isAuction: false,
           activeOffers: 0,
           source: 'api',
           isIndividualMinted: true // ✅ Flag para identificar NFTs individuais mintadas
         }));
         individualMintedNFTs.push(...jerseys);
       }

       // Process stadiums
       if (stadiumsResponse.status === 'fulfilled' && stadiumsResponse.value.success) {
         const stadiums = stadiumsResponse.value.data.map((stadium: any) => ({
           id: stadium._id || stadium.tokenId,
           tokenId: stadium.tokenId,
           name: stadium.name || 'Untitled Stadium',
           description: stadium.description || '',
           image: convertIpfsToHttp(stadium.imageUrl || stadium.image || ''),
           imageUrl: convertIpfsToHttp(stadium.imageUrl || stadium.image || ''),
           price: 'Not for sale',
           currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
           owner: stadium.owner || stadium.creator?.wallet || 'Unknown',
           creator: stadium.creator?.name || stadium.creator?.wallet || 'Unknown',
           category: 'stadium',
           type: 'ERC721',
           attributes: stadium.attributes || [],
           isListed: false,
           isVerified: true,
           blockchain: {
             verified: true,
             tokenId: stadium.tokenId,
             owner: stadium.owner || stadium.creator?.wallet || 'Unknown',
             contractType: 'ERC721',
           },
           contractAddress: stadium.contractAddress || '',
           isAuction: false,
           activeOffers: 0,
           source: 'api',
           isIndividualMinted: true // ✅ Flag para identificar NFTs individuais mintadas
         }));
         individualMintedNFTs.push(...stadiums);
       }

       // Process badges
       if (badgesResponse.status === 'fulfilled' && badgesResponse.value.success) {
         const badges = badgesResponse.value.data.map((badge: any) => ({
           id: badge._id || badge.tokenId,
           tokenId: badge.tokenId,
           name: badge.name || 'Untitled Badge',
           description: badge.description || '',
           image: convertIpfsToHttp(badge.imageUrl || badge.image || ''),
           imageUrl: convertIpfsToHttp(badge.imageUrl || badge.image || ''),
           price: 'Not for sale',
           currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
           owner: badge.owner || badge.creator?.wallet || 'Unknown',
           creator: badge.creator?.name || badge.creator?.wallet || 'Unknown',
           category: 'badge',
           type: 'ERC721',
           attributes: badge.attributes || [],
           isListed: false,
           isVerified: true,
           blockchain: {
             verified: true,
             tokenId: badge.tokenId,
             owner: badge.owner || badge.creator?.wallet || 'Unknown',
             contractType: 'ERC721',
           },
           contractAddress: badge.contractAddress || '',
           isAuction: false,
           activeOffers: 0,
           source: 'api',
           isIndividualMinted: true // ✅ Flag para identificar NFTs individuais mintadas
         }));
         individualMintedNFTs.push(...badges);
       }

       // 5. Process Thirdweb data (normal NFTs)
      const { nfts: thirdwebNFTs, listings, auctions } = thirdwebData;
      
      // Global toggle to disable blacklist
      const DISABLE_HIDDEN = process.env.NEXT_PUBLIC_DISABLE_HIDDEN_NFTS === 'true';
      // === BUSCAR BLACKLIST DO BACKEND + APLICAR BLACKLIST LOCAL ===
      let hiddenIds: string[] = [];
      const HARDCODED_BLACKLIST = new Set(
        DISABLE_HIDDEN
          ? []
          : [
              '6870f6b15bdc094f3de4c18b',
              'Vasco DINAMITE #24',
              'Vasco DINAMITE #23',
              'Vasco DINAMITE #29',
              'Vasco DINAMITE #36',
              'Vasco DINAMITE #35',
              'Vasco DINAMITE #33',
            ]
      );
      if (!DISABLE_HIDDEN) {
        try {
          const res = await fetch('/api/marketplace/hidden-nfts');
          if (res.ok) {
            const data = await res.json();
            hiddenIds = data.hiddenIds || [];
          }
        } catch (err) {
          console.warn('Não foi possível buscar a blacklist de NFTs ocultas:', err);
        }
      }
      
      const filteredThirdwebNFTs = thirdwebNFTs.filter((nft: any) => {
        if (DISABLE_HIDDEN) return true;
        const idStr = nft.id?.toString?.() || '';
        const nameStr = nft.metadata?.name || '';
        const isHidden = hiddenIds.includes(idStr) || HARDCODED_BLACKLIST.has(nameStr);
        return !isHidden;
      });

      // Process Thirdweb NFTs
      const processedThirdwebNFTs = filteredThirdwebNFTs.map((nft: any) => ({
        id: nft.id?.toString() || '',
        tokenId: nft.id?.toString() || '',
        name: nft.metadata?.name || 'Untitled',
        description: nft.metadata?.description || '',
        image: convertIpfsToHttp(nft.metadata?.image || ''),
        imageUrl: convertIpfsToHttp(nft.metadata?.image || ''),
        price: 'Not for sale',
        currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
        owner: nft.owner || 'Unknown',
        creator: nft.creator || nft.owner || 'Unknown',
        category: 'nft',
        type: 'ERC721',
        attributes: nft.metadata?.attributes || [],
        isListed: false,
        isVerified: true,
        blockchain: {
          verified: true,
          tokenId: nft.id?.toString() || '',
          owner: nft.owner || 'Unknown',
          contractType: 'ERC721',
        },
        contractAddress: nft.contractAddress || '',
        isAuction: false,
        activeOffers: 0,
        source: 'thirdweb'
      }));

      // Process listings
      const processedListings = listings.map((listing: any) => {
        const nft = listing.asset;
        return {
          id: listing.id?.toString() || '',
          tokenId: nft?.id?.toString() || '',
          name: nft?.metadata?.name || 'Untitled',
          description: nft?.metadata?.description || '',
          image: convertIpfsToHttp(nft?.metadata?.image || ''),
          imageUrl: convertIpfsToHttp(nft?.metadata?.image || ''),
          price: listing.currencyValue?.displayValue + ' ' + listing.currencyValue?.symbol || 'Listed',
          currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
          owner: listing.sellerAddress || 'Unknown',
          creator: nft?.creator || listing.sellerAddress || 'Unknown',
          category: 'nft',
          type: 'ERC721',
          attributes: nft?.metadata?.attributes || [],
          isListed: true,
          isVerified: true,
          blockchain: {
            verified: true,
            tokenId: nft?.id?.toString() || '',
            owner: listing.sellerAddress || 'Unknown',
            contractType: 'ERC721',
          },
          contractAddress: nft?.contractAddress || '',
          isAuction: false,
          activeOffers: 0,
          listingId: listing.id?.toString(),
          source: 'thirdweb'
        };
      });

      // Process auctions
      const processedAuctions = auctions.map((auction: any) => {
        const nft = auction.asset;
        return {
          id: auction.id?.toString() || '',
          tokenId: nft?.id?.toString() || '',
          name: nft?.metadata?.name || 'Untitled',
          description: nft?.metadata?.description || '',
          image: convertIpfsToHttp(nft?.metadata?.image || ''),
          imageUrl: convertIpfsToHttp(nft?.metadata?.image || ''),
          price: auction.minimumBidCurrencyValue?.displayValue + ' ' + auction.minimumBidCurrencyValue?.symbol || 'Auction',
          currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC',
          owner: auction.creatorAddress || 'Unknown',
          creator: nft?.creator || auction.creatorAddress || 'Unknown',
          category: 'nft',
          type: 'ERC721',
          attributes: nft?.metadata?.attributes || [],
          isListed: false,
          isVerified: true,
          blockchain: {
            verified: true,
            tokenId: nft?.id?.toString() || '',
            owner: auction.creatorAddress || 'Unknown',
            contractType: 'ERC721',
          },
          contractAddress: nft?.contractAddress || '',
          isAuction: true,
          activeOffers: 0,
          auctionId: auction.id?.toString(),
          currentBid: auction.minimumBidCurrencyValue?.displayValue + ' ' + auction.minimumBidCurrencyValue?.symbol,
          endTime: auction.endTime ? new Date(Number(auction.endTime) * 1000) : undefined,
          source: 'thirdweb'
        };
      });

             // Coleções + NFTs individuais mintadas (NUNCA incluir Thirdweb aqui)
       const collectionsOnly = [
         ...apiNFTs.filter((item: any) => {
           const isLaunchpad =
             item.type === 'launchpad' ||
             item.collectionType === 'launchpad' ||
             item.marketplace?.isLaunchpadCollection;

           return item.isCollection || item.isCustomCollection || isLaunchpad;
         }),
         ...individualMintedNFTs // ✅ Incluir NFTs individuais mintadas
       ];

       // Combine all data
       const allNFTs = [...apiNFTs, ...processedThirdwebNFTs, ...processedListings, ...processedAuctions];
       
       // 🎯 LOG FINAL DOS DADOS
       console.log('🎯 [MARKETPLACE DATA] Dados processados:', {
         totalNFTs: allNFTs.length,
         apiNFTs: apiNFTs.length,
         individualMintedNFTs: individualMintedNFTs.length,
         collectionsOnly: collectionsOnly.length,
         thirdwebNFTs: processedThirdwebNFTs.length,
         listings: processedListings.length,
         auctions: processedAuctions.length,
         network: USE_CHZ_MAINNET ? 'CHZ' : 'AMOY',
         currency: USE_CHZ_MAINNET ? 'CHZ' : 'MATIC'
       });

       // Categorize NFTs
       const categorizedNFTs = {
         jerseys: allNFTs.filter(nft => nft.category === 'jersey' || nft.category === 'jerseys'),
         stadiums: allNFTs.filter(nft => nft.category === 'stadium' || nft.category === 'stadiums'),
         badges: allNFTs.filter(nft => nft.category === 'badge' || nft.category === 'badges')
       };

       // Featured NFTs (first 6)
       const featuredNFTs = allNFTs.slice(0, 6);

       setData({
         nfts: allNFTs,
         collections: collectionsOnly, // ✅ só coleções
         loading: false,
         error: null,
         totalCount: allNFTs.length,
         categories: categorizedNFTs,
         featuredNFTs
       });

    } catch (error) {
      console.error('❌ Error fetching marketplace data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch marketplace data'
      }));
    }
  }, [chain]);

  useEffect(() => {
    fetchNFTsFromContract();
  }, [fetchNFTsFromContract]);

  return {
    ...data,
    refetch: () => fetchNFTsFromContract(false)
  };
} 