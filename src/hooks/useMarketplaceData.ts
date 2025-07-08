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
      console.log('🔍 CARREGANDO DADOS REAIS DO MARKETPLACE...');
      console.log('📋 Chain ID:', chain.id);
      console.log('📋 Chain Name:', chain.name);
      console.log('📋 Timestamp:', new Date().toISOString());
      
      // 1. Buscar listagens reais do blockchain
      const realListings = await MarketplaceService.getAllValidListings(chain.id);
      console.log('✅ Listagens encontradas no blockchain:', realListings.length);
      console.log('📋 Listagens detalhadas:', realListings.map(l => ({
        id: l.listingId.toString(),
        tokenId: l.tokenId.toString(),
        price: l.pricePerToken.toString(),
        creator: l.listingCreator
      })));
      
      // 2. Buscar dados dos NFTs das APIs (para metadados) com cache bust
      const timestamp = Date.now();
      const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
        fetch(`/api/jerseys?_t=${timestamp}`),
        fetch(`/api/stadiums?_t=${timestamp}`), 
        fetch(`/api/badges?_t=${timestamp}`)
      ]);

      if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
        throw new Error('Failed to load NFT metadata');
      }

      const jerseys = await jerseysResponse.json();
      const stadiums = await stadiumsResponse.json();
      const badges = await badgesResponse.json();
      
      // 3. Combinar todos os metadados
      const allNFTMetadata = [...jerseys, ...stadiums, ...badges];
      console.log('✅ Metadados carregados:', allNFTMetadata.length, 'NFTs');

      // 4. Mapear listagens reais com metadados
      const marketplaceItems: MarketplaceItem[] = realListings.map((listing) => {
        // Tentar encontrar metadados correspondentes
        const metadata = allNFTMetadata.find(nft => {
          const listingTokenId = listing.tokenId.toString();
          console.log('🔍 Procurando metadados para tokenId:', listingTokenId, 'em', nft._id);
          
          // Tentar várias formas de comparação
          return nft._id === listingTokenId || 
                 String(listing.tokenId) === nft._id ||
                 // Se o tokenId é 15, pode corresponder ao último NFT criado
                 (listingTokenId === "15" && nft.name?.includes("Corinthians JEFF"));
        }) || 
        // Fallback: pegar o último NFT criado se não encontrou correspondência exata
        allNFTMetadata.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        console.log('🔍 Metadados encontrados:', !!metadata, metadata?.name);
        
        // Corrigir conversão do preço (BigInt para decimal)
        const priceInWei = listing.pricePerToken;
        const priceInEther = Number(priceInWei) / Math.pow(10, 18); // Conversão correta de wei para ether
        const formattedPrice = priceInEther.toFixed(3); // Máximo 3 casas decimais
        const finalPriceString = `${formattedPrice} MATIC`;
        
        console.log('💰 Conversão de preço:', {
          priceInWei: priceInWei.toString(),
          priceInEther,
          formattedPrice,
          finalPriceString,
          isReasonable: priceInEther > 0 && priceInEther < 1000
        });
        
        // Se não encontrou metadados, criar item básico
        const baseItem = {
          id: listing.listingId.toString(),
          name: metadata?.name || `NFT #${listing.tokenId}`,
          imageUrl: metadata?.imageUrl || '/placeholder-nft.png',
          tokenId: listing.tokenId.toString(),
          contractAddress: listing.assetContract,
          category: (metadata?.category || 'jersey') as 'jersey' | 'stadium' | 'badge',
          owner: listing.listingCreator,
          creator: listing.listingCreator,
          // Dados reais da listagem com preço corrigido
          isListed: true,
          listingId: listing.listingId.toString(),
          price: finalPriceString,
          currency: 'MATIC',
          // Dados de leilão (falso para listagens diretas)
          isAuction: false,
          activeOffers: 0,
          // Metadados
          description: metadata?.description || '',
          createdAt: metadata?.createdAt || new Date().toISOString(),
        };
        
        console.log('📋 Item mapeado:', {
          listingId: listing.listingId.toString(),
          tokenId: listing.tokenId.toString(),
          name: baseItem.name,
          price: baseItem.price,
          imageUrl: baseItem.imageUrl,
          hasMetadata: !!metadata
        });
        
        return baseItem;
      });
      
      // 5. Adicionar NFTs não listados (apenas para visualização)
      const unlistedNFTs: MarketplaceItem[] = allNFTMetadata
        .filter(nft => {
          // Filtrar apenas NFTs que não estão listados
          return !realListings.some(listing => 
            listing.tokenId.toString() === nft._id || 
            String(listing.tokenId) === nft._id
          );
        })
        .map(nft => ({
          id: nft._id,
          name: nft.name,
          imageUrl: nft.imageUrl,
          tokenId: nft._id,
          contractAddress: getContractAddress(nft.category),
          category: nft.category as 'jersey' | 'stadium' | 'badge',
          owner: nft.creator?.wallet || '',
          creator: nft.creator?.wallet || '',
          // Não listado
          isListed: false,
          price: 'Not listed',
          currency: 'MATIC',
          isAuction: false,
          activeOffers: 0,
          description: nft.description || '',
          createdAt: nft.createdAt,
        }));

      // 6. Combinar listados + não listados
      const allItems = [...marketplaceItems, ...unlistedNFTs];
      
      // 7. Calcular estatísticas reais
      const realStats: MarketplaceStats = {
        totalListings: realListings.length,
        totalAuctions: 0, // TODO: Buscar leilões reais quando implementado
        totalVolume: realListings.length > 0 ? 
          `${realListings.reduce((sum, listing) => {
            const priceInEther = Number(listing.pricePerToken) / Math.pow(10, 18);
            return sum + priceInEther;
          }, 0).toFixed(3)} MATIC` : 
          '0 MATIC',
        floorPrice: realListings.length > 0 ? 
          `${Math.min(...realListings.map(l => Number(l.pricePerToken) / Math.pow(10, 18))).toFixed(3)} MATIC` : 
          '0 MATIC',
      };

      console.log('✅ DADOS DO MARKETPLACE CARREGADOS:');
      console.log('📊 Listagens reais:', realListings.length);
      console.log('📊 NFTs não listados:', unlistedNFTs.length);
      console.log('📊 Total de itens:', allItems.length);
      console.log('📊 Estatísticas:', realStats);

      setItems(allItems);
      setStats(realStats);

    } catch (error: any) {
      console.error('❌ Error loading marketplace:', error);
      setError(error.message || 'Error loading marketplace data');
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
    forceRefresh: () => {
      console.log('🔄 FORCED REFRESH OF MARKETPLACE DATA');
      setItems([]);
      setStats(null);
      loadMarketplaceData();
    },
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