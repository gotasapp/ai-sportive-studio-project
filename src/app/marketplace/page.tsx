'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import RankingsTable from '@/components/marketplace/RankingsTable';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import { Filter, Search, AlertCircle, Loader2 } from 'lucide-react';

// Tipos de dados exatamente como vêm do MongoDB
interface NFT {
  _id: string; // ID do MongoDB
  name: string;
  imageUrl: string; // Campo real do DB
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

interface ApiResponse {
  success: boolean;
  data: NFT[];
  count: number;
}

export default function MarketplacePage() {
  const [allNfts, setAllNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'jerseys' | 'stadiums' | 'badges'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
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
          collection: jersey.creator?.name || 'User Creations'
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
        // NÃO há fallback - mostrar erro ao usuário
        setAllNfts([]);
        setFilteredNfts([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Filtro e busca
  useEffect(() => {
    let filtered = allNfts;
    
    // Aplicar filtro de categoria
    if (filter !== 'all') {
      // Mapear plural para singular
      const categoryMap: Record<string, string> = {
        'jerseys': 'jersey',
        'stadiums': 'stadium', 
        'badges': 'badge'
      };
      
      const targetCategory = categoryMap[filter] || filter;
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
  }, [filter, allNfts, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Componente de erro
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Marketplace</h2>
      <p className="text-gray-400 mb-4 max-w-md">
        {error || 'Failed to connect to the database. Please check your connection and try again.'}
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="cyber-button px-6 py-2"
      >
        Retry
      </button>
    </div>
  );

  // Componente de loading
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Loading NFTs</h2>
      <p className="text-gray-400">Please wait...</p>
    </div>
  );

  // Estado vazio (sem NFTs no banco)
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-gray-600" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">No NFTs Found</h2>
      <p className="text-gray-400 mb-4">
        {searchTerm && filter !== 'all' 
          ? `No results for "${searchTerm}" in ${filter}`
          : searchTerm 
            ? `No results for "${searchTerm}"`
            : filter !== 'all' 
              ? `No ${filter} available yet`
              : 'No NFTs have been created yet. Start generating some!'}
      </p>
      {(searchTerm || filter !== 'all') && (
        <button 
          onClick={() => {
            setSearchTerm('');
            setFilter('all');
          }} 
          className="cyber-button px-4 py-2 text-sm"
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col bg-primary text-secondary">
      <Header />
      
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-12">
        
        <FeaturedCarousel />
        
        <RankingsTable />

        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">NFT Marketplace</h2>
            <p className="text-gray-400 mt-1">
              {loading ? 'Loading...' : `${filteredNfts.length} NFTs available`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
              <input 
                type="text" 
                placeholder="Search NFTs..." 
                value={searchTerm}
                onChange={handleSearch}
                className="cyber-input w-full pl-10" 
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center bg-card rounded-lg p-1 border border-secondary/10">
              {['all', 'jerseys', 'stadiums', 'badges'].map(f => {
                // Calcular contagem para cada categoria
                let count = 0;
                if (f === 'all') {
                  count = allNfts.length;
                } else {
                  const categoryMap: Record<string, string> = {
                    'jerseys': 'jersey',
                    'stadiums': 'stadium', 
                    'badges': 'badge'
                  };
                  const targetCategory = categoryMap[f] || f;
                  count = allNfts.filter(nft => nft.category === targetCategory).length;
                }
                
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      filter === f
                        ? 'bg-accent text-white'
                        : 'text-secondary hover:text-white'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {error ? (
          <ErrorState />
        ) : loading ? (
          <>
            <LoadingState />
            {/* Loading Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl aspect-square animate-pulse"></div>
              ))}
            </div>
          </>
        ) : filteredNfts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <MarketplaceCard 
                key={nft._id}
                name={nft.name}
                imageUrl={nft.imageUrl}
                price={nft.price || 'Not for sale'}
                collection={nft.collection || `By ${nft.creator?.name || 'Anonymous'}`}
                category={nft.category}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}