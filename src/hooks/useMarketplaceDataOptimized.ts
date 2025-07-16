'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketplaceNFT } from '@/types';

interface MarketplaceDataOptimized {
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
  progress: {
    current: number;
    total: number;
    stage: 'loading' | 'processing' | 'complete';
  };
}

// Cache global simples para evitar recarregamentos desnecessários
const globalCache = new Map<string, { data: MarketplaceDataOptimized; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useMarketplaceDataOptimized() {
  const [data, setData] = useState<MarketplaceDataOptimized>({
    nfts: [],
    loading: true,
    error: null,
    totalCount: 0,
    categories: { jerseys: [], stadiums: [], badges: [] },
    featuredNFTs: [],
    progress: { current: 0, total: 100, stage: 'loading' }
  });

  const abortControllerRef = useRef<AbortController>();
  const isInitialMount = useRef(true);

  const updateProgress = useCallback((current: number, total: number, stage: 'loading' | 'processing' | 'complete') => {
    setData(prev => ({
      ...prev,
      progress: { current, total, stage }
    }));
  }, []);

  const fetchMarketplaceData = useCallback(async () => {
    // Verificar cache primeiro
    const cacheKey = 'marketplace-data';
    const cached = globalCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🎯 Using cached marketplace data');
      setData({ ...cached.data, loading: false });
      return cached.data;
    }

    // Cancelar requisições anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      updateProgress(10, 100, 'loading');

      console.log('🚀 Fetching optimized marketplace data...');

      // ESTRATÉGIA 1: Tentar dados rápidos primeiro (MongoDB)
      updateProgress(20, 100, 'loading');
      const quickData = await fetchQuickData(signal);
      
      if (quickData && quickData.nfts.length > 0) {
        console.log('✅ Quick data loaded:', quickData.nfts.length, 'items');
        updateProgress(60, 100, 'processing');
        
        const processedData = processMarketplaceData(quickData.nfts);
        const finalData = {
          ...processedData,
          loading: false,
          error: null,
          progress: { current: 100, total: 100, stage: 'complete' as const }
        };

        // Cache os dados
        globalCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
        setData(finalData);
        return finalData;
      }

      // ESTRATÉGIA 2: Fallback para dados estáticos se tudo falhar
      console.log('🛡️ Using fallback data');
      updateProgress(80, 100, 'processing');
      
      const fallbackData = getFallbackData();
      const finalFallbackData = {
        ...fallbackData,
        loading: false,
        error: 'Using demo data - connect to see live marketplace',
        progress: { current: 100, total: 100, stage: 'complete' as const }
      };

      setData(finalFallbackData);
      return finalFallbackData;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Marketplace data fetch aborted');
        return;
      }

      console.error('❌ Error fetching marketplace data:', error);
      
      // Em caso de erro, usar dados de fallback
      const fallbackData = getFallbackData();
      setData({
        ...fallbackData,
        loading: false,
        error: error.message || 'Failed to load marketplace data',
        progress: { current: 100, total: 100, stage: 'complete' }
      });
    }
  }, [updateProgress]);

  // Fetch rápido de dados (MongoDB APIs)
  const fetchQuickData = async (signal: AbortSignal): Promise<{ nfts: MarketplaceNFT[] } | null> => {
    try {
      const timestamp = Date.now();
      
      // Usar Promise.allSettled para não falhar se uma API falhar
      const responses = await Promise.allSettled([
        fetch(`/api/jerseys/minted?limit=20&_t=${timestamp}`, { signal }),
        fetch(`/api/stadiums/minted?limit=10&_t=${timestamp}`, { signal }),
        fetch(`/api/badges/minted?limit=10&_t=${timestamp}`, { signal })
      ]);

      const allNFTs: MarketplaceNFT[] = [];

      // Processar cada resposta, ignorando falhas
      for (let i = 0; i < responses.length; i++) {
        const result = responses[i];
        if (result.status === 'fulfilled' && result.value.ok) {
          try {
            const data = await result.value.json();
            const items = data.data || data || [];
            
            // Converter para formato MarketplaceNFT
            const convertedItems = items.map((item: any, index: number) => ({
              id: item._id || item.id || `${i}-${index}`,
              tokenId: item.tokenId || `${i}-${index}`,
              name: item.name || 'Untitled NFT',
              description: item.description || '',
              image: item.imageUrl || item.image || '/api/placeholder/400/400',
              imageUrl: item.imageUrl || item.image || '/api/placeholder/400/400',
              price: item.price || 'Not for sale',
              currency: 'MATIC',
              owner: item.owner || item.creator?.wallet || 'Unknown',
              creator: item.creator?.name || item.creator?.wallet || 'Unknown',
              category: item.category || ['jersey', 'stadium', 'badge'][i],
              type: item.category || ['jersey', 'stadium', 'badge'][i],
              attributes: item.attributes || [],
              isListed: item.isListed || false,
              isVerified: true,
              blockchain: { verified: true, tokenId: item.tokenId || `${i}-${index}` },
              contractAddress: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || '',
              isAuction: item.isAuction || false,
              activeOffers: 0
            }));

            allNFTs.push(...convertedItems);
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse response ${i}:`, parseError);
          }
        }
      }

      return allNFTs.length > 0 ? { nfts: allNFTs } : null;

    } catch (error) {
      console.warn('⚠️ Quick data fetch failed:', error);
      return null;
    }
  };

  // Processar dados do marketplace
  const processMarketplaceData = (nfts: MarketplaceNFT[]) => {
    const categories = {
      jerseys: nfts.filter(nft => nft.category === 'jersey'),
      stadiums: nfts.filter(nft => nft.category === 'stadium'),
      badges: nfts.filter(nft => nft.category === 'badge')
    };

    const featuredNFTs = nfts
      .filter(nft => nft.image && nft.image !== '/api/placeholder/400/400')
      .slice(0, 6);

    return {
      nfts,
      totalCount: nfts.length,
      categories,
      featuredNFTs
    };
  };

  // Dados de fallback para garantir que algo sempre seja mostrado
  const getFallbackData = () => {
    const fallbackNFTs: MarketplaceNFT[] = [
      {
        id: 'demo-1',
        tokenId: '1',
        name: 'Flamengo Jersey #10',
        description: 'Classic Flamengo home jersey',
        image: '/api/placeholder/400/400',
        imageUrl: '/api/placeholder/400/400',
        price: '0.1 MATIC',
        currency: 'MATIC',
        owner: 'Demo User',
        creator: 'Demo Creator',
        category: 'jersey',
        type: 'jersey',
        attributes: [],
        isListed: true,
        isVerified: true,
        blockchain: { verified: true, tokenId: '1' },
        contractAddress: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || '',
        isAuction: false,
        activeOffers: 0
      },
      {
        id: 'demo-2',
        tokenId: '2',
        name: 'Maracanã Stadium',
        description: 'Iconic football stadium',
        image: '/api/placeholder/400/400',
        imageUrl: '/api/placeholder/400/400',
        price: '0.5 MATIC',
        currency: 'MATIC',
        owner: 'Demo User',
        creator: 'Demo Creator',
        category: 'stadium',
        type: 'stadium',
        attributes: [],
        isListed: true,
        isVerified: true,
        blockchain: { verified: true, tokenId: '2' },
        contractAddress: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || '',
        isAuction: false,
        activeOffers: 0
      },
      {
        id: 'demo-3',
        tokenId: '3',
        name: 'Champion Badge',
        description: 'Victory achievement badge',
        image: '/api/placeholder/400/400',
        imageUrl: '/api/placeholder/400/400',
        price: '0.2 MATIC',
        currency: 'MATIC',
        owner: 'Demo User',
        creator: 'Demo Creator',
        category: 'badge',
        type: 'badge',
        attributes: [],
        isListed: true,
        isVerified: true,
        blockchain: { verified: true, tokenId: '3' },
        contractAddress: process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || '',
        isAuction: false,
        activeOffers: 0
      }
    ];

    return processMarketplaceData(fallbackNFTs);
  };

  // Effect para carregar dados
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchMarketplaceData();
    }
  }, [fetchMarketplaceData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...data,
    refetch: fetchMarketplaceData,
    clearCache: () => globalCache.clear()
  };
} 