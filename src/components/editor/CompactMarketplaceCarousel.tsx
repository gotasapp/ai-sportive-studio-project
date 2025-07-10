import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { convertIpfsToHttp } from '@/lib/utils';

interface MarketplaceNFT {
  name: string;
  imageUrl: string;
  description: string;
  price: string;
  type?: string;
}

interface CompactMarketplaceCarouselProps {
  className?: string;
}

export default function CompactMarketplaceCarousel({ className = '' }: CompactMarketplaceCarouselProps) {
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      const response = await fetch('/marketplace-images.json');
      if (response.ok) {
        const data = await response.json();
        setMarketplaceNFTs(data.featured || []);
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const itemsPerView = 4;
  const maxIndex = Math.max(0, marketplaceNFTs.length - itemsPerView);

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const goToPrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const visibleItems = marketplaceNFTs.slice(currentIndex, currentIndex + itemsPerView);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-light uppercase tracking-wide">
            Marketplace
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-dark/30 rounded-lg aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (marketplaceNFTs.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-gray-light uppercase tracking-wide">
          Trending NFTs
        </h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="p-1 rounded text-gray-medium hover:text-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-xs text-gray-medium">
            {currentIndex + 1}-{Math.min(currentIndex + itemsPerView, marketplaceNFTs.length)} of {marketplaceNFTs.length}
          </span>
          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className="p-1 rounded text-gray-medium hover:text-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Carousel Grid */}
      <div className="grid grid-cols-4 gap-3">
        {visibleItems.map((nft, index) => (
          <CompactNFTCard key={`${currentIndex}-${index}`} nft={nft} />
        ))}
      </div>

    </div>
  );
}

interface CompactNFTCardProps {
  nft: MarketplaceNFT;
}

function CompactNFTCard({ nft }: CompactNFTCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="group bg-gray-dark/20 border-gray-medium/20 hover:border-gray-light/30 transition-all duration-200 cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-2">
        
        {/* Image */}
        <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-gray-dark/50">
          {!imageError ? (
            <img
              src={convertIpfsToHttp(nft.imageUrl)}
              alt={nft.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-gray-medium">No Image</span>
            </div>
          )}
          
          {/* Overlay com hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <ExternalLink className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-white truncate">
            {nft.name}
          </h4>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs px-1 py-0 bg-primary/20 text-primary border-primary/30">
              {nft.price}
            </Badge>
            {nft.type && (
              <span className="text-xs text-gray-medium capitalize">
                {nft.type}
              </span>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

// Loading skeleton para o carousel
export function CompactMarketplaceCarouselSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-gray-dark/50 rounded animate-pulse" />
        <div className="h-3 w-16 bg-gray-dark/30 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-dark/30 rounded-lg aspect-square animate-pulse" />
        ))}
      </div>
    </div>
  );
} 