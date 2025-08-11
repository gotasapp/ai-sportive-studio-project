'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { CarouselImage } from './OptimizedImage';
import { CarouselSkeleton } from './MarketplacePageSkeleton';

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

interface FeaturedCarouselProps {
  marketplaceData?: any[];
  loading?: boolean;
}

export default function FeaturedCarousel({ marketplaceData = [], loading = false }: FeaturedCarouselProps) {
  const [featuredNFTs, setFeaturedNFTs] = useState<FeaturedNFT[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingState, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const processFeaturedData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎠 Processing featured carousel data:', marketplaceData.length, 'items');
        
        // Sempre tentar buscar o NFT mais votado primeiro
        let mostVotedNFT: any = null;
        try {
          const mostVotedResponse = await fetch('/api/nft/most-voted');
          if (mostVotedResponse.ok) {
            const mostVotedData = await mostVotedResponse.json();
            if (mostVotedData.success && mostVotedData.nft) {
              mostVotedNFT = mostVotedData.nft;
              console.log('🏆 Most voted NFT found:', mostVotedNFT.name, 'with', mostVotedNFT.votes, 'votes');
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch most voted NFT, continuing with regular carousel');
        }

        // Array final que será usado no carrossel
        const featured: FeaturedNFT[] = [];

        // Se encontramos um NFT mais votado, adicionar no início
        if (mostVotedNFT) {
          featured.push({
            name: `🏆 ${mostVotedNFT.name}`, // Adicionar emoji de troféu
            collection: `Most Voted • ${mostVotedNFT.votes} votes`,
            imageUrl: mostVotedNFT.imageUrl,
            category: mostVotedNFT.category || 'featured',
            createdAt: mostVotedNFT.createdAt || new Date().toISOString()
          });
        }

        // Agora adicionar outros NFTs do marketplace (excluindo o mais votado se já foi incluído)
        if (marketplaceData.length > 0) {
          const featuredCount = Math.min(marketplaceData.length, mostVotedNFT ? 4 : 5); // 4 se já temos o mais votado, senão 5
          
          // Filtrar o NFT mais votado para não duplicar
          const otherNFTs = mostVotedNFT 
            ? marketplaceData.filter(nft => nft._id !== mostVotedNFT._id)
            : marketplaceData;

          // Misturar e selecionar
          const shuffledNFTs = [...otherNFTs].sort(() => Math.random() - 0.5);
          const selectedNFTs = shuffledNFTs.slice(0, featuredCount);

          // Adicionar aos featured
          const otherFeatured = selectedNFTs.map(nft => ({
            name: nft.name,
            collection: nft.collection || `${(nft.category || 'NFT').charAt(0).toUpperCase() + (nft.category || 'NFT').slice(1)} Collection`,
            imageUrl: nft.imageUrl || nft.image,
            category: nft.category || 'nft',
            createdAt: nft.createdAt || new Date().toISOString()
          }));

          featured.push(...otherFeatured);
        }

        console.log('🎠 Featured NFTs selected:', featured.length, mostVotedNFT ? '(including most voted)' : '');
        setFeaturedNFTs(featured);

      } catch (error: any) {
        console.error('❌ Error processing featured NFTs:', error);
        setError(error.message || 'Failed to process featured NFTs');
        setFeaturedNFTs([]);
      } finally {
        setLoading(false);
      }
    };

    processFeaturedData();
  }, [marketplaceData]);
  
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
  if (loading || loadingState) {
    return <CarouselSkeleton />;
  }

  // Estado de erro
  if (error) {
    return (
      <div className="w-full h-[350px] md:h-[400px] lg:h-[500px] bg-transparent flex flex-col items-center justify-center">
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
      <div className="w-full h-[350px] md:h-[400px] lg:h-[500px] bg-transparent flex flex-col items-center justify-center text-center p-8">
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
            <CarouselImage
              src={nft.imageUrl}
              alt={nft.name}
              priority={index < 2}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            {/* Featured Badge */}
            <div className="absolute top-6 left-8 md:left-16 lg:left-24 z-10">
              <div className={`backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 ${
                nft.collection.includes('Most Voted') 
                  ? 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90 border border-yellow-400/50' 
                  : 'bg-accent/90'
              }`}>
                {nft.collection.includes('Most Voted') ? (
                  <span className="text-white text-lg">🏆</span>
                ) : (
                  <Star className="w-4 h-4 text-white" />
                )}
                <span className="text-white text-sm font-medium">
                  {nft.collection.includes('Most Voted') ? 'Most Voted' : 'Featured'}
                </span>
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