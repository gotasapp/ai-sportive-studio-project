'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import RankingsTable from '@/components/marketplace/RankingsTable';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import { Filter, Search, LayoutGrid, List } from 'lucide-react';

// Tipos de dados
interface NFT {
  name: string;
  image_url: string;
  description: string;
  price: string;
  category?: 'jersey' | 'stadium' | 'badge';
  collection: string; 
}

interface MarketplaceData {
  marketplace_nfts: {
    jerseys: NFT[];
    stadiums: NFT[];
    badges: NFT[];
  };
}

export default function MarketplacePage() {
  const [allNfts, setAllNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'jerseys' | 'stadiums' | 'badges'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // 'grid' is default now
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/marketplace-images.json');
        const data: MarketplaceData = await response.json();
        
        const jerseys = data.marketplace_nfts.jerseys.map(n => ({ ...n, category: 'jersey' as const, collection: n.collection || 'Official Jerseys' }));
        const stadiums = data.marketplace_nfts.stadiums.map(n => ({ ...n, category: 'stadium' as const, collection: n.collection || 'World Stadiums' }));
        const badges = data.marketplace_nfts.badges.map(n => ({ ...n, category: 'badge' as const, collection: n.collection || 'Champion Badges'}));

        const combined = [...jerseys, ...stadiums, ...badges];
        setAllNfts(combined);
        setFilteredNfts(combined);
      } catch (error) {
        console.error('Erro ao carregar dados do marketplace:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredNfts(allNfts);
    } else {
      setFilteredNfts(allNfts.filter(nft => nft.category === filter));
    }
  }, [filter, allNfts]);

  return (
    <main className="flex min-h-screen flex-col bg-primary text-secondary">
      <Header />
      
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-12">
        
        {/* Carrossel de Destaque */}
        <FeaturedCarousel />
        
        {/* Tabela de Rankings */}
        <RankingsTable />

        {/* Header da Galeria e Filtros */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-bold text-white">Explore NFTs</h2>
            <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                    <input type="text" placeholder="Search items..." className="cyber-input w-full pl-10" />
                </div>
                <div className="flex items-center bg-card rounded-lg p-1 border border-secondary/10">
                    {['all', 'jerseys', 'stadiums', 'badges'].map(f => (
                         <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                            filter === f
                                ? 'bg-accent text-white'
                                : 'text-secondary hover:text-white'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Grid de NFTs */}
        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl aspect-square animate-pulse"></div>
                ))}
             </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredNfts.map((nft, index) => (
                    <MarketplaceCard 
                        key={`${nft.name}-${index}`}
                        name={nft.name}
                        imageUrl={nft.image_url}
                        price={nft.price}
                        collection={nft.collection}
                        category={nft.category}
                    />
                ))}
            </div>
        )}
      </div>
    </main>
  );
} 