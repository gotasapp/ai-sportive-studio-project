'use client';

import { Heart, MoreVertical, Tag, AlertTriangle, Gavel, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useAuctionData } from '@/hooks/useAuctionData';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BuyNowButton from './BuyNowButton';
import MakeOfferButton from './MakeOfferButton';
import { CreateListingModal } from './CreateListingModal';
import { UpdateListingModal } from './UpdateListingModal';
import { CancelListingButton } from './CancelListingButton';
import AuctionBidButton from './AuctionBidButton';
import { CreateAuctionModal } from './CreateAuctionModal';
import { CancelAuctionButton } from './CancelAuctionButton';
import { CollectAuctionPayoutButton } from './CollectAuctionPayoutButton';
import { CollectAuctionTokensButton } from './CollectAuctionTokensButton';
import { formatPriceSafe, isValidPrice, debugPrice } from '@/lib/marketplace-config';
import { CardImage } from './OptimizedImage';
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
  const [isLiked, setIsLiked] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showUpdateListing, setShowUpdateListing] = useState(false);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
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

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement favorites functionality
  };

  const handleListButtonClick = () => {
    console.log('🎯 BOTÃO DE LISTAR CLICADO!', {
      assetContract,
      tokenId,
      name,
      hasAssetContract: !!assetContract
    });
    
    if (!assetContract) {
      console.error('❌ AssetContract está vazio! Não é possível abrir modal.');
      return;
    }
    
    setShowCreateListing(true);
  };

  const handleQuickBuy = () => {
    if (onBuy) {
      onBuy({
        id: tokenId,
        name,
        imageUrl,
        price,
        collection,
        category,
        tokenId,
        assetContract,
        listingId,
        isListed,
        owner
      });
    }
  };

  const renderQuickActions = () => {
    if (isListed && listingId && !isOwner && isPriceValid) {
      return (
        <Button
          onClick={handleQuickBuy}
          className="bg-[#FF0052] hover:bg-[#FF0052]/90 text-white text-xs px-2 py-1 h-7"
        >
          <ShoppingCart className="mr-1 h-3 w-3" />
          Buy
        </Button>
      );
    }
    
    if (isAuction && auctionId && !isOwner && endTime && new Date() < endTime) {
      return (
        <Button
          className="bg-[#FF0052] hover:bg-[#FF0052]/90 text-white text-xs px-2 py-1 h-7"
        >
          <Gavel className="mr-1 h-3 w-3" />
          Bid
        </Button>
      );
    }

    if (isOwner && !isListed && !isAuction) {
      return (
        <Button
          onClick={handleListButtonClick}
          className="bg-[#FF0052] hover:bg-[#FF0052]/90 text-white text-xs px-2 py-1 h-7"
        >
          <Tag className="mr-1 h-3 w-3" />
          List
        </Button>
      );
    }

    return null;
  };

  const renderActionButtons = () => {
    if (isListed && listingId) {
      // NFT is listed for direct sale
      if (isOwner) {
        // Buttons for listing owner
        return (
          <div className="space-y-2">
            <Button
              onClick={() => setShowUpdateListing(true)}
              className="w-full bg-[#FF0052] hover:bg-[#FF0052]/90 text-white text-sm py-2"
            >
              <Tag className="mr-2 h-4 w-4" />
              Update Price
            </Button>
            <CancelListingButton
              listingId={listingId}
              price={price}
              nftName={name}
              tokenId={tokenId}
              className="w-full"
              variant="outline"
              size="sm"
            />
          </div>
        );
              } else {
        // Buttons for buyers
        return (
          <div className="space-y-2">
            {isPriceValid ? (
              <BuyNowButton
                listingId={listingId}
                price={price}
                className="w-full"

              />
            ) : (
              <Button
                disabled
                className="w-full bg-red-500/20 text-red-400 cursor-not-allowed text-sm"
                title="Cannot purchase due to invalid price"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Invalid Price
              </Button>
            )}
            {assetContract && (
              <MakeOfferButton
                assetContract={assetContract}
                tokenId={tokenId}
                nftName={name}
                className="w-full"

              />
            )}
          </div>
        );
      }
          } else if (isAuction && auctionId) {
        // NFT is in auction
      const isAuctionEnded = endTime ? new Date() > endTime : false;
      
      if (isOwner) {
        // Buttons for auction owner
        return (
          <div className="space-y-2">
            {!isAuctionEnded ? (
              <CancelAuctionButton
                auctionId={auctionId}
                nftName={name}
                className="w-full"
                variant="outline"

              />
            ) : (
              <div className="space-y-2">
                <CollectAuctionPayoutButton
                  auctionId={auctionId}
                  nftName={name}
                  className="w-full"
                  variant="default"
  
                />
              </div>
            )}
          </div>
        );
      } else {
        // Buttons for buyers
        return (
          <div className="space-y-2">
            {!isAuctionEnded ? (
              <AuctionBidButton
                auctionId={auctionId}
                currentBid={displayCurrentBid || '0 MATIC'}
                minimumBid={currentBid || '0'}
                endTime={endTime || new Date()}
                currency="MATIC"
                className="w-full"

                onBidSuccess={() => {
                  console.log('🎯 Bid successful! Refreshing auction data...');
                  auctionData.refetch();
                }}
              />
            ) : (
                <div className="space-y-2">
                  <CollectAuctionTokensButton
                    auctionId={auctionId}
                    nftName={name}
                    className="w-full"
                    variant="default"
    
                  />
                </div>
              )}
            {assetContract && (
              <MakeOfferButton
                assetContract={assetContract}
                tokenId={tokenId}
                nftName={name}
                className="w-full"

              />
            )}
          </div>
        );
      }
    } else {
      // NFT is not listed or auctioned
      return (
        <div className="space-y-2">
          {isOwner ? (
            <>
              <Button
                onClick={handleListButtonClick}
                className="w-full bg-[#FF0052] hover:bg-[#FF0052]/90 text-white text-sm"
              >
                <Tag className="mr-2 h-4 w-4" />
                List for Sale
              </Button>
              <Button
                onClick={() => setShowCreateAuction(true)}
                variant="outline"
                className="w-full border-[#FF0052] text-[#FF0052] hover:bg-[#FF0052] hover:text-white text-sm"
              >
                🏆 Create Auction
              </Button>
            </>
          ) : (
            <MakeOfferButton
              assetContract={assetContract}
              tokenId={tokenId}
              nftName={name}
              className="w-full"
            />
          )}
        </div>
      );
    }
  };

  // Rendering based on view type
  if (viewType === 'compact') {
    return (
      <>
        <div className="rounded-xl p-2 flex items-center gap-2 shadow-md min-h-[60px]" style={{ background: 'rgba(20,16,30,0.4)' }}>
          <Link href={
            isCustomCollection && collectionId 
              ? `/marketplace/collection/${(category === 'jerseys' ? 'jersey' : category) || 'jersey'}/${collectionId}`
              : `/marketplace/collection/${category || collection}/${collection}/${tokenId}`
          } prefetch={false} className="flex-shrink-0">
            <img src={imageUrl} alt={name} className="w-12 h-12 rounded-lg object-cover bg-[#222]" />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link href={
              isCustomCollection && collectionId 
                ? `/marketplace/collection/${(category === 'jerseys' ? 'jersey' : category) || 'jersey'}/${collectionId}`
                : `/marketplace/collection/${category || collection}/${collection}/${tokenId}`
            } prefetch={false} className="block">
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
                  {!isPriceValid && price !== 'Not for sale' && price !== 'N/A' && (
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Quick action button */}
          <div className="flex items-center gap-2">
            {renderQuickActions()}
            <DropdownMenu open={showActions} onOpenChange={setShowActions}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/60">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowActions(false)}>
                  View Details
                </DropdownMenuItem>
                {isOwner && !isListed && !isAuction && (
                  <>
                    <DropdownMenuItem onClick={() => { setShowCreateListing(true); setShowActions(false); }}>
                      List for Sale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setShowCreateAuction(true); setShowActions(false); }}>
                      Create Auction
                    </DropdownMenuItem>
                  </>
                )}
                {isOwner && isListed && (
                  <DropdownMenuItem onClick={() => { setShowUpdateListing(true); setShowActions(false); }}>
                    Update Price
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Modals */}
        {showCreateListing && assetContract && (
          <CreateListingModal
            isOpen={showCreateListing}
            onOpenChange={setShowCreateListing}
            nft={{
              assetContractAddress: assetContract,
              tokenId,
              name,
              imageUrl,
            }}
          />
        )}

        {showUpdateListing && listingId && (
          <UpdateListingModal
            isOpen={showUpdateListing}
            onOpenChange={setShowUpdateListing}
            listingId={listingId}
            currentPrice={price}
            nftName={name}
            tokenId={tokenId}
          />
        )}

        {showCreateAuction && assetContract && (
          <CreateAuctionModal
            isOpen={showCreateAuction}
            onOpenChange={setShowCreateAuction}
            nft={{
              assetContractAddress: assetContract,
              tokenId,
              name,
              imageUrl,
            }}
          />
        )}
      </>
    );
  }

  // Large e Medium views
  const isLargeView = viewType === 'large';
  const gridCols = isLargeView ? '' : 'h-16';
  const imageSize = isLargeView ? 'h-28' : 'h-16';
  const textSize = isLargeView ? 'text-base' : 'text-xs';
  const padding = isLargeView ? 'p-3' : 'p-2';

  return (
    <>
      <div className={`relative rounded-xl ${padding} flex flex-col items-center shadow-md`} style={{ background: 'rgba(20,16,30,0.4)' }}>
        <Link href={
          isCustomCollection && collectionId 
            ? `/marketplace/collection/${(category === 'jerseys' ? 'jersey' : category) || 'jersey'}/${collectionId}`
            : `/marketplace/collection/${category || collection}/${collection}/${tokenId}`
        } prefetch={false} className="w-full">
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

            {/* botão de like removido */}
          </div>
        </Link>
        
        {/* botão de like removido */}

        <Link href={
          isCustomCollection && collectionId 
            ? `/marketplace/collection/${(category === 'jerseys' ? 'jersey' : category) || 'jersey'}/${collectionId}`
            : `/marketplace/collection/${category || collection}/${collection}/${tokenId}`
        } prefetch={false} className="w-full">
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
              {!isPriceValid && price !== 'Not for sale' && price !== 'N/A' && (
                <AlertTriangle className="h-3 w-3 text-red-400" />
              )}
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
            {renderQuickActions() || (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-[#FF0052] text-white px-4 py-2 rounded-lg font-semibold w-full">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="center">
                  <div className="p-2">
                    {renderActionButtons()}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Modals - mesmos do compact view */}
      {showCreateListing && assetContract && (
        <CreateListingModal
          isOpen={showCreateListing}
          onOpenChange={setShowCreateListing}
          nft={{
            assetContractAddress: assetContract,
            tokenId,
            name,
            imageUrl,
          }}
        />
      )}

      {showUpdateListing && listingId && (
        <UpdateListingModal
          isOpen={showUpdateListing}
          onOpenChange={setShowUpdateListing}
          listingId={listingId}
          currentPrice={price}
          nftName={name}
          tokenId={tokenId}
        />
      )}

      {showCreateAuction && assetContract && (
        <CreateAuctionModal
          isOpen={showCreateAuction}
          onOpenChange={setShowCreateAuction}
          nft={{
            assetContractAddress: assetContract,
            tokenId,
            name,
            imageUrl,
          }}
        />
      )}
    </>
  );
}
