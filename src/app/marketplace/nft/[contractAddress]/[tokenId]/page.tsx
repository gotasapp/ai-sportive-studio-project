'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, Eye, Heart, Share2, ExternalLink, User, Calendar } from 'lucide-react';
import BuyNowButton from '@/components/marketplace/BuyNowButton';
import MakeOfferButton from '@/components/marketplace/MakeOfferButton';
import AuctionBidButton from '@/components/marketplace/AuctionBidButton';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import Header from '@/components/Header';
import { toast } from 'sonner';

interface NFTDetails {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tokenId: string;
  contractAddress: string;
  owner: string;
  creator: string;
  category: 'jersey' | 'stadium' | 'badge';
  attributes: Array<{ trait_type: string; value: string }>;
  createdAt: string;
  // Marketplace data
  isListed: boolean;
  listingId?: string;
  price?: string;
  currency?: string;
  // Auction data
  isAuction: boolean;
  auctionId?: string;
  currentBid?: string;
  minimumBid?: string;
  buyoutPrice?: string;
  auctionEndTime?: string;
  // Stats
  views: number;
  likes: number;
  offers: number;
}

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const contractAddress = params.contractAddress as string;
  const tokenId = params.tokenId as string;

  const [nft, setNft] = useState<NFTDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const loadNFTDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Implementar chamada real para API que busca dados do NFT + marketplace
      // Por enquanto, dados mock para demonstração
      const mockNFT: NFTDetails = {
        id: `${contractAddress}-${tokenId}`,
        name: `Jersey #${tokenId}`,
        description: 'Um jersey único gerado por IA com design exclusivo e características especiais para verdadeiros fãs de esporte.',
        imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png',
        tokenId,
        contractAddress,
        owner: '0x1234567890123456789012345678901234567890',
        creator: '0x1234567890123456789012345678901234567890',
        category: 'jersey',
        attributes: [
          { trait_type: 'Team', value: 'Corinthians' },
          { trait_type: 'Player', value: 'Jeff' },
          { trait_type: 'Number', value: '10' },
          { trait_type: 'Style', value: 'Home' },
          { trait_type: 'Rarity', value: 'Epic' },
        ],
        createdAt: '2024-01-15T10:00:00Z',
        isListed: true,
        listingId: '1',
        price: '0.2 CHZ',
        currency: 'CHZ',
        isAuction: false,
        views: 142,
        likes: 28,
        offers: 3,
      };

      setNft(mockNFT);
    } catch (error: any) {
      console.error('Error loading NFT details:', error);
      setError('Error loading NFT details');
    } finally {
      setLoading(false);
    }
  }, [contractAddress, tokenId]);

  useEffect(() => {
    loadNFTDetails();
  }, [loadNFTDetails]);

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: nft?.name,
          text: nft?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para cópia do link
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implementar API de likes
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const isOwner = account?.address?.toLowerCase() === nft?.owner?.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-[#FF0052] border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#FDFDFD] mb-4">NFT not found</h1>
            <p className="text-[#FDFDFD]/70 mb-6">{error}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho com navegação */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={handleBack} variant="ghost" size="icon" className="text-[#FDFDFD]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#FDFDFD]">{nft.name}</h1>
            <p className="text-[#FDFDFD]/70">Token #{nft.tokenId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleToggleLike} variant="ghost" size="icon" className="text-[#FDFDFD]">
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-[#FF0052] text-[#FF0052]' : ''}`} />
            </Button>
            <Button onClick={handleShare} variant="ghost" size="icon" className="text-[#FDFDFD]">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Imagem do NFT */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-[#333333]/20 rounded-xl overflow-hidden border border-[#FDFDFD]/10 max-w-md mx-auto lg:mx-0">
              <Image
                src={nft.imageUrl}
                alt={nft.name}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
              />
              
              {/* Badge de categoria */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-[#FF0052] text-white">
                  {nft.category.toUpperCase()}
                </Badge>
              </div>

              {/* Status de listagem */}
              {nft.isListed && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    For Sale
                  </Badge>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-[#FDFDFD]/70">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{nft.views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>{nft.likes} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{nft.offers} offers</span>
              </div>
            </div>
          </div>

          {/* Detalhes e ações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações de preço */}
            {nft.isListed && (
              <div className="cyber-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-[#FDFDFD]/70">Current Price</p>
                    <p className="text-3xl font-bold text-[#FF0052]">{nft.price}</p>
                  </div>
                  {nft.isAuction && nft.auctionEndTime && (
                    <div className="text-right">
                      <p className="text-sm text-[#FDFDFD]/70">Ends in</p>
                      <div className="flex items-center gap-1 text-orange-400">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">2h 45m</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="space-y-3">
                  {nft.isListed && nft.listingId ? (
                    <BuyNowButton
                      listingId={nft.listingId}
                      price={nft.price || '0 CHZ'}
                      className="w-full"
                    />
                  ) : nft.isAuction && nft.auctionId && nft.auctionEndTime ? (
                    <AuctionBidButton
                      auctionId={nft.auctionId}
                      currentBid={nft.currentBid}
                      minimumBid={nft.minimumBid || '0.1 CHZ'}
                      buyoutPrice={nft.buyoutPrice}
                      endTime={new Date(nft.auctionEndTime)}
                      className="w-full"
                    />
                  ) : isOwner ? (
                    <Button
                      onClick={() => setShowCreateListing(true)}
                      className="w-full bg-[#FF0052] hover:bg-[#FF0052]/90"
                    >
                      List for Sale
                    </Button>
                  ) : null}

                  {!isOwner && (
                    <MakeOfferButton
                      assetContract={nft.contractAddress}
                      tokenId={nft.tokenId}
                      nftName={nft.name}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div className="cyber-card p-6">
              <h3 className="text-lg font-semibold text-[#FDFDFD] mb-3">Description</h3>
              <p className="text-[#FDFDFD]/70 leading-relaxed">{nft.description}</p>
            </div>

            {/* Atributos */}
            <div className="cyber-card p-6">
              <h3 className="text-lg font-semibold text-[#FDFDFD] mb-4">Attributes</h3>
              <div className="grid grid-cols-2 gap-3">
                {nft.attributes.map((attr, index) => (
                  <div key={index} className="bg-[#333333]/20 p-3 rounded-lg border border-[#FDFDFD]/10">
                    <p className="text-xs text-[#FDFDFD]/70 uppercase tracking-wide">{attr.trait_type}</p>
                    <p className="text-[#FDFDFD] font-semibold">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhes do token */}
            <div className="cyber-card p-6">
              <h3 className="text-lg font-semibold text-[#FDFDFD] mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#FDFDFD]/70">Contract</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[#FDFDFD]">
                      {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-[#FDFDFD]/10" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[#FDFDFD]/70">Owner</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[#FDFDFD]">
                      {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <User className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-[#FDFDFD]/10" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[#FDFDFD]/70">Created</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#FDFDFD]/70" />
                    <span className="text-sm text-[#FDFDFD]">
                      {new Date(nft.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de criação de listagem */}
      {showCreateListing && (
        <CreateListingModal
          isOpen={showCreateListing}
          onOpenChange={setShowCreateListing}
          nft={{
            assetContractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            name: nft.name,
            imageUrl: nft.imageUrl,
          }}
        />
      )}
    </div>
  );
} 