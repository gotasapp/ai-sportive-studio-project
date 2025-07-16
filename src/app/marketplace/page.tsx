'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

import { AlertCircle, Loader2, Grid3X3, List, RefreshCw } from 'lucide-react';
import { useActiveWalletChain } from 'thirdweb/react';
import { NFT_CONTRACTS, getNFTContract } from '@/lib/marketplace-config';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import MarketplaceStats from '@/components/marketplace/MarketplaceStats';
import MarketplaceLoading, { MarketplaceStatsLoading } from '@/components/marketplace/MarketplaceLoading';

export default function MarketplacePage() {
  // Thirdweb hooks
  const chain = useActiveWalletChain();
  
  // Marketplace data (COM LÓGICA COMPLETA DE LISTINGS/AUCTIONS)
  const { nfts: marketplaceItems, loading: marketplaceLoading, error: marketplaceError, refetch } = useMarketplaceData();
  
  // Estado para refresh manual
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter States
  const [activeTab, setActiveTab] = useState<CollectionTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('volume-desc');
  const [tokenType, setTokenType] = useState<TokenType>('all');
  const [viewType, setViewType] = useState<ViewType>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Legacy data states (mantidos apenas para filtros)
  const [filteredNfts, setFilteredNfts] = useState<any[]>([]);
  
  // Counter States
  const [counters, setCounters] = useState({
    total: 0,
    watchlist: 0,
    owned: 0
  });

  // Watchlist state (mock - in real app this would come from user data)
  const [watchlist, setWatchlist] = useState<string[]>(['Jersey Collection']);
  const [ownedCollections, setOwnedCollections] = useState<string[]>(['Badge Collection']);

  // Helper para obter contrato NFT universal (todos os tipos usam o mesmo)
  const getContractByCategory = (category: string): string => {
    const chainId = chain?.id || 80002; // Default para Polygon Amoy (testnet)
    const contractAddress = NFT_CONTRACTS[chainId];
    
    console.log('🔍 getContractByCategory Debug:', {
      category,
      chainId,
      chainName: chain?.name || 'unknown',
      contractAddress,
      allContracts: NFT_CONTRACTS
    });
    
    // Se não encontrou contrato para a rede atual, usar fallback para Polygon Amoy
    if (!contractAddress) {
      console.warn(`⚠️ Contrato NFT não encontrado para rede ${chainId}, usando fallback para Polygon Amoy`);
      return NFT_CONTRACTS[80002] || '0xfF973a4aFc5A96DEc81366461A461824c4f80254';
    }
    
    return contractAddress;
  };

  const [showGlobalLoader, setShowGlobalLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowGlobalLoader(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!marketplaceLoading) setShowGlobalLoader(false);
  }, [marketplaceLoading]);

  if (showGlobalLoader) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <Loader2 className="w-16 h-16 text-[#A20131] animate-spin" />
      </div>
    );
  }

  useEffect(() => {
    // Dados legacy removidos - agora apenas useMarketplaceData é usado
    // O hook useMarketplaceData já carrega todos os dados necessários
  }, []);

  // Update counters whenever underlying data changes
  useEffect(() => {
    // Usar dados do marketplace em vez de allNfts legacy
    // Garantir que marketplaceItems não seja undefined
    const items = marketplaceItems || [];
    const collections = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
    setCounters({
      total: collections.length,
      watchlist: watchlist.length,
      owned: ownedCollections.length
    });
  }, [marketplaceItems, watchlist.length, ownedCollections.length]);

  // Filter NFTs based on current filters
  useEffect(() => {
    // Filtros agora aplicados aos dados do marketplace
    // Garantir que marketplaceItems não seja undefined
    let filtered = marketplaceItems || [];
    
    const allCategories = Array.from(new Set(filtered.map(item => item.category)));
    console.log('🔍 FILTER DEBUG:', {
      tokenType,
      totalItems: filtered.length,
      sampleCategories: filtered.slice(0, 5).map(item => ({ name: item.name, category: item.category })),
      allCategories,
      allCategoriesExpanded: allCategories,
      sampleFullItems: filtered.slice(0, 2)
    });
    console.log('📋 CATEGORIES FOUND:', allCategories);
    console.log('🎯 SAMPLE ITEM FULL:', filtered[0]);
    
    // Aplicar filtro de categoria (com detecção inteligente)
    if (tokenType !== 'all') {
      console.log('🎯 Filtering by category:', { tokenType });
      
      filtered = filtered.filter(item => {
        // Primeira tentativa: categoria exata
        if (tokenType === 'jerseys' && item.category === 'jersey') return true;
        if (tokenType === 'stadiums' && item.category === 'stadium') return true; 
        if (tokenType === 'badges' && item.category === 'badge') return true;
        
        // Fallback: detecção inteligente baseada em nome/descrição
        const name = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        
        if (tokenType === 'jerseys') {
          return name.includes('jersey') || description.includes('jersey') || 
                 name.includes('#') || description.includes('ai-generated') ||
                 (name.includes(' ') && name.match(/\b\w+\s+\w+\s+#\d+/)); // Pattern: "Team Player #Number"
        }
        
        if (tokenType === 'stadiums') {
          return name.includes('stadium') || description.includes('stadium') ||
                 name.includes('arena') || description.includes('arena');
        }
        
        if (tokenType === 'badges') {
          return name.includes('badge') || description.includes('badge') ||
                 name.includes('achievement') || description.includes('achievement');
        }
        
        return false;
      });
      
      console.log('✅ After smart category filter:', filtered.length, 'items');
    }
    
    // Aplicar busca por nome
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Atualizar filteredNfts com dados filtrados do marketplace
    console.log('💾 Setting filteredNfts:', filtered.length, 'items');
    setFilteredNfts(filtered);
  }, [tokenType, marketplaceItems, searchTerm]);

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

  const handleShowInsights = () => {
    console.log('Showing insights...');
    // Here you would open an insights modal or navigate to insights page
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

  const renderGridView = () => {
    // Usar dados filtrados para respeitar os filtros aplicados
    const itemsToShow = filteredNfts;
    
    console.log('🎯 GRID VIEW RENDER:', {
      filteredNftsLength: filteredNfts.length,
      itemsToShowLength: itemsToShow.length,
      tokenType,
      firstFewItems: itemsToShow.slice(0, 3).map(item => ({ name: item.name, category: item.category }))
    });
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {itemsToShow.map((item) => (
          <MarketplaceCard 
            key={item.id}
            name={item.name}
            imageUrl={item.imageUrl}
            price={item.price || 'Not for sale'}
            collection={item.category || `By ${item.creator || 'Anonymous'}`}
            category={item.category}
            // Dados específicos do marketplace
            tokenId={item.tokenId}
            assetContract={item.contractAddress || getContractByCategory(item.category)}
            owner={item.owner || item.creator}
            isListed={item.isListed || false}
            listingId={item.listingId}
            // Dados de leilão
            isAuction={item.isAuction || false}
            auctionId={item.auctionId}
            currentBid={item.currentBid}
            endTime={item.endTime}
            // Dados de ofertas
            activeOffers={item.activeOffers || 0}
          />
        ))}
      </div>
    );
  };

  const renderListView = () => (
    <div className="p-6 space-y-4">
      {filteredNfts.map((item) => (
        <div 
          key={item.id}
          className="cyber-card flex items-center gap-4 p-4 rounded-lg hover:bg-[#FDFDFD]/5 transition-colors"
        >
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FDFDFD]/10">
            <Image 
              src={item.imageUrl} 
              alt={item.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
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
          timeFilter={timeFilter}
          priceSort={priceSort}
          tokenType={tokenType}
          activeTab={activeTab}
          searchTerm={searchTerm}
          onToggleWatchlist={handleToggleWatchlist}
          marketplaceData={marketplaceItems || []}
        />
      );
    }

    // Grid/List views para NFTs individuais - sempre usar dados do marketplace
    const itemsToShow = filteredNfts; // Dados já filtrados do marketplace
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

    return viewType === 'grid' ? renderGridView() : renderListView();
  };

  return (
    <main className="flex min-h-screen flex-col text-[#FDFDFD] bg-gradient-to-b from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="flex-1">
        {/* Featured Carousel */}
        <div className="w-full">
          <FeaturedCarousel marketplaceData={marketplaceItems || []} />
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
            
            {/* Botão de Refresh */}
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
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
}