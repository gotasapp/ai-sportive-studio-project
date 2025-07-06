'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface RealNFT {
  _id: string;
  name: string;
  imageUrl: string;
  creator?: {
    wallet: string;
    name: string;
  };
  createdAt: string;
  category: 'jersey' | 'stadium' | 'badge';
}

interface FeaturedNFT {
  name: string;
  collection: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export default function FeaturedCarousel() {
  const [featuredNFTs, setFeaturedNFTs] = useState<FeaturedNFT[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRealFeaturedData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar dados reais de todas as APIs
        const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
          fetch('/api/jerseys'),
          fetch('/api/stadiums'),
          fetch('/api/badges')
        ]);

        if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
          throw new Error('Failed to fetch featured NFT data');
        }

        const jerseys: RealNFT[] = await jerseysResponse.json();
        const stadiums: RealNFT[] = await stadiumsResponse.json();
        const badges: RealNFT[] = await badgesResponse.json();

        // Combinar todos os NFTs e adicionar categoria
        const allNFTs: RealNFT[] = [
          ...jerseys.map(j => ({ ...j, category: 'jersey' as const })),
          ...stadiums.map(s => ({ ...s, category: 'stadium' as const })),
          ...badges.map(b => ({ ...b, category: 'badge' as const }))
        ];

        if (allNFTs.length === 0) {
          setFeaturedNFTs([]);
          return;
        }

        // Ordenar por data de criação (mais recentes primeiro) e pegar os primeiros
        const sortedNFTs = allNFTs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Selecionar até 5 NFTs para o carousel
        const featuredCount = Math.min(sortedNFTs.length, 5);
        const selectedNFTs = sortedNFTs.slice(0, featuredCount);

        // Mapear para o formato do carousel
        const featured: FeaturedNFT[] = selectedNFTs.map(nft => ({
          name: nft.name,
          collection: nft.creator?.name || `${nft.category.charAt(0).toUpperCase() + nft.category.slice(1)} Collection`,
          imageUrl: nft.imageUrl,
          category: nft.category,
          createdAt: nft.createdAt
        }));

        setFeaturedNFTs(featured);

      } catch (error: any) {
        console.error('❌ Error loading featured NFTs:', error);
        setError(error.message || 'Failed to load featured NFTs');
        setFeaturedNFTs([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealFeaturedData();
  }, []);
  
  // Auto-scroll
  useEffect(() => {
    if (featuredNFTs.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % featuredNFTs.length);
    }, 6000); // muda a cada 6 segundos
    
    return () => clearInterval(timer);
  }, [featuredNFTs.length]);

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + featuredNFTs.length) % featuredNFTs.length);
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % featuredNFTs.length);
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="w-full h-[350px] md:h-[400px] lg:h-[500px] bg-card flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm">Loading featured NFTs...</p>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="w-full h-[350px] md:h-[400px] lg:h-[500px] bg-card flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Featured NFTs</h3>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="cyber-button px-4 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Estado vazio (sem NFTs)
  if (featuredNFTs.length === 0) {
    return (
      <div className="w-full h-[350px] md:h-[400px] lg:h-[500px] bg-card flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">No Featured NFTs Yet</h3>
        <p className="text-gray-400 max-w-md">
          Start creating jerseys, stadiums, and badges to see them featured here!
        </p>
      </div>
    );
  }

  const activeNFT = featuredNFTs[currentIndex];

  // Mapear categoria para ícone/cor
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'jersey':
        return { color: 'text-blue-400', icon: '👕' };
      case 'stadium':
        return { color: 'text-green-400', icon: '🏟️' };
      case 'badge':
        return { color: 'text-yellow-400', icon: '🏆' };
      default:
        return { color: 'text-accent', icon: '⭐' };
    }
  };

  const categoryStyle = getCategoryStyle(activeNFT.category);

  return (
    <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden group">
      {/* Background Image */}
      <Image
        src={activeNFT.imageUrl}
        alt={activeNFT.name}
        fill
        style={{ objectFit: 'cover' }}
        className="transition-transform duration-500 ease-in-out group-hover:scale-105"
        loading="eager"
        priority
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

      {/* Featured Badge */}
      <div className="absolute top-6 left-8 md:left-16 lg:left-24 z-10">
        <div className="bg-accent/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
          <Star className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Featured</span>
        </div>
      </div>



      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:px-16 lg:px-24 text-white">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">{categoryStyle.icon}</span>
          <span className={`text-sm font-semibold ${categoryStyle.color}`}>
            {activeNFT.category.charAt(0).toUpperCase() + activeNFT.category.slice(1)}
          </span>
        </div>
        
        <h2 className="text-4xl font-bold mb-3 leading-tight">{activeNFT.name}</h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30">
              <span className="text-accent font-bold text-sm">
                {activeNFT.collection.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{activeNFT.collection}</p>
              <p className="text-gray-300 text-sm">
                Created {new Date(activeNFT.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {featuredNFTs.length > 1 && (
            <div className="text-right">
              <p className="text-gray-300 text-sm">
                {currentIndex + 1} of {featuredNFTs.length}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation - só mostra se há mais de 1 NFT */}
      {featuredNFTs.length > 1 && (
        <>
          <button 
            onClick={goToPrevious} 
            className="absolute left-8 md:left-16 lg:left-24 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={goToNext} 
            className="absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70"
          >
            <ChevronRight size={24} />
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {featuredNFTs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-accent' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
} 