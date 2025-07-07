'use client';

import { useState, useEffect } from 'react';
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
import { AlertCircle, Loader2, Grid3X3, List } from 'lucide-react';
import { useActiveWalletChain } from 'thirdweb/react';
import { NFT_CONTRACTS, getNFTContract } from '@/lib/marketplace-config';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import MarketplaceStats from '@/components/marketplace/MarketplaceStats';
import MarketplaceLoading, { MarketplaceStatsLoading } from '@/components/marketplace/MarketplaceLoading';
import MarketplaceDebug from '@/components/marketplace/MarketplaceDebug';

// Tipos de dados exatamente como vêm do MongoDB
interface NFT {
  _id: string;
  name: string;
  imageUrl: string;
  description?: string;
  price?: string;
  category: 'jersey' | 'stadium' | 'badge';
  collection?: string;
  creator?: { 
    wallet: string; 
    name: string; 
  };
  createdAt: string;
  status: 'Approved';
}

export default function MarketplacePage() {
  // Thirdweb hooks
  const chain = useActiveWalletChain();
  
  // Marketplace data
  const { items: marketplaceItems, stats, loading: marketplaceLoading, error: marketplaceError } = useMarketplaceData();
  
  // Filter States
  const [activeTab, setActiveTab] = useState<CollectionTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('volume-desc');
  const [tokenType, setTokenType] = useState<TokenType>('all');
  const [viewType, setViewType] = useState<ViewType>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Legacy data states (mantidos para compatibilidade com CollectionsTable)
  const [allNfts, setAllNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    const chainId = chain?.id || 88888; // Default para CHZ
    return NFT_CONTRACTS[chainId] || '';
  };

  useEffect(() => {
    const loadRealData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Chamadas simultâneas para todas as APIs reais
        const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
          fetch('/api/jerseys'),
          fetch('/api/stadiums'), 
          fetch('/api/badges')
        ]);

        // Verificar se todas as respostas foram bem-sucedidas
        if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
          throw new Error(`API Error: Jerseys(${jerseysResponse.status}), Stadiums(${stadiumsResponse.status}), Badges(${badgesResponse.status})`);
        }

        // Processar dados reais do MongoDB
        const realJerseys: NFT[] = await jerseysResponse.json();
        const realStadiums: NFT[] = await stadiumsResponse.json();
        const realBadges: NFT[] = await badgesResponse.json();

        // Categorizar dados reais
        const categorizedJerseys = realJerseys.map(jersey => ({ 
          ...jersey, 
          category: 'jersey' as const, 
          price: '0.05 CHZ',
          collection: jersey.creator?.name || 'Jersey Collection'
        }));

        const categorizedStadiums = realStadiums.map(stadium => ({ 
          ...stadium, 
          category: 'stadium' as const, 
          price: '0.15 CHZ',
          collection: stadium.creator?.name || 'Stadium Collection'
        }));

        const categorizedBadges = realBadges.map(badge => ({ 
          ...badge, 
          category: 'badge' as const, 
          price: '0.03 CHZ',
          collection: badge.creator?.name || 'Badge Collection'
        }));

        // Combinar todos os dados reais
        const allRealNFTs = [...categorizedJerseys, ...categorizedStadiums, ...categorizedBadges];
        
        setAllNfts(allRealNFTs);
        setFilteredNfts(allRealNFTs);

      } catch (error: any) {
        console.error('❌ Erro ao carregar dados reais do marketplace:', error);
        setError(error.message || 'Failed to load marketplace data');
        setAllNfts([]);
        setFilteredNfts([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Update counters whenever underlying data changes
  useEffect(() => {
    const collections = new Set(allNfts.map(nft => nft.collection).filter(Boolean));
    setCounters({
      total: collections.size,
      watchlist: watchlist.length,
      owned: ownedCollections.length
    });
  }, [allNfts, watchlist.length, ownedCollections.length]);

  // Filter NFTs based on current filters
  useEffect(() => {
    let filtered = allNfts;
    
    // Aplicar filtro de categoria
    if (tokenType !== 'all') {
      const categoryMap: Record<string, string> = {
        'jerseys': 'jersey',
        'stadiums': 'stadium', 
        'badges': 'badge'
      };
      
      const targetCategory = categoryMap[tokenType] || tokenType;
      filtered = filtered.filter(nft => nft.category === targetCategory);
    }
    
    // Aplicar busca por nome
    if (searchTerm.trim()) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.collection?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredNfts(filtered);
  }, [tokenType, allNfts, searchTerm]);

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

  const renderGridView = () => {
    // Usar dados do marketplace se disponíveis, senão usar dados legacy
    const itemsToShow = marketplaceItems.length > 0 ? marketplaceItems : filteredNfts;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {itemsToShow.map((item) => (
          <MarketplaceCard 
            key={item.id || item._id}
            name={item.name}
            imageUrl={item.imageUrl}
            price={item.price || item.price || 'Not for sale'}
            collection={item.collection || `By ${item.creator?.name || item.creator || 'Anonymous'}`}
            category={item.category}
            // Dados específicos do marketplace
            tokenId={item.tokenId || item._id}
            assetContract={item.contractAddress || getContractByCategory(item.category)}
            owner={item.owner || item.creator?.wallet}
            isListed={item.isListed || false}
            listingId={item.listingId}
            // Dados de leilão
            isAuction={item.isAuction || false}
            auctionId={item.auctionId}
            currentBid={item.currentBid}
            auctionEndTime={item.auctionEndTime}
            // Outros dados
            activeOffers={item.activeOffers || 0}
          />
        ))}
      </div>
    );
  };

  const renderListView = () => (
    <div className="p-6 space-y-4">
      {filteredNfts.map((nft) => (
        <div 
          key={nft._id}
          className="cyber-card flex items-center gap-4 p-4 rounded-lg hover:bg-[#FDFDFD]/5 transition-colors"
        >
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FDFDFD]/10">
            <img 
              src={nft.imageUrl} 
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#FDFDFD]">{nft.name}</h3>
            <p className="text-sm text-[#FDFDFD]/70">{nft.collection}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-[#FDFDFD]">{nft.price}</div>
            <div className="text-xs text-[#FDFDFD]/70 capitalize">{nft.category}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    // Usar loading do marketplace se disponível
    const isLoading = marketplaceLoading || loading;
    const currentError = marketplaceError || error;

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

    // Table view - use CollectionsTable component
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
        />
      );
    }

    // Grid/List views for individual NFTs
    const itemsToShow = marketplaceItems.length > 0 ? marketplaceItems : filteredNfts;
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
          <FeaturedCarousel />
        </div>

        {/* Marketplace Stats */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-6">
          {marketplaceLoading ? (
            <MarketplaceStatsLoading />
          ) : stats ? (
            <MarketplaceStats
              totalListings={stats.totalListings}
              totalAuctions={stats.totalAuctions}
              totalVolume={stats.totalVolume}
              floorPrice={stats.floorPrice}
            />
          ) : null}
        </div>

        {/* Filters */}
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

        {/* Content */}
        <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
      
      {/* Debug Component (only in development) */}
      {process.env.NODE_ENV === 'development' && <MarketplaceDebug />}
    </main>
  );
}