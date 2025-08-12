'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import MarketplaceFilters, { 
  ViewType, 
  PriceSort, 
  TokenType, 
  CollectionTab 
} from '@/components/marketplace/MarketplaceFilters';
import CollectionsTable from '@/components/marketplace/CollectionsTable';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import CollectionOverviewCard from '@/components/marketplace/CollectionOverviewCard';
import { Button } from '@/components/ui/button';

import { AlertCircle, Loader2, Grid3X3, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActiveWalletChain } from 'thirdweb/react';
import { NFT_CONTRACTS, getNFTContract } from '@/lib/marketplace-config';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';

import MarketplaceStats from '@/components/marketplace/MarketplaceStats';
import MarketplaceLoading, { MarketplaceStatsLoading } from '@/components/marketplace/MarketplaceLoading';
import { useIsMobile } from '@/hooks/useIsMobile';
import MarketplaceMobileLayout from '@/components/marketplace/MarketplaceMobileLayout';
import type { LaunchpadItem } from '@/components/marketplace/LaunchpadCarouselMobile';
import { convertIpfsToHttp, normalizeIpfsUri } from '@/lib/utils';
import { getCollectionImage } from '@/components/marketplace/FixedCollectionImages';
import dynamic from 'next/dynamic';


export default function MarketplacePage() {
  const isMobile = useIsMobile();

  // Thirdweb hooks
  const chain = useActiveWalletChain();
  const { nfts: marketplaceItems, loading: marketplaceLoading, error: marketplaceError, refetch } = useMarketplaceData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<CollectionTab>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('volume-desc');
  const [tokenType, setTokenType] = useState<TokenType>('all');
  const [viewType, setViewType] = useState<ViewType>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNfts, setFilteredNfts] = useState<any[]>([]);
  const [counters, setCounters] = useState({ total: 0, watchlist: 0, owned: 0 });
  const [watchlist, setWatchlist] = useState<string[]>(['Jersey Collection']);
  const [ownedCollections, setOwnedCollections] = useState<string[]>(['Badge Collection']);
  const [showGlobalLoader, setShowGlobalLoader] = useState(true);
  const [blacklist, setBlacklist] = useState<string[]>([]);


  // Todos os hooks devem estar no topo, fora de qualquer if/return
  useEffect(() => {
    const timer = setTimeout(() => setShowGlobalLoader(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!marketplaceLoading) setShowGlobalLoader(false);
  }, [marketplaceLoading]);
  useEffect(() => {}, []);
  useEffect(() => {
    let filtered = marketplaceItems || [];
    
    // Filtro por tipo de token
    if (tokenType !== 'all') {
      filtered = filtered.filter(item => {
        if (tokenType === 'jerseys') return item.category === 'jersey';
        if (tokenType === 'stadiums') return item.category === 'stadium';
        if (tokenType === 'badges') return item.category === 'badge';
        return true;
      });
    }
    

    
    // Filtro por busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro temporário de blacklist
    if (blacklist.length > 0) {
      filtered = filtered.filter(item => !blacklist.includes(String(item.tokenId)));
    }
    
    setFilteredNfts(filtered);
  }, [marketplaceItems, tokenType, searchTerm, blacklist]);
  useEffect(() => {
    const items = marketplaceItems || [];
    const collections = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
    setCounters({
      total: collections.length,
      watchlist: watchlist.length,
      owned: ownedCollections.length
    });
  }, [marketplaceItems, watchlist.length, ownedCollections.length]);

  // Helper para obter contrato NFT universal (todos os tipos usam o mesmo)
  const getContractByCategory = (category: string): string => {
    const chainId = chain?.id || 80002; // Default para Polygon Amoy (testnet)
    const contractAddress = NFT_CONTRACTS[chainId];
    // Se não encontrou contrato para a rede atual, usar fallback para Polygon Amoy
    if (!contractAddress) {
      return NFT_CONTRACTS[80002] || '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
    }
    return contractAddress;
  };

  // Buscar blacklist temporária do backend
  useEffect(() => {
    fetch('/api/marketplace/hidden-nfts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.hiddenIds)) {
          setBlacklist(data.hiddenIds.map(String));
        }
      });
  }, []);

  // Só depois dos hooks, o return condicional do loader global
  if (showGlobalLoader) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A20131] mx-auto"></div>
          <p className="text-white mt-4">Carregando marketplace...</p>
        </div>
      </div>
    );
  }

  const handleToggleWatchlist = (collectionName: string) => {
    setWatchlist(prev => {
      const isWatchlisted = prev.includes(collectionName);
      const newWatchlist = isWatchlisted 
        ? prev.filter(name => name !== collectionName)
        : [...prev, collectionName];
      
      // Update counter
      setCounters(prev => ({ ...prev, watchlist: newWatchlist.length }));
      
      return newWatchlist;
    });
  };



  // Função para forçar refresh dos dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Limpar cache primeiro
      await fetch('/api/marketplace/refresh-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      // Recarregar dados
      if (refetch) {
        await refetch();
      }
      
      console.log('✅ Marketplace data refreshed');
    } catch (error) {
      console.error('❌ Error refreshing marketplace:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const NFTGrid = dynamic(() => import('@/components/marketplace/NFTGrid'), { ssr: false });
  const renderGridView = () => (
    <NFTGrid items={filteredNfts} getContractByCategory={getContractByCategory} />
  );



  const renderContent = () => {
    // Usar loading do marketplace se disponível
    const isLoading = marketplaceLoading;
    const currentError = marketplaceError;

    if (currentError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Marketplace</h2>
          <p className="text-sm text-gray-400 mb-4 max-w-md">
            {currentError || 'Failed to connect to the database. Please check your connection and try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="cyber-button px-6 py-2"
          >
            Retry
          </button>
        </div>
      );
    }

    if (isLoading) {
      return <MarketplaceLoading view={viewType} itemCount={8} />;
    }

    // Table view - use CollectionsTable component with marketplace data
    if (viewType === 'table') {
      return (
        <CollectionsTable
          viewType={viewType}
          priceSort={priceSort}
          tokenType={tokenType}
          activeTab={activeTab}
          searchTerm={searchTerm}
          onToggleWatchlist={handleToggleWatchlist}
          marketplaceData={filteredNfts || []}
        />
      );
    }

    // Grid/List views para NFTs individuais - sempre usar dados do marketplace
    const itemsToShow = filteredNfts; // Dados já filtrados do marketplace
    if (itemsToShow.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Grid3X3 className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No NFTs Found</h2>
          <p className="text-gray-400 mb-4">
            {searchTerm && tokenType !== 'all' 
              ? `No results for "${searchTerm}" in ${tokenType}`
              : searchTerm 
                ? `No results for "${searchTerm}"`
                : tokenType !== 'all' 
                  ? `No ${tokenType} available yet`
                  : 'No NFTs have been created yet. Start generating some!'}
          </p>
        </div>
      );
    }

    return renderGridView();
  };

  // Filtros para o mobile layout
  const mobileFilters = {
    active: tokenType,
    onChange: (value: string) => setTokenType(value as any),
  };

  // Handler de busca para o mobile layout
  const handleMobileSearch = (term: string) => setSearchTerm(term);

  // Handler de compra (placeholder, adapte conforme sua lógica)
  const handleMobileBuy = (nft: any) => {
    // Aqui você pode abrir modal, navegar para detalhes, etc.
    alert(`Comprar NFT: ${nft.name}`);
  };

  // Dados mock do launchpad (copiados do launchpad/page.tsx)
  const launchpadCollections = [
    {
      id: 'flamengo-heritage',
      name: 'Flamengo Heritage Collection',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
      status: 'Live',
      endDate: '2024-02-15',
      blockchain: 'chz',
    },
    {
      id: 'palmeiras-badges',
      name: 'Palmeiras Championship Badges',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png',
      status: 'Live',
      endDate: '2024-02-10',
      blockchain: 'chz',
    },
    {
      id: 'maracana-legends',
      name: 'Maracanã Legends Stadium',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636630/bafybeicw37rbxeqti3ty5i6gc4gbciro27gacizwywirur5lag6obxcfh4_x0ijvi.png',
      status: 'Ended',
      endDate: '2024-03-01',
      blockchain: 'chz',
    },
    {
      id: 'vasco-retro',
      name: 'Vasco da Gama Retro Collection',
      imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png',
      status: 'Ended',
      endDate: '2024-03-20',
      blockchain: 'chz',
    },
  ];

  // Corrigir status para o tipo correto
  const launchpadItemsFixed = launchpadCollections.map(item => ({
    ...item,
    status: item.status?.toLowerCase() === 'ended' ? 'Ended' : 'Live'
  })) as LaunchpadItem[];

  if (isMobile) {
    return (
      <MarketplaceMobileLayout
        nfts={filteredNfts}
        collections={[]}
        filters={mobileFilters}
        onBuy={handleMobileBuy}
        onSearch={handleMobileSearch}
        searchTerm={searchTerm}
        volume24h={"$0.00"} // placeholder, ajuste para dados reais
        volumeChange={0} // placeholder
        sales24h={"0"} // placeholder
        salesChange={0} // placeholder
        launchpadItems={launchpadItemsFixed}
      />
    );
  }

  return (
    <main className="flex min-h-screen flex-col text-[#FDFDFD] bg-gradient-to-b from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="flex-1">
        {/* Featured Carousel */}
        <div className="w-full">
          <FeaturedCarousel marketplaceData={marketplaceItems || []} loading={marketplaceLoading} />
        </div>

        {/* Data Source Indicator - Removido temporariamente */}

        {/* Marketplace Stats */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
          {marketplaceLoading ? (
            <MarketplaceStatsLoading />
          ) : (
            <MarketplaceStats
              totalListings={marketplaceItems?.filter(item => item.isListed && !item.isAuction)?.length || 0}
              totalAuctions={marketplaceItems?.filter(item => item.isAuction)?.length || 0}
              totalVolume={(() => {
                const totalVol = marketplaceItems?.reduce((sum, item) => {
                  if (item.isListed || item.isAuction) {
                    const price = parseFloat(item.price?.replace(' MATIC', '') || '0');
                    return sum + (isNaN(price) ? 0 : price);
                  }
                  return sum;
                }, 0) || 0;
                return `${totalVol.toFixed(2)} MATIC`;
              })()}
              floorPrice={(() => {
                const listedItems = marketplaceItems?.filter(item => 
                  (item.isListed || item.isAuction) && item.price && item.price !== 'Not for sale'
                ) || [];
                if (listedItems.length === 0) return '0 MATIC';
                const prices = listedItems.map(item => {
                  const price = parseFloat(item.price?.replace(' MATIC', '') || '0');
                  return isNaN(price) ? 0 : price;
                }).filter(price => price > 0);
                if (prices.length === 0) return '0 MATIC';
                const minPrice = Math.min(...prices);
                return `${minPrice.toFixed(3)} MATIC`;
              })()}
            />
          )}
        </div>

        

        {/* Filters */}
        <div className="w-[87%] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <MarketplaceFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                priceSort={priceSort}
                onPriceSortChange={setPriceSort}
                tokenType={tokenType}
                onTokenTypeChange={setTokenType}
                viewType={viewType}
                onViewChange={setViewType}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                totalCollections={counters.total}
                watchlistCount={counters.watchlist}
                ownedCount={counters.owned}

              />
            </div>
            
            {/* Botões de Ação */}
            <div className="flex gap-2">
              {/* Botão de Refresh - Hidden */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || marketplaceLoading}
                className="hidden px-4 py-2 bg-[#A20131] hover:bg-[#A20131]/80 disabled:bg-[#A20131]/50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                title="Refresh marketplace data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-[87%] mx-auto pb-8">
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
}