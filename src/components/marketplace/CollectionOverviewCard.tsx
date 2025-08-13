'use client';

import { Heart, ArrowRight, Eye } from 'lucide-react';
import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { formatPriceSafe } from '@/lib/marketplace-config';
import { CardImage } from './OptimizedImage';
import Link from 'next/link';

interface CollectionOverviewCardProps {
  name: string;
  imageUrl: string;
  collection: string;
  category?: 'jersey' | 'stadium' | 'badge' | string;
  
  // Collection-specific data
  collectionId?: string;
  isCustomCollection?: boolean;
  
  // Overview information (not trading)
  mintedUnits?: number;
  totalUnits?: number;
  availableUnits?: number;
  floorPrice?: string;
  totalVolume?: string;
  
  // Collection stats
  uniqueOwners?: number;
  listedCount?: number;
  auctionCount?: number;
}

const categoryColors = {
  jersey: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
  stadium: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
  badge: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
  custom_collection: 'bg-[#A20131]/20 text-[#A20131] border-[#A20131]/30',
  launchpad_collection: 'bg-[#A20131]/20 text-[#A20131] border-[#A20131]/30',
  default: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20'
};

export default function CollectionOverviewCard({
  name,
  imageUrl,
  collection,
  category = 'jersey',
  collectionId,
  isCustomCollection = false,
  mintedUnits = 0,
  totalUnits = 0,
  availableUnits = 0,
  floorPrice = '0 MATIC',
  totalVolume = '0 MATIC',
  uniqueOwners = 0,
  listedCount = 0,
  auctionCount = 0
}: CollectionOverviewCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const account = useActiveAccount();

  const color = categoryColors[category as keyof typeof categoryColors] || categoryColors.default;
  
  // Calculate progress percentage for minting
  const mintProgress = totalUnits > 0 ? Math.round((mintedUnits / totalUnits) * 100) : 0;
  
  // Collection page URL (comportamento do commit citado)
  const collectionUrl = isCustomCollection && collectionId 
    ? `/marketplace/collection/${category === 'jerseys' ? 'jersey' : category}/${collectionId}`
    : `/marketplace/collection/${category}/${collection}`;

  return (
    <div className="cyber-card rounded-xl overflow-hidden group transition-all hover:border-[#FDFDFD]/20 hover:shadow-lg hover:shadow-[#A20131]/10">
      {/* Collection Image with Link */}
      <Link href={collectionUrl} prefetch={false} legacyBehavior>
        <a className="block relative aspect-square focus:outline-none">
          <CardImage 
            src={imageUrl} 
            alt={name}
          />
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
            <div className={`text-xs font-bold px-2 py-1 rounded-full border ${color}`}>
              {isCustomCollection ? 'CUSTOM' : category?.toUpperCase()}
            </div>
            
            {/* Mint Progress Badge */}
            {totalUnits > 0 && (
              <div className="bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                {mintedUnits}/{totalUnits}
              </div>
            )}
          </div>
          
          {/* Activity Indicators */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
            <div className="flex gap-1">
              {listedCount > 0 && (
                <span className="bg-green-600/80 text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                  {listedCount} For Sale
                </span>
              )}
              {auctionCount > 0 && (
                <span className="bg-orange-600/80 text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                  {auctionCount} Auction{auctionCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* View Collection Hint */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </div>
        </a>
      </Link>
      
      {/* Collection Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#FDFDFD] truncate">{name}</h3>
          
          {/* Like Button */}
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="p-1 rounded-full hover:bg-[#FDFDFD]/10 transition-colors"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-[#A20131] text-[#A20131]' : 'text-[#FDFDFD]/50'}`} />
          </button>
        </div>
        
        {/* Collection Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-[#FDFDFD]/70">Floor Price</p>
            <p className="text-sm font-medium text-[#A20131]">
              {formatPriceSafe(floorPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#FDFDFD]/70">Volume</p>
            <p className="text-sm font-medium text-[#FDFDFD]">
              {formatPriceSafe(totalVolume)}
            </p>
          </div>
        </div>
        
        {/* Mint Progress Bar */}
        {totalUnits > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-[#FDFDFD]/70 mb-1">
              <span>Minted: {mintProgress}%</span>
              <span>{uniqueOwners} owner{uniqueOwners !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-full bg-[#FDFDFD]/10 rounded-full h-2">
              <div 
                className="bg-[#A20131] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${mintProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Action Buttons - OVERVIEW ONLY */}
        <div className="space-y-2">
          <Link href={collectionUrl} legacyBehavior>
            <a className="w-full">
              <Button className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white">
                <Eye className="mr-2 h-4 w-4" />
                View Collection
              </Button>
            </a>
          </Link>
          
          {/* Quick Stats */}
          <div className="flex justify-between text-xs text-[#FDFDFD]/70">
            <span>{mintedUnits} minted</span>
            <span>{availableUnits} available</span>
            <span>{listedCount + auctionCount} active</span>
          </div>
        </div>
      </div>
    </div>
  );
}