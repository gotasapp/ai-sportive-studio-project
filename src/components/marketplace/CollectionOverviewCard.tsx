'use client';

import { ArrowRight, Eye, Tag, Gavel } from 'lucide-react';
import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPriceSafe } from '@/lib/marketplace-config';
import { CardImage } from './OptimizedImage';
import Link from 'next/link';
import { NETWORK_CURRENCY } from '@/lib/network-config';

interface CollectionOverviewCardProps {
  name: string;
  imageUrl: string;
  collection: string;
  category?: 'jersey' | 'stadium' | 'badge' | string;
  
  // Collection-specific data
  collectionId?: string;
  isCustomCollection?: boolean;
  hrefOverride?: string;
  
  // Overview information (not trading)
  mintedUnits?: number;
  totalUnits?: number;
  availableUnits?: number;
  floorPrice?: string;
  
  // Collection stats
  uniqueOwners?: number;
  listedCount?: number;
  auctionCount?: number;
  
  // 🎯 DADOS REAIS DE PREÇO DO MARKETPLACE
  price?: string;
  isListed?: boolean;
  isAuction?: boolean;
  currentBid?: string;
  currency?: string;
}

const categoryColors = {
  jersey: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
  stadium: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
  badge: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
  custom_collection: 'bg-[#FF0052]/20 text-[#FF0052] border-[#FF0052]/30',
  launchpad_collection: 'bg-[#FF0052]/20 text-[#FF0052] border-[#FF0052]/30',
  default: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20'
};

export default function CollectionOverviewCard({
  name,
  imageUrl,
  collection,
  category = 'jersey',
  collectionId,
  isCustomCollection = false,
  hrefOverride,
  mintedUnits = 0,
  totalUnits = 0,
  availableUnits = 0,
  floorPrice = `0 ${NETWORK_CURRENCY}`,
  uniqueOwners = 0,
  listedCount = 0,
  auctionCount = 0,
  // 🎯 DADOS REAIS DE PREÇO
  price,
  isListed = false,
  isAuction = false,
  currentBid,
  currency = 'CHZ'
}: CollectionOverviewCardProps) {
  const account = useActiveAccount();

  const color = categoryColors[category as keyof typeof categoryColors] || categoryColors.default;
  
  // Calculate progress percentage for minting
  const mintProgress = totalUnits > 0 ? Math.round((mintedUnits / totalUnits) * 100) : 0;
  
  // 🎯 MESMA LÓGICA DE PREÇO DA PÁGINA DE DETALHES - USANDO DADOS REAIS
  // Calcular floor price baseado nos dados reais
  const calculateFloorPrice = () => {
    // Se temos dados de listagem, usar o preço real
    if (isListed && price && price !== 'Not for sale' && price !== 'Not listed') {
      const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
      if (!isNaN(numericPrice) && numericPrice > 0) {
        return `${numericPrice.toFixed(3)} ${currency}`;
      }
    }
    
    // Fallback para o floorPrice passado como prop
    if (floorPrice && floorPrice !== `0 ${NETWORK_CURRENCY}`) {
      return floorPrice;
    }
    
    return "-- CHZ";
  };

  // 🎯 CALCULAR PREÇO DE EXIBIÇÃO E STATUS - USANDO DADOS REAIS
  const calculateDisplayPrice = () => {
    // 🎯 PRIORIDADE 1: NFT está listada
    if (isListed && price && price !== 'Not for sale' && price !== 'Not listed') {
      const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
      if (!isNaN(numericPrice) && numericPrice > 0) {
        return {
          price: `${numericPrice.toFixed(3)} ${currency}`,
          status: 'For Sale' as const,
          statusColor: 'text-green-400 border-green-400' as const,
          title: 'Listed Price'
        };
      }
    }
    
    // 🎯 PRIORIDADE 2: NFT está em leilão
    if (isAuction) {
      const bidPrice = currentBid || price;
      if (bidPrice && bidPrice !== 'Not for sale' && bidPrice !== 'Not listed') {
        const numericBid = parseFloat(bidPrice.replace(/[^\d.]/g, ''));
        if (!isNaN(numericBid) && numericBid > 0) {
          return {
            price: `${numericBid.toFixed(3)} ${currency}`,
            status: 'Auction' as const,
            statusColor: 'text-yellow-400 border-yellow-400' as const,
            title: 'Auction Price'
          };
        }
      }
    }
    
    // 🎯 PRIORIDADE 3: Usar floorPrice como "Last Sale"
    const fallbackPrice = floorPrice && floorPrice !== `0 ${NETWORK_CURRENCY}` 
      ? floorPrice 
      : '0.047 CHZ';
    
    return {
      price: fallbackPrice,
      status: 'Owned' as const,
      statusColor: 'text-[#FF0052] border-[#FF0052]' as const,
      title: 'Last Sale'
    };
  };

  const displayPrice = calculateDisplayPrice();
  const calculatedFloorPrice = calculateFloorPrice();
  
  // Category normalization (DO NOT normalize launchpad to jersey!)
  const normalizedCategory = (() => {
    const c = (category || '').toLowerCase();
    if (c === 'launchpad' || c === 'launchpad_collection') return 'launchpad';
    if (c === 'jersey' || c === 'jerseys') return 'jersey';
    if (c === 'stadium' || c === 'stadiums') return 'stadium';
    if (c === 'badge' || c === 'badges') return 'badge';
    return c || 'jersey';
  })();
  
  // Se for custom (ou launchpad tratado como custom no grid) e possuir collectionId → rota por collection
  const collectionUrl = isCustomCollection && collectionId 
    ? `/marketplace/collection/${normalizedCategory}/${collectionId}`
    : `/marketplace/collection/${normalizedCategory}/${collection}`;

  // hrefOverride tem prioridade absoluta (para launchpad, custom, etc.)
  const href = hrefOverride || collectionUrl;

  return (
    <div className="cyber-card rounded-xl overflow-hidden group transition-all hover:border-[#FDFDFD]/20 hover:shadow-lg hover:shadow-[#FF0052]/10">
      {/* Collection Image with Link */}
      <Link href={href} prefetch={false} legacyBehavior>
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
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-[#FDFDFD] truncate">{name}</h3>
        </div>
        
        {/* 🎯 NOVA SEÇÃO DE PREÇO - MESMA LÓGICA DA PÁGINA DE DETALHES - DADOS REAIS */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-[#FDFDFD]/70">{displayPrice.title}</p>
              <div className="text-sm font-bold text-[#FDFDFD]">
                {displayPrice.price}
              </div>
              <p className="text-[#FDFDFD]/50 text-xs">
                ≈ ${(() => {
                  const numericPrice = parseFloat(displayPrice.price.replace(/[^\d.]/g, ''));
                  return !isNaN(numericPrice) ? (numericPrice * 0.12).toFixed(2) : '0.00';
                })()} USD
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={`${displayPrice.statusColor} text-xs`}
            >
              {displayPrice.status}
            </Badge>
          </div>
          
          {/* Floor Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-[#FF0052]" />
              <span className="text-xs text-[#FDFDFD]/70">Floor:</span>
            </div>
            <span className="text-xs font-medium text-[#FF0052]">
              {calculatedFloorPrice}
            </span>
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
                className="bg-[#FF0052] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${mintProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Action Buttons - OVERVIEW ONLY */}
        <div className="space-y-2">
          <Link href={href} legacyBehavior>
            <a className="w-full">
              <Button className="w-full bg-[#FF0052] hover:bg-[#FF0052]/90 text-white">
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