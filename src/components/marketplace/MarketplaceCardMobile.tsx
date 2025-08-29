'use client';

import { Eye } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { useAuctionData } from '@/hooks/useAuctionData';
import { formatPriceSafe, isValidPrice, debugPrice } from '@/lib/marketplace-config';
import Link from 'next/link';

interface MarketplaceCardMobileProps {
  name: string;
  imageUrl: string;
  price: string;
  collection: string;
  category?: 'jersey' | 'stadium' | 'badge' | string;
  // NFT information for functionalities
  tokenId?: string;
  assetContract?: string;
  listingId?: string;
  isListed?: boolean;
  owner?: string;
  // For Custom Collections
  collectionId?: string;
  isCustomCollection?: boolean;
  // Auction information (if applicable)
  isAuction?: boolean;
  auctionId?: string;
  currentBid?: string;
  endTime?: Date;
  // Offer information
  activeOffers?: number;
  // Props specific for mobile
  viewType?: 'large' | 'medium' | 'compact';
  onBuy?: (nft: any) => void;
  // Sistema de voting
  nftId?: string;
  votes?: number;
  userVoted?: boolean;
}

const categoryColors = {
    jersey: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
    stadium: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
    badge: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
    default: 'bg-[#FDFDFD]/10 text-[#FDFDFD] border-[#FDFDFD]/20',
};

export default function MarketplaceCardMobile({ 
  name, 
  imageUrl, 
  price, 
  collection, 
  category,
  tokenId = '1',
  assetContract = '',
  listingId,
  isListed = false,
  owner,
  collectionId,
  isCustomCollection = false,
  isAuction = false,
  auctionId,
  currentBid,
  endTime,
  activeOffers = 0,
  viewType = 'large',
  onBuy,
  nftId,
  votes = 0,
  userVoted = false
}: MarketplaceCardMobileProps) {
  
  const account = useActiveAccount();
  const isOwner = account?.address?.toLowerCase() === owner?.toLowerCase();

  // 🔄 HOOK FOR REAL-TIME AUCTION DATA
  const auctionData = useAuctionData({
    auctionId,
    isAuction,
    initialBid: currentBid || '1 MATIC',
    refreshInterval: 30
  });

  // Use real-time bid if available, otherwise use initial value
  const displayCurrentBid = isAuction 
    ? (auctionData.hasValidBid ? auctionData.currentBid : currentBid)
    : currentBid;
  
  // 🚨 SAFE PRICE VALIDATION - REMOVIDO pois preço já vem formatado da Thirdweb
  const isPriceValid = true; // Sempre válido pois vem formatado da Thirdweb
  const safePrice = price; // Usar preço diretamente
  
  const color = category ? categoryColors[category as keyof typeof categoryColors] || categoryColors.default : categoryColors.default;

  // 🎯 EXATA MESMA LÓGICA DO DESKTOP
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

  // ✅ SIMPLIFICADO: Remover todos os botões de trading, deixar apenas View Collection
    const renderViewCollectionButton = () => {
    return (
      <Link 
        href={collectionUrl}
        prefetch={false}
        className="w-full bg-[#FF0052] hover:bg-[#FF0052]/90 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Eye className="h-4 w-4" />
        View Collection
      </Link>
    );
  };

  // Rendering based on view type
  if (viewType === 'compact') {
    return (
      <div className="rounded-xl p-2 flex items-center gap-2 shadow-md min-h-[60px]" style={{ background: 'rgba(20,16,30,0.4)' }}>
                 <Link href={collectionUrl} prefetch={false} className="flex-shrink-0">
          <img src={imageUrl} alt={name} className="w-12 h-12 rounded-lg object-cover bg-[#222]" />
        </Link>
        
        <div className="flex-1 min-w-0">
                     <Link href={collectionUrl} prefetch={false} className="block">
            <div className="font-semibold text-white text-sm leading-tight truncate">{name}</div>
            <div className="text-[11px] text-white/60 leading-tight truncate">{collection}</div>
          </Link>
          
          {/* Price/Bid information */}
          <div className="mt-0.5">
            {isAuction ? (
              <div className="flex items-center gap-1">
                <p className="text-xs text-[#FF0052] font-bold">{displayCurrentBid || price}</p>
                {auctionData.isLoading && (
                  <div className="animate-spin h-2 w-2 border border-[#FF0052] border-t-transparent rounded-full"></div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <p className={`text-xs font-bold ${isPriceValid ? 'text-[#FF0052]' : 'text-red-400'}`}>{safePrice}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* View Collection button */}
        <div className="flex items-center gap-2">
          {renderViewCollectionButton()}
        </div>
      </div>
    );
  }

  // Large e Medium views
  const isLargeView = viewType === 'large';
  const gridCols = isLargeView ? '' : 'h-16';
  const imageSize = isLargeView ? 'h-28' : 'h-16';
  const textSize = isLargeView ? 'text-base' : 'text-xs';
  const padding = isLargeView ? 'p-3' : 'p-2';

  return (
    <div className={`relative rounded-xl ${padding} flex flex-col items-center shadow-md`} style={{ background: 'rgba(20,16,30,0.4)' }}>
             <Link href={collectionUrl} prefetch={false} className="w-full">
         <div className="relative">
          <img src={imageUrl} alt={name} className={`w-full ${imageSize} rounded-lg object-cover bg-[#222] mb-2`} />
          
          {/* Status badges */}
          <div className="absolute bottom-1 left-1">
            {isListed && !isAuction && (
              <span className="bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-sm">
                For Sale
              </span>
            )}
            {isAuction && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                endTime && new Date() > endTime 
                  ? 'bg-black/80 text-white border-white/30' 
                  : 'bg-black/80 text-white border-white/30'
              }`}>
                {endTime && new Date() > endTime ? 'Ended' : 'Live'}
              </span>
            )}
          </div>

          {/* Category badge */}
          <div className="absolute top-1 left-1">
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
              {category?.toUpperCase()}
            </div>
          </div>
        </div>
      </Link>

             <Link href={collectionUrl} prefetch={false} className="w-full">
         <div className={`font-semibold text-white ${textSize} text-center w-full truncate`}>{name}</div>
        <div className={`text-[10px] text-white/60 text-center w-full truncate ${isLargeView ? 'mb-1' : ''}`}>{collection}</div>
      </Link>
      
      {/* Price information */}
      <div className="w-full text-center mb-2">
        {isAuction ? (
          <div>
            <div className="flex items-center justify-center gap-1">
              <p className={`${isLargeView ? 'text-sm' : 'text-xs'} text-[#FF0052] font-bold`}>{displayCurrentBid || price}</p>
              {auctionData.isLoading && (
                <div className="animate-spin h-3 w-3 border border-[#FF0052] border-t-transparent rounded-full"></div>
              )}
            </div>
            <p className="text-[10px] text-white/60">Current Bid</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <p className={`${isLargeView ? 'text-sm' : 'text-xs'} font-bold ${isPriceValid ? 'text-[#FF0052]' : 'text-red-400'}`}>{safePrice}</p>
          </div>
        )}
        
        {/* Active Offers Counter */}
        {activeOffers > 0 && (
          <p className="text-[10px] text-[#FF0052] mt-1">
            {activeOffers} offer{activeOffers !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Action button for large view */}
      {isLargeView && (
        <div className="w-full">
          {renderViewCollectionButton()}
        </div>
      )}
    </div>
  );
}
