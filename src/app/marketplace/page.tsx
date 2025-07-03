'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import RankingsTable from '@/components/marketplace/RankingsTable';
import MarketplaceCard from '@/components/marketplace/MarketplaceCard';
import { Filter, Search } from 'lucide-react';

// Tipos de dados, o do DB é um pouco diferente
interface NFT {
  _id?: string; // ID do MongoDB é opcional
  name: string;
  imageUrl: string; // no DB é imageUrl
  description?: string; // Opcional no DB
  price?: string; // Virá do contrato/engine no futuro
  category: 'jersey' | 'stadium' | 'badge';
  collection?: string;
  creator?: { wallet: string; name: string };
}

export default function MarketplacePage() {
  const [allNfts, setAllNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'jerseys' | 'stadiums' | 'badges'>('all');
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Buscar Jerseys dinâmicas da nossa API
        const jerseysResponse = await fetch('/api/jerseys');
        if (!jerseysResponse.ok) {
            console.error('Failed to fetch dynamic jerseys');
            throw new Error('API Error for Jerseys');
        }
        const dynamicJerseys: NFT[] = await jerseysResponse.json();

        // 2. Buscar dados estáticos para estádios e emblemas
        const staticResponse = await fetch('/marketplace-images.json');
        const staticData = await staticResponse.json();
        
        const stadiums: NFT[] = staticData.marketplace_nfts.stadiums.map((n: any) => ({ ...n, category: 'stadium' as const, collection: n.collection || 'World Stadiums' }));
        const badges: NFT[] = staticData.marketplace_nfts.badges.map((n: any) => ({ ...n, category: 'badge' as const, collection: n.collection || 'Champion Badges'}));
        
        // Adiciona a categoria 'jersey' aos itens vindo do DB
        const categorizedJerseys = dynamicJerseys.map(j => ({ ...j, category: 'jersey' as const, price: '0.05 CHZ' }));

        // 3. Combinar tudo
        const combined = [...categorizedJerseys, ...stadiums, ...badges];
        setAllNfts(combined);
        setFilteredNfts(combined);

      } catch (error) {
        console.error('Erro ao carregar dados do marketplace:', error);
        // Fallback para dados estáticos em caso de erro na API
        const staticResponse = await fetch('/marketplace-images.json').catch(() => null);
        if (staticResponse) {
          const staticData = await staticResponse.json();
          const jerseys = staticData.marketplace_nfts.jerseys.map((n: any) => ({ ...n, category: 'jersey' as const, collection: n.collection || 'Official Jerseys' }));
          const stadiums = staticData.marketplace_nfts.stadiums.map((n: any) => ({ ...n, category: 'stadium' as const, collection: n.collection || 'World Stadiums' }));
          const badges = staticData.marketplace_nfts.badges.map((n: any) => ({ ...n, category: 'badge' as const, collection: n.collection || 'Champion Badges'}));
          const combined = [...jerseys, ...stadiums, ...badges];
          setAllNfts(combined);
          setFilteredNfts(combined);
        }

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
        
        <FeaturedCarousel />
        
        <RankingsTable />

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

        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl aspect-square animate-pulse"></div>
                ))}
             </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredNfts.map((nft) => (
                    <MarketplaceCard 
                        key={nft._id || nft.name} // Usa o _id do DB se existir
                        name={nft.name}
                        imageUrl={nft.imageUrl} // Campo correto do DB
                        price={nft.price || 'Not for sale'}
                        collection={nft.collection || (nft.creator ? `Created by ${nft.creator.name}` : 'User Creations')}
                        category={nft.category}
                    />
                ))}
            </div>
        )}
      </div>
    </main>
  );
}