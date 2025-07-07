'use client';

import Image from 'next/image';
import { Heart, MoreVertical, Tag } from 'lucide-react';
import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BuyNowButton from './BuyNowButton';
import MakeOfferButton from './MakeOfferButton';
import { CreateListingModal } from './CreateListingModal';

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
  endTime
}: MarketplaceCardProps) {
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const account = useActiveAccount();
  const isOwner = account?.address?.toLowerCase() === owner?.toLowerCase();
  
  // 🔍 DEBUG: Logs detalhados para debug
  console.log('🔍 MarketplaceCard DEBUG:', {
    name,
    tokenId,
    assetContract,
    owner,
    accountAddress: account?.address,
    isOwner,
    isListed,
    showCreateListing,
    hasAssetContract: !!assetContract,
    shouldShowListButton: isOwner && !isListed && !isAuction
  });
  
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
      return (
        <div className="space-y-2">
          <BuyNowButton
            listingId={listingId}
            price={price}
            className="w-full"
          />
          {!isOwner && assetContract && (
            <MakeOfferButton
              assetContract={assetContract}
              tokenId={tokenId}
              nftName={name}
              className="w-full"
            />
          )}
        </div>
      );
    } else if (isAuction && auctionId && endTime) {
      // NFT está em leilão
      return (
        <div className="space-y-2">
          {/* TODO: Implementar AuctionBidButton quando necessário */}
          <Button className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white">
            {new Date() > endTime ? 'Auction Ended' : 'View Auction'}
          </Button>
        </div>
      );
    } else {
      // NFT não está listado
      return (
        <div className="space-y-2">
          {isOwner ? (
            <Button
              onClick={handleListButtonClick}
              className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
            >
              <Tag className="mr-2 h-4 w-4" />
              List for Sale
            </Button>
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
            {isListed && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/50">
                For Sale
              </span>
            )}
            {isAuction && endTime && (
              <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full border border-orange-500/50">
                {new Date() > endTime ? 'Ended' : 'Auction'}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm text-[#FDFDFD]/70 truncate">{collection}</p>
          <h3 className="text-lg font-semibold text-[#FDFDFD] truncate my-1">{name}</h3>
          
          {/* Price information */}
          <div className="mb-3">
            {isAuction && currentBid ? (
              <div>
                <p className="text-xs text-[#FDFDFD]/70">Current Bid</p>
                <p className="text-sm font-medium text-[#A20131]">{currentBid}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#FDFDFD]/70">{isListed ? 'Price' : 'Last Price'}</p>
                <p className="text-sm font-medium text-[#A20131]">{price}</p>
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
    </>
  );
} 