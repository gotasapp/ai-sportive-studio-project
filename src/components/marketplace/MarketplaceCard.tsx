'use client';

import Image from 'next/image';
import { Heart, MoreVertical, Tag, AlertTriangle } from 'lucide-react';
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

interface MarketplaceCardProps {
  name: string;
  imageUrl: string;
  price: string;
  collection: string;
  category?: 'jersey' | 'stadium' | 'badge' | string;
  // Informações do NFT para funcionalidades
  tokenId?: string;
  assetContract?: string;
  listingId?: string;
  isListed?: boolean;
  owner?: string;
  // Informações de leilão (se aplicável)
  isAuction?: boolean;
  auctionId?: string;
  currentBid?: string;
  endTime?: Date;
  // Informações de ofertas
  activeOffers?: number;
}

const categoryColors = {
    jersey: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    stadium: 'bg-green-500/20 text-green-400 border-green-500/50',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    default: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};

export default function MarketplaceCard({ 
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
  isAuction = false,
  auctionId,
  currentBid,
  endTime,
  activeOffers = 0
}: MarketplaceCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showUpdateListing, setShowUpdateListing] = useState(false);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  
  const account = useActiveAccount();
  const isOwner = account?.address?.toLowerCase() === owner?.toLowerCase();

  // 🔄 HOOK PARA DADOS DO LEILÃO EM TEMPO REAL
  const auctionData = useAuctionData({
    auctionId,
    isAuction,
    initialBid: currentBid || '1 MATIC',
    refreshInterval: 30 // atualizar a cada 30 segundos
  });

  // Usar bid em tempo real se disponível, senão usar o valor inicial
  const displayCurrentBid = isAuction 
    ? (auctionData.hasValidBid ? auctionData.currentBid : currentBid)
    : currentBid;
  
  // 🚨 SAFE PRICE VALIDATION
  const isPriceValid = price !== 'Not for sale' && price !== 'N/A' ? isValidPrice(price) : true;
  const safePrice = price !== 'Not for sale' && price !== 'N/A' && !isPriceValid ? 'Invalid price' : price;
  
  // 🔍 DEBUG: Logs detalhados para debug
  console.log('🔍 MarketplaceCard DEBUG:', {
    name,
    tokenId,
    assetContract,
    owner,
    accountAddress: account?.address,
    isOwner,
    isListed,
    isAuction,
    auctionId,
    endTime,
    currentBid,
    isAuctionEnded: endTime ? new Date() > endTime : false,
    showCreateListing,
    hasAssetContract: !!assetContract,
    shouldShowListButton: isOwner && !isListed && !isAuction,
    priceValidation: {
      originalPrice: price,
      safePrice,
      isPriceValid,
      shouldWarnUser: !isPriceValid && price !== 'Not for sale' && price !== 'N/A'
    }
  });
  
  // Debug price validation (only for invalid prices)
  if (!isPriceValid && price !== 'Not for sale' && price !== 'N/A') {
    console.log(`🔍 CARD DEBUG - INVALID PRICE - ${name}:`, {
      originalPrice: price,
      isPriceValid,
      safePrice,
      isListed,
      listingId
    });
  }
  
  // Debug price if necessary (removed to avoid BigInt conversion error)
  // if (price !== 'Not for sale' && price !== 'N/A') {
  //   debugPrice(price, `${name} Price`);
  // }
  
  const color = category ? categoryColors[category as keyof typeof categoryColors] || categoryColors.default : categoryColors.default;

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implementar funcionalidade de favoritos
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

  const renderActionButtons = () => {
    if (isListed && listingId) {
      // NFT está listado para venda direta
      if (isOwner) {
        // Botões para o dono da listagem
        return (
          <div className="space-y-2">
            <Button
              onClick={() => setShowUpdateListing(true)}
              className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
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
            />
          </div>
        );
      } else {
        // Botões para compradores
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
                className="w-full bg-red-500/20 text-red-400 cursor-not-allowed"
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
      // NFT está em leilão
      const isAuctionEnded = endTime ? new Date() > endTime : false;
      

      
      if (isOwner) {
        // Botões para o dono do leilão
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
        // Botões para compradores
        return (
          <div className="space-y-2">
            {!isAuctionEnded ? (
              <AuctionBidButton
                auctionId={auctionId}
                currentBid={displayCurrentBid || '0 MATIC'}
                minimumBid={currentBid || '0'}
                endTime={endTime}
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
      };
    } else {
      // NFT não está listado nem em leilão
      return (
        <div className="space-y-2">
          {isOwner ? (
            <>
              <Button
                onClick={handleListButtonClick}
                className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
              >
                <Tag className="mr-2 h-4 w-4" />
                List for Sale
              </Button>
              <Button
                onClick={() => {
                  console.log('🏆 CREATE AUCTION BUTTON CLICKED!');
                  console.log('🔍 Debug info:', {
                    assetContract,
                    tokenId,
                    name,
                    imageUrl,
                    hasAssetContract: !!assetContract,
                    showCreateAuction,
                    isOwner
                  });
                  setShowCreateAuction(true);
                }}
                variant="outline"
                className="w-full border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white"
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

  return (
    <>
      <div className="cyber-card rounded-xl overflow-hidden group transition-all hover:border-[#FDFDFD]/20 hover:shadow-lg hover:shadow-[#A20131]/10">
        <div className="relative aspect-square">
          <Image 
            src={imageUrl} 
            alt={name}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Header com categoria e ações */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className={`text-xs font-bold px-2 py-1 rounded-full border ${color}`}>
              {category?.toUpperCase()}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleToggleLike}
                className={`bg-black/50 p-2 rounded-full transition-colors ${
                  isLiked ? 'text-[#A20131]' : 'text-[#FDFDFD] hover:text-[#A20131]'
                }`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="bg-black/50 text-[#FDFDFD] hover:text-[#A20131] h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#333333] border-[#FDFDFD]/20">
                  <DropdownMenuItem className="text-[#FDFDFD] hover:bg-[#A20131]">
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[#FDFDFD] hover:bg-[#A20131]">
                    Share
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem className="text-[#FDFDFD] hover:bg-[#A20131]">
                      Edit Listing
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Status badges */}
          <div className="absolute bottom-3 left-3">
            {isListed && !isAuction && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/50">
                For Sale
              </span>
            )}
            {isAuction && (
              <span className={`text-xs px-2 py-1 rounded-full border ${
                endTime && new Date() > endTime 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/50'
              }`}>
                {endTime && new Date() > endTime ? '🏁 Ended' : '🏆 Live Auction'}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-[#FDFDFD]/70 truncate">{collection}</p>
          <h3 className="text-lg font-semibold text-[#FDFDFD] truncate my-1">{name}</h3>
          
          {/* Price information */}
          <div className="mb-3">
            {isAuction ? (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#FDFDFD]/70">Current Bid</p>
                  {auctionData.isLoading && (
                    <div className="animate-spin h-3 w-3 border border-[#A20131] border-t-transparent rounded-full"></div>
                  )}
                </div>
                <p className="text-sm font-medium text-[#A20131]">{displayCurrentBid || price}</p>
                {auctionData.lastUpdated && (
                  <p className="text-xs text-[#FDFDFD]/50">
                    Updated: {new Date(auctionData.lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#FDFDFD]/70">{isListed ? 'Price' : 'Last Price'}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${isPriceValid ? 'text-[#A20131]' : 'text-red-400'}`}>
                    {safePrice}
                  </p>
                  {!isPriceValid && price !== 'Not for sale' && price !== 'N/A' && (
                    <div title="Invalid price detected">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Active Offers Counter */}
            {activeOffers > 0 && (
              <div className="mt-1">
                <p className="text-xs text-[#A20131]">
                  {activeOffers} active offer{activeOffers !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          {renderActionButtons()}
        </div>
      </div>

      {/* Modal de criação de listagem */}
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

      {/* Modal de atualização de listagem */}
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

      {/* Modal de criação de leilão */}
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

      {/* Debug para modal de leilão */}
      {console.log('🔍 MODAL RENDER DEBUG:', {
        showCreateAuction,
        hasAssetContract: !!assetContract,
        shouldRenderModal: showCreateAuction && assetContract,
        assetContract,
        tokenId,
        name
      })}
    </>
  );
} 