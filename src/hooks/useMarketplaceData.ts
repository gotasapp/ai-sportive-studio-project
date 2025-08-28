'use client';

import { useState, useCallback, useEffect } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix';
import { convertIpfsToHttp } from '@/lib/utils';
import { USE_CHZ_MAINNET, ACTIVE_CHAIN_ID, NETWORK_NAME } from '@/lib/network-config';
import { toTokens } from 'thirdweb/utils';

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
  
  // Marketplace data from Thirdweb
  marketplace?: {
    thirdwebListedCount?: number;
    thirdwebAuctionCount?: number;
    thirdwebData?: {
      price?: string;
    };
    mintedUnits?: number;
  };
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

                             // 2. Fetch individual minted NFTs from specific APIs (REMOVIDO)
        // ❌ Não buscamos mais NFTs individuais pois elas duplicam as coleções custom
       
               console.log('✅ [V2] Data sources loaded:', {
          apiItems: apiResponse.success ? apiResponse.data.length : 0,
          thirdwebNFTs: thirdwebData.nfts.length,
          thirdwebListings: thirdwebData.listings.length,
          thirdwebAuctions: thirdwebData.auctions.length,
          network: USE_CHZ_MAINNET ? 'CHZ' : 'AMOY'
        });
        
        // 🔍 DEBUG: Log para verificar dados da API
        if (apiResponse.success && apiResponse.data.length > 0) {
          console.log('🔍 [DEBUG] Primeiros 3 itens da API:', apiResponse.data.slice(0, 3).map((item: any) => ({
            name: item.name,
            type: item.type,
            marketplace: item.marketplace,
            price: item.price,
            isListed: item.marketplace?.isListed
          })));
        }
      
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
              auctionCount: nft.marketplace?.thirdwebAuctionCount || 0,
              
              // 🎯 Marketplace data from Thirdweb
              marketplace: {
                thirdwebListedCount: nft.marketplace?.thirdwebListedCount || 0,
                thirdwebAuctionCount: nft.marketplace?.thirdwebAuctionCount || 0,
                thirdwebData: nft.marketplace?.thirdwebData ? {
                  price: nft.marketplace.thirdwebData.price
                } : undefined,
                mintedUnits: nft.marketplace?.mintedUnits || 0,
                // 🎯 ADICIONAR DADOS REAIS DE PREÇO
                price: nft.marketplace?.price || 'Not listed',
                isListed: nft.marketplace?.isListed || false,
                isAuction: nft.marketplace?.isAuction || false,
                // 🎯 DADOS ESPECÍFICOS PARA LAUNCHPAD
                isLaunchpadCollection: nft.type === 'launchpad_collection' || nft.marketplace?.isLaunchpadCollection || false,
                collectionData: nft.collectionData || null
              }
                         }))
         : [];

       // 4. Process individual minted NFTs (REMOVIDO - não devem aparecer no marketplace)
       // ❌ NFTs individuais são duplicadas das coleções custom, então não as incluímos no marketplace

       // 5. Process Thirdweb data (normal NFTs) - COMO ERA ANTES!
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
        const tokenStr = nft.tokenId?.toString?.() || '';
        const nameStr = (nft.name || nft.metadata?.name || '').trim();
        if (hiddenIds.includes(idStr) || (tokenStr && hiddenIds.includes(tokenStr))) return false;
        if (HARDCODED_BLACKLIST.has(idStr) || HARDCODED_BLACKLIST.has(tokenStr) || HARDCODED_BLACKLIST.has(nameStr)) return false;
        return true;
      });

      // 🎯 CRIAR MAPS PARA LOOKUP RÁPIDO (COMO ERA ANTES!)
      const listingsByTokenId = new Map(listings.map((l: any) => [l.tokenId.toString(), l]));
      const auctionsByTokenId = new Map(auctions.map((a: any) => [a.tokenId.toString(), a]));

      // 🎯 PROCESSAR NFTs DA THIRDWEB COM DADOS REAIS DE PREÇO
      const thirdwebProcessedPromises = filteredThirdwebNFTs.map(async (nft: any, index: number) => {
        try {
          const tokenId = nft.id.toString();
          const metadata = nft.metadata || {};
          const contractAddress = nft.contractAddress || '';
          const contractType = nft.type || 'ERC721';

          let nftOwner = nft.owner || 'Unknown';

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
            price: listing?.currencyValuePerToken?.displayValue ? 
              `${toTokens(BigInt(listing.currencyValuePerToken.displayValue), 18)} CHZ` : 
              (auction ? `${toTokens(BigInt(auction.minimumBidAmount), 18)} CHZ (Bid)` : 'Not for sale'),
            currency: listing?.currencyValuePerToken?.symbol || (USE_CHZ_MAINNET ? 'CHZ' : 'MATIC'),
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
      const processedThirdwebNFTs = thirdwebProcessedResults.filter(Boolean) as MarketplaceNFT[];

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
          price: listing.currencyValue?.displayValue ? 
            `${toTokens(BigInt(listing.currencyValue.displayValue), 18)} CHZ` : 
            'Listed',
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
          price: auction.minimumBidCurrencyValue?.displayValue ? 
            `${toTokens(BigInt(auction.minimumBidCurrencyValue.displayValue), 18)} CHZ` : 
            'Auction',
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
          currentBid: auction.minimumBidCurrencyValue?.displayValue ? 
            `${toTokens(BigInt(auction.minimumBidCurrencyValue.displayValue), 18)} CHZ` : 
            'No bids',
          endTime: auction.endTime ? new Date(Number(auction.endTime) * 1000) : undefined,
          source: 'thirdweb'
        };
      });

             // Coleções apenas (NUNCA incluir Thirdweb aqui)
       const collectionsOnly = [
         ...apiNFTs.filter((item: any) => {
           const isLaunchpad =
             item.type === 'launchpad' ||
             item.collectionType === 'launchpad' ||
             item.marketplace?.isLaunchpadCollection;

           const isCollection = item.isCollection || item.isCustomCollection || isLaunchpad;
           
           // 🔍 DEBUG: Log para verificar se a nova coleção está sendo incluída
           if (item.type === 'custom_collection') {
             console.log('🔍 [DEBUG] Custom Collection encontrada:', {
               name: item.name,
               type: item.type,
               isCollection,
               isCustomCollection: item.isCustomCollection,
               marketplace: item.marketplace
             });
           }

           return isCollection;
         })
         // ❌ REMOVIDO: ...individualMintedNFTs - NFTs individuais não devem aparecer no marketplace
       ];

       // Combine all data
       const allNFTs = [...apiNFTs, ...processedThirdwebNFTs, ...processedListings, ...processedAuctions];
       
       // 🎯 LOG FINAL DOS DADOS
       console.log('🎯 [MARKETPLACE DATA] Dados processados:', {
         totalNFTs: allNFTs.length,
         apiNFTs: apiNFTs.length,
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