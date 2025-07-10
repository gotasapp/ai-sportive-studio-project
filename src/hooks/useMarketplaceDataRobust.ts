import { useState, useEffect } from 'react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygonAmoy } from 'thirdweb/chains';
import { getNFTs } from 'thirdweb/extensions/erc721';
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace';
import { ownerOf } from 'thirdweb/extensions/erc721';
import { MarketplaceNFT } from '@/types';
import { convertIpfsToHttp } from '@/lib/utils';

// CONSTANTES CRÍTICAS
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
const MARKETPLACE_CONTRACT_ADDRESS = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

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
  dataSource: 'thirdweb' | 'mongodb' | 'fallback';
}

/**
 * HOOK ROBUSTO QUE NUNCA FALHA EM PRODUÇÃO
 * 
 * Estratégia:
 * 1. Tenta Thirdweb (5s timeout)
 * 2. Se falhar, usa MongoDB 
 * 3. Se tudo falhar, usa dados estáticos
 */
export function useMarketplaceDataRobust() {
  const [data, setData] = useState<MarketplaceData>({
    nfts: [],
    loading: true,
    error: null,
    totalCount: 0,
    categories: { jerseys: [], stadiums: [], badges: [] },
    featuredNFTs: [],
    dataSource: 'thirdweb'
  });

  useEffect(() => {
    fetchDataWithFallbacks();
  }, []);

  const fetchDataWithFallbacks = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    // ESTRATÉGIA 1: Thirdweb (Timeout 5s)
    try {
      console.log('🎯 Tentando Thirdweb...');
      const thirdwebData = await fetchFromThirdweb();
      setData({
        ...thirdwebData,
        loading: false,
        error: null,
        dataSource: 'thirdweb'
      });
      console.log('✅ Thirdweb SUCCESS!');
      return;
    } catch (error) {
      console.warn('⚠️ Thirdweb falhou:', error);
    }

    // ESTRATÉGIA 2: MongoDB (Timeout 3s)
    try {
      console.log('🔄 Tentando MongoDB...');
      const mongoData = await fetchFromMongoDB();
      setData({
        ...mongoData,
        loading: false,
        error: null,
        dataSource: 'mongodb'
      });
      console.log('✅ MongoDB SUCCESS!');
      return;
    } catch (error) {
      console.warn('⚠️ MongoDB falhou:', error);
    }

    // ESTRATÉGIA 3: Dados estáticos (NUNCA FALHA)
    console.log('🛡️ Usando dados estáticos...');
    const fallbackData = getFallbackData();
    setData({
      ...fallbackData,
      loading: false,
      error: 'Using fallback data - some features may be limited',
      dataSource: 'fallback'
    });
    console.log('✅ Fallback SUCCESS!');
  };

  // MÉTODO 1: Thirdweb (com timeout agressivo)
  const fetchFromThirdweb = async (): Promise<Omit<MarketplaceData, 'loading' | 'error' | 'dataSource'>> => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Thirdweb timeout')), 5000); // 5s timeout
    });

    const contract = getContract({
      client,
      chain: polygonAmoy,
      address: NFT_CONTRACT_ADDRESS,
    });

    const marketplaceContract = getContract({
      client,
      chain: polygonAmoy,
      address: MARKETPLACE_CONTRACT_ADDRESS,
    });

    // Fetch com timeout
    const [nfts, listings] = await Promise.race([
      Promise.all([
        getNFTs({ contract, start: 0, count: 50 }), // Reduzido para 50
        getAllValidListings({ contract: marketplaceContract, start: 0, count: BigInt(50) })
      ]),
      timeoutPromise
    ]) as [any[], any[]];

    // Processar rapidamente
    const processedNFTs = nfts.slice(0, 20).map((nft, index) => ({
      id: nft.id.toString(),
      tokenId: nft.id.toString(),
      name: nft.metadata?.name || `NFT #${nft.id}`,
      description: nft.metadata?.description || '',
      image: nft.metadata?.image ? convertIpfsToHttp(nft.metadata.image) : '',
      imageUrl: nft.metadata?.image ? convertIpfsToHttp(nft.metadata.image) : '',
      price: 'Not for sale',
      currency: 'MATIC',
      owner: 'Unknown',
      creator: 'Unknown',
      category: 'nft',
      type: 'nft',
      attributes: [],
      isListed: false,
      isVerified: true,
      blockchain: { verified: true, tokenId: nft.id.toString() },
      contractAddress: NFT_CONTRACT_ADDRESS,
      isAuction: false,
      activeOffers: 0
    }));

    return {
      nfts: processedNFTs,
      totalCount: processedNFTs.length,
      categories: {
        jerseys: processedNFTs.filter(n => n.name.toLowerCase().includes('jersey')),
        stadiums: processedNFTs.filter(n => n.name.toLowerCase().includes('stadium')),
        badges: processedNFTs.filter(n => n.name.toLowerCase().includes('badge'))
      },
      featuredNFTs: processedNFTs.slice(0, 6)
    };
  };

  // MÉTODO 2: MongoDB (com timeout)
  const fetchFromMongoDB = async (): Promise<Omit<MarketplaceData, 'loading' | 'error' | 'dataSource'>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    try {
      const timestamp = Date.now();
      const [jerseysRes, stadiumsRes, badgesRes] = await Promise.all([
        fetch(`/api/jerseys/minted?_t=${timestamp}`, { signal: controller.signal }),
        fetch(`/api/stadiums/minted?_t=${timestamp}`, { signal: controller.signal }),
        fetch(`/api/badges/minted?_t=${timestamp}`, { signal: controller.signal })
      ]);

      const [jerseysData, stadiumsData, badgesData] = await Promise.all([
        jerseysRes.json(),
        stadiumsRes.json(),
        badgesRes.json()
      ]);

      const jerseys = jerseysData.data || [];
      const stadiums = stadiumsData.data || [];
      const badges = badgesData.data || [];
      const allNFTs = [...jerseys, ...stadiums, ...badges];

      return {
        nfts: allNFTs,
        totalCount: allNFTs.length,
        categories: { jerseys, stadiums, badges },
        featuredNFTs: allNFTs.slice(0, 6)
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // MÉTODO 3: Dados estáticos (NUNCA FALHA)
  const getFallbackData = (): Omit<MarketplaceData, 'loading' | 'error' | 'dataSource'> => {
    const fallbackNFTs = [
      {
        id: '1',
        tokenId: '1',
        name: 'Flamengo Jersey #1',
        description: 'Classic Flamengo jersey',
        image: '/api/placeholder/400/400',
        imageUrl: '/api/placeholder/400/400',
        price: '0.1 MATIC',
        currency: 'MATIC',
        owner: 'Unknown',
        creator: 'Unknown',
        category: 'jersey',
        type: 'jersey',
        attributes: [],
        isListed: true,
        isVerified: true,
        blockchain: { verified: true, tokenId: '1' },
        contractAddress: NFT_CONTRACT_ADDRESS,
        isAuction: false,
        activeOffers: 0
      },
      {
        id: '2',
        tokenId: '2',
        name: 'Maracanã Stadium',
        description: 'Iconic stadium NFT',
        image: '/api/placeholder/400/400',
        imageUrl: '/api/placeholder/400/400',
        price: '0.5 MATIC',
        currency: 'MATIC',
        owner: 'Unknown',
        creator: 'Unknown',
        category: 'stadium',
        type: 'stadium',
        attributes: [],
        isListed: true,
        isVerified: true,
        blockchain: { verified: true, tokenId: '2' },
        contractAddress: NFT_CONTRACT_ADDRESS,
        isAuction: false,
        activeOffers: 0
      },
      {
        id: '3',
        tokenId: '3',
        name: 'Champion Badge',
        description: 'Victory badge NFT',
        image: '/api/placeholder/400/400',
        imageUrl: '/api/placeholder/400/400',
        price: '0.2 MATIC',
        currency: 'MATIC',
        owner: 'Unknown',
        creator: 'Unknown',
        category: 'badge',
        type: 'badge',
        attributes: [],
        isListed: true,
        isVerified: true,
        blockchain: { verified: true, tokenId: '3' },
        contractAddress: NFT_CONTRACT_ADDRESS,
        isAuction: false,
        activeOffers: 0
      }
    ];

    return {
      nfts: fallbackNFTs,
      totalCount: fallbackNFTs.length,
      categories: {
        jerseys: fallbackNFTs.filter(n => n.category === 'jersey'),
        stadiums: fallbackNFTs.filter(n => n.category === 'stadium'),
        badges: fallbackNFTs.filter(n => n.category === 'badge')
      },
      featuredNFTs: fallbackNFTs
    };
  };

  return { ...data, refetch: fetchDataWithFallbacks };
} 