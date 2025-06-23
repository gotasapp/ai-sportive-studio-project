'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import Header from '@/components/Header';
import { ShoppingBag, Filter, Grid3X3, List, Star } from 'lucide-react';

interface NFT {
  name: string;
  image_url: string;
  description: string;
  price: string;
  category?: string;
}

interface MarketplaceData {
  marketplace_nfts: {
    jerseys: NFT[];
    stadiums: NFT[];
  };
}

export default function MarketplacePage() {
  const account = useActiveAccount();
  const router = useRouter();
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'jerseys' | 'stadiums'>('all');
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do marketplace
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        const response = await fetch('/marketplace-images.json');
        const data = await response.json();
        setMarketplaceData(data);
      } catch (error) {
        console.error('Erro ao carregar dados do marketplace:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarketplaceData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!account) {
        router.push('/login');
      } else {
        setIsAuthCheckComplete(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [account, router]);

  if (!isAuthCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loading || !marketplaceData) {
    return (
      <main className="flex min-h-screen flex-col bg-black pb-20 lg:pb-0">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  // Filtrar NFTs baseado no filtro selecionado
  const getFilteredNFTs = () => {
    if (filter === 'jerseys') {
      return marketplaceData.marketplace_nfts.jerseys.map(nft => ({ ...nft, category: 'jersey' }));
    }
    if (filter === 'stadiums') {
      return marketplaceData.marketplace_nfts.stadiums.map(nft => ({ ...nft, category: 'stadium' }));
    }
    return [
      ...marketplaceData.marketplace_nfts.jerseys.map(nft => ({ ...nft, category: 'jersey' })),
      ...marketplaceData.marketplace_nfts.stadiums.map(nft => ({ ...nft, category: 'stadium' }))
    ];
  };

  const filteredNFTs = getFilteredNFTs();

  return (
    <main className="flex min-h-screen flex-col bg-black pb-20 lg:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header da página */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">NFT Marketplace</h1>
              <p className="text-gray-400">Discover and collect unique sports NFTs</p>
            </div>
          </div>
          
          {/* Controles */}
          <div className="flex items-center space-x-4">
            {/* Filtros */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'jerseys' | 'stadiums')}
                className="bg-card border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All NFTs</option>
                <option value="jerseys">Jerseys</option>
                <option value="stadiums">Stadiums</option>
              </select>
            </div>
            
            {/* View Mode */}
            <div className="flex items-center bg-card rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-cyan-400">{filteredNFTs.length}</div>
            <div className="text-gray-400 text-sm">Total NFTs</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{marketplaceData.marketplace_nfts.jerseys.length}</div>
            <div className="text-gray-400 text-sm">Jerseys</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{marketplaceData.marketplace_nfts.stadiums.length}</div>
            <div className="text-gray-400 text-sm">Stadiums</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">0.1-0.3</div>
            <div className="text-gray-400 text-sm">ETH Range</div>
          </div>
        </div>

        {/* NFT Grid/List */}
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }
        `}>
          {filteredNFTs.map((nft, index) => (
            <div 
              key={index}
              className={`
                bg-card backdrop-blur-lg border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 group cursor-pointer
                ${viewMode === 'list' ? 'flex items-center p-4' : 'p-4'}
              `}
            >
              {/* Imagem */}
              <div className={`
                ${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0 mr-4' : 'aspect-square mb-4'}
                rounded-lg overflow-hidden bg-black
              `}>
                <img 
                  src={nft.image_url} 
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    console.error('Erro ao carregar imagem:', nft.image_url);
                    (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                  }}
                />
              </div>
              
              {/* Conteúdo */}
              <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white text-lg truncate">{nft.name}</h3>
                    <p className="text-gray-400 text-sm">{nft.description}</p>
                  </div>
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${(nft as any).category === 'jersey' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-blue-500/20 text-blue-400'
                    }
                  `}>
                    {(nft as any).category}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{nft.price}</div>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs">4.8</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNFTs.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No NFTs found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </main>
  );
} 