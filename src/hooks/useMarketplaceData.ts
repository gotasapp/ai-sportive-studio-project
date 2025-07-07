import { useState, useEffect } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';

interface MarketplaceItem {
  id: string;
  name: string;
  imageUrl: string;
  tokenId: string;
  contractAddress: string;
  category: 'jersey' | 'stadium' | 'badge';
  owner: string;
  creator: string;
  // Marketplace specific data
  isListed: boolean;
  listingId?: string;
  price?: string;
  currency?: string;
  // Auction data
  isAuction: boolean;
  auctionId?: string;
  currentBid?: string;
  auctionEndTime?: Date;
  // Offer data
  activeOffers: number;
  // Metadata
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  createdAt: string;
}

interface MarketplaceStats {
  totalListings: number;
  totalAuctions: number;
  totalVolume: string;
  floorPrice: string;
}

export function useMarketplaceData() {
  const chain = useActiveWalletChain();
  
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarketplaceData = async () => {
    if (!chain) return;
    
    setLoading(true);
    setError(null);

    try {
      // TODO: Implementar chamadas reais para APIs de marketplace
      // Por enquanto, usar dados das APIs existentes + mock de dados de marketplace
      
      const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
        fetch('/api/jerseys'),
        fetch('/api/stadiums'), 
        fetch('/api/badges')
      ]);

      if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
        throw new Error('Falha ao carregar dados do marketplace');
      }

      const jerseys = await jerseysResponse.json();
      const stadiums = await stadiumsResponse.json();
      const badges = await badgesResponse.json();

      // Combinar dados reais com dados mock de marketplace
      const marketplaceItems: MarketplaceItem[] = [
        ...jerseys.map((jersey: any) => ({
          id: jersey._id,
          name: jersey.name,
          imageUrl: jersey.imageUrl,
          tokenId: jersey._id,
          contractAddress: getContractAddress('jersey'),
          category: 'jersey' as const,
          owner: jersey.creator?.wallet || '',
          creator: jersey.creator?.wallet || '',
          // Mock marketplace data - DESABILITADO até termos listagens reais
          isListed: false, // Math.random() > 0.6,
          listingId: undefined, // Math.random() > 0.6 ? `listing-${jersey._id}` : undefined,
          price: generateRandomPrice(),
          currency: 'CHZ',
          isAuction: Math.random() > 0.8,
          auctionId: Math.random() > 0.8 ? `auction-${jersey._id}` : undefined,
          currentBid: Math.random() > 0.8 ? generateRandomPrice() : undefined,
          auctionEndTime: Math.random() > 0.8 ? generateFutureDate() : undefined,
          activeOffers: Math.floor(Math.random() * 5),
          description: jersey.description || '',
          createdAt: jersey.createdAt,
        })),
        ...stadiums.map((stadium: any) => ({
          id: stadium._id,
          name: stadium.name,
          imageUrl: stadium.imageUrl,
          tokenId: stadium._id,
          contractAddress: getContractAddress('stadium'),
          category: 'stadium' as const,
          owner: stadium.creator?.wallet || '',
          creator: stadium.creator?.wallet || '',
          isListed: false, // Math.random() > 0.7,
          listingId: undefined, // Math.random() > 0.7 ? `listing-${stadium._id}` : undefined,
          price: generateRandomPrice(),
          currency: 'CHZ',
          isAuction: Math.random() > 0.9,
          auctionId: Math.random() > 0.9 ? `auction-${stadium._id}` : undefined,
          currentBid: Math.random() > 0.9 ? generateRandomPrice() : undefined,
          auctionEndTime: Math.random() > 0.9 ? generateFutureDate() : undefined,
          activeOffers: Math.floor(Math.random() * 3),
          description: stadium.description || '',
          createdAt: stadium.createdAt,
        })),
        ...badges.map((badge: any) => ({
          id: badge._id,
          name: badge.name,
          imageUrl: badge.imageUrl,
          tokenId: badge._id,
          contractAddress: getContractAddress('badge'),
          category: 'badge' as const,
          owner: badge.creator?.wallet || '',
          creator: badge.creator?.wallet || '',
          isListed: false, // Math.random() > 0.5,
          listingId: undefined, // Math.random() > 0.5 ? `listing-${badge._id}` : undefined,
          price: generateRandomPrice(),
          currency: 'CHZ',
          isAuction: Math.random() > 0.95,
          auctionId: Math.random() > 0.95 ? `auction-${badge._id}` : undefined,
          currentBid: Math.random() > 0.95 ? generateRandomPrice() : undefined,
          auctionEndTime: Math.random() > 0.95 ? generateFutureDate() : undefined,
          activeOffers: Math.floor(Math.random() * 2),
          description: badge.description || '',
          createdAt: badge.createdAt,
        })),
      ];

      // Calcular estatísticas
      const listedItems = marketplaceItems.filter(item => item.isListed);
      const auctionItems = marketplaceItems.filter(item => item.isAuction);
      
      const mockStats: MarketplaceStats = {
        totalListings: listedItems.length,
        totalAuctions: auctionItems.length,
        totalVolume: '24.8 CHZ',
        floorPrice: '0.05 CHZ',
      };

      setItems(marketplaceItems);
      setStats(mockStats);

    } catch (error: any) {
      console.error('❌ Erro ao carregar marketplace:', error);
      setError(error.message || 'Erro ao carregar dados do marketplace');
    } finally {
      setLoading(false);
    }
  };

  const getContractAddress = (category: string): string => {
    if (!chain) return '';
    
    // Usar contrato universal para todos os tipos de NFT
    const chainId = chain.id;
    const universalContract = {
      88888: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CHZ || '',
      88882: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CHZ_TESTNET || '',
      137: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON || '',
      80002: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON_TESTNET || '',
    }[chainId];
    
    return universalContract || '';
  };

  const generateRandomPrice = (): string => {
    const prices = ['0.05', '0.1', '0.15', '0.2', '0.3', '0.5', '0.8', '1.0'];
    return `${prices[Math.floor(Math.random() * prices.length)]} CHZ`;
  };

  const generateFutureDate = (): Date => {
    const now = new Date();
    const hours = Math.random() * 48; // 0-48 horas no futuro
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [chain]);

  return {
    items,
    stats,
    loading,
    error,
    refetch: loadMarketplaceData,
  };
}

// Hook para dados de um NFT específico
export function useNFTData(contractAddress: string, tokenId: string) {
  const [nft, setNft] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNFTData = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Implementar chamada real para API específica do NFT
        // Incluir dados de marketplace, ofertas, histórico, etc.
        
        // Mock data por enquanto
        const mockNFT: MarketplaceItem = {
          id: `${contractAddress}-${tokenId}`,
          name: `NFT #${tokenId}`,
          imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
          tokenId,
          contractAddress,
          category: 'jersey',
          owner: '0x1234567890123456789012345678901234567890',
          creator: '0x1234567890123456789012345678901234567890',
          isListed: true,
          listingId: `listing-${tokenId}`,
          price: '0.2 CHZ',
          currency: 'CHZ',
          isAuction: false,
          activeOffers: 3,
          description: 'Um NFT único gerado por IA',
          attributes: [
            { trait_type: 'Rarity', value: 'Epic' },
            { trait_type: 'Style', value: 'Modern' },
          ],
          createdAt: new Date().toISOString(),
        };

        setNft(mockNFT);
      } catch (error: any) {
        console.error('❌ Erro ao carregar NFT:', error);
        setError(error.message || 'Erro ao carregar dados do NFT');
      } finally {
        setLoading(false);
      }
    };

    if (contractAddress && tokenId) {
      loadNFTData();
    }
  }, [contractAddress, tokenId]);

  return {
    nft,
    loading,
    error,
  };
} 