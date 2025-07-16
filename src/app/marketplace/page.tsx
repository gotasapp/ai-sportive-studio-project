'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import MarketplaceFilters, { 
  ViewType, 
  TimeFilter, 
  PriceSort, 
  TokenType, 
  CollectionTab 
} from '@/components/marketplace/MarketplaceFilters';
import CollectionsTable from '@/components/marketplace/CollectionsTable';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import MarketplaceStats from '@/components/marketplace/MarketplaceStats';
import MarketplacePageSkeleton, { 
  CarouselSkeleton, 
  StatsSkeleton, 
  GridSkeleton 
} from '@/components/marketplace/MarketplacePageSkeleton';
import ProgressiveLoader from '@/components/marketplace/ProgressiveLoader';

import { AlertCircle, Loader2, Grid3X3, List, RefreshCw, Zap } from 'lucide-react';
import { useActiveWalletChain } from 'thirdweb/react';
import { NFT_CONTRACTS, getNFTContract } from '@/lib/marketplace-config';
import { useMarketplaceDataOptimized } from '@/hooks/useMarketplaceDataOptimized';

export default function MarketplacePageOptimized() {
  // Marketplace data hook otimizado
  const { 
    nfts: marketplaceItems, 
    loading: marketplaceLoading, 
    error: marketplaceError, 
    progress,
    refetch,
    clearCache 
  } = useMarketplaceDataOptimized();
  
  // Estados locais para filtros
  const [activeTab, setActiveTab] = useState<CollectionTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('volume-desc');
  const [tokenType, setTokenType] = useState<TokenType>('all');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados derivados
  const [filteredNfts, setFilteredNfts] = useState<any[]>([]);
  const [counters, setCounters] = useState({
    total: 0,
    watchlist: 0,
    owned: 0
  });

  // Mock watchlist e owned collections
  const [watchlist, setWatchlist] = useState<string[]>(['Jersey Collection']);
  const [ownedCollections, setOwnedCollections] = useState<string[]>(['Badge Collection']);

  // Filtrar NFTs baseado nos filtros atuais
  useEffect(() => {
    let filtered = marketplaceItems || [];
    
    // Filtro por categoria
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
    
    setFilteredNfts(filtered);
  }, [marketplaceItems, tokenType, searchTerm]);

  // Atualizar contadores
  useEffect(() => {
    const items = marketplaceItems || [];
    const collections = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
    setCounters({
      total: collections.length,
      watchlist: watchlist.length,
      owned: ownedCollections.length
    });
  }, [marketplaceItems, watchlist.length, ownedCollections.length]);

  // Função para refresh otimizada
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      clearCache(); // Limpar cache primeiro
      await refetch(); // Recarregar dados
      console.log('✅ Marketplace refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing marketplace:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Funções auxiliares
  const handleToggleWatchlist = (collectionName: string) => {
    setWatchlist(prev => {
      const isWatchlisted = prev.includes(collectionName);
      return isWatchlisted 
        ? prev.filter(name => name !== collectionName)
        : [...prev, collectionName];
    });
  };

  const handleShowInsights = () => {
    console.log('Showing insights...');
  };

  // Renderização condicional baseada no estado de carregamento
  const renderMainContent = () => {
    // Estado de erro
    if (marketplaceError && !marketplaceLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Marketplace</h2>
          <p className="text-sm text-gray-400 mb-4 max-w-md">
            {marketplaceError}
          </p>
          <button 
            onClick={handleRefresh} 
            className="cyber-button px-6 py-2 flex items-center gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Try Again
          </button>
        </div>
      );
    }

    // Estado de carregamento com progresso
    if (marketplaceLoading && progress.stage !== 'complete') {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <ProgressiveLoader progress={progress} />
        </div>
      );
    }

    // Conteúdo principal
    return (
      <>
        {/* Stats */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
          <Suspense fallback={<StatsSkeleton />}>
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
              floorPrice="0.05 MATIC"
            />
          </Suspense>
        </div>

        {/* Filters */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <MarketplaceFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
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
                onShowInsights={handleShowInsights}
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || marketplaceLoading}
              className="ml-4 px-4 py-2 bg-[#A20131] hover:bg-[#A20131]/80 disabled:bg-[#A20131]/50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Refresh marketplace data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-8">
          <div className="max-w-7xl mx-auto">
            {renderItemsContent()}
          </div>
        </div>
      </>
    );
  };

  // Renderizar conteúdo dos items
  const renderItemsContent = () => {
    // Table view
    if (viewType === 'table') {
      return (
        <Suspense fallback={<div className="p-4">Loading table...</div>}>
          <CollectionsTable
            viewType={viewType}
            timeFilter={timeFilter}
            priceSort={priceSort}
            tokenType={tokenType}
            activeTab={activeTab}
            searchTerm={searchTerm}
            onToggleWatchlist={handleToggleWatchlist}
            marketplaceData={marketplaceItems || []}
          />
        </Suspense>
      );
    }

    // Grid/List views
    const itemsToShow = filteredNfts;
    
    if (itemsToShow.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            {viewType === 'grid' ? <Grid3X3 className="w-8 h-8 text-gray-600" /> : <List className="w-8 h-8 text-gray-600" />}
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

    return viewType === 'grid' ? renderGridView(itemsToShow) : renderListView(itemsToShow);
  };

  const renderGridView = (items: any[]) => (
    <Suspense fallback={<GridSkeleton itemCount={items.length} />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <MarketplaceCard 
            key={item.id}
            name={item.name}
            imageUrl={item.imageUrl}
            price={item.price || 'Not for sale'}
            collection={item.category || `By ${item.creator || 'Anonymous'}`}
            category={item.category}
            tokenId={item.tokenId}
            assetContract={item.contractAddress}
            owner={item.owner || item.creator}
            isListed={item.isListed || false}
            listingId={item.listingId}
            isAuction={item.isAuction || false}
            auctionId={item.auctionId}
            currentBid={item.currentBid}
            endTime={item.endTime}
            activeOffers={item.activeOffers || 0}
          />
        ))}
      </div>
    </Suspense>
  );

  const renderListView = (items: any[]) => (
    <div className="space-y-4">
      {items.map((item) => (
        <div 
          key={item.id}
          className="cyber-card flex items-center gap-4 p-4 rounded-lg hover:bg-[#FDFDFD]/5 transition-colors"
        >
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FDFDFD]/10">
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#FDFDFD]">{item.name}</h3>
            <p className="text-sm text-[#FDFDFD]/70">{item.category}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-[#FDFDFD]">{item.price}</div>
            <div className="text-xs text-[#FDFDFD]/70 capitalize">{item.category}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col text-[#FDFDFD] bg-gradient-to-b from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="flex-1">
        {/* Featured Carousel */}
        <div className="w-full">
          <Suspense fallback={<CarouselSkeleton />}>
            <FeaturedCarousel marketplaceData={marketplaceItems || []} />
          </Suspense>
        </div>

        {/* Main Content */}
        {renderMainContent()}
      </div>

      {/* Floating Performance Indicator */}
      {progress.stage !== 'complete' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-black/80 backdrop-blur-sm border border-[#FDFDFD]/20 rounded-lg p-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-xs text-[#FDFDFD]/70">
              Optimizing experience...
            </span>
          </div>
        </div>
      )}
    </main>
  );
} 