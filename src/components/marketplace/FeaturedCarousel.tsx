'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { gsap } from 'gsap';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

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
  
  // GSAP Timeline para animação suave do carrossel
  useEffect(() => {
    if (featuredNFTs.length <= 1 || !containerRef.current) return;

    // Cleanup da timeline anterior
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Criar nova timeline
    const tl = gsap.timeline({ repeat: -1 });
    
    // Para cada slide, criar animação + pausa
    for (let i = 0; i < featuredNFTs.length; i++) {
      const nextIndex = (i + 1) % featuredNFTs.length;
      
      tl.to({}, { 
        duration: 3, // 3 segundos parado
        onComplete: () => setCurrentIndex(nextIndex)
      })
      .to(containerRef.current, {
        x: `-${nextIndex * 100}%`,
        duration: 1.8,
        ease: "power2.inOut", // Easing muito suave
      });
    }

    timelineRef.current = tl;

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [featuredNFTs.length]);

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

  return (
    <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">
      {/* Container das imagens */}
      <div
        ref={containerRef}
        className="flex h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {featuredNFTs.map((nft, index) => (
          <div
            key={index}
            className="relative w-full h-full flex-shrink-0"
          >
            <Image
              src={nft.imageUrl}
              alt={nft.name}
              fill
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300"
              loading="eager"
              priority={index < 2}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            {/* Featured Badge */}
            <div className="absolute top-6 left-8 md:left-16 lg:left-24 z-10">
              <div className="bg-accent/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                <Star className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Featured</span>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:px-16 lg:px-24 text-white">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 text-white">{nft.name}</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30">
                    <span className="text-accent font-bold text-sm">
                      {nft.collection.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{nft.collection}</p>
                    <p className="text-sm text-gray-300">
                      Created {new Date(nft.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {featuredNFTs.length > 1 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {index + 1} of {featuredNFTs.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
                     </div>
         ))}
       </div>
     </div>
   );
} 