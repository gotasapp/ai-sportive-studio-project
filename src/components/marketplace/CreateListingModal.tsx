'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { MarketplaceService } from '@/lib/services/marketplace-service';

interface NFT {
  assetContractAddress: string;
  tokenId: string;
  name?: string;
  imageUrl?: string;
}

interface CreateListingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  nft: NFT;
  onSuccess?: () => void;
}

export function CreateListingModal({ isOpen, onOpenChange, nft, onSuccess }: CreateListingModalProps) {
  const [price, setPrice] = useState('');
  const [minBid, setMinBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [listingType, setListingType] = useState<'direct' | 'auction'>('direct');
  const [isLoading, setIsLoading] = useState(false);
  
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  // Debug da rede atual
  console.log('🔍 DEBUG - Rede atual:', {
    chainId: chain?.id,
    chainName: chain?.name,
    isPolygonAmoy: chain?.id === 88888,
    isPolygonMainnet: chain?.id === 137,
    needsNetworkSwitch: chain?.id !== 88888,
    marketplaceNetwork: 'CHZ Mainnet (88888)',
    currentNetwork: `${chain?.name} (${chain?.id})`
  });

  const handleSubmit = async () => {
    // Check if on a supported network (CHZ Mainnet)
    const supportedChains = [88888]; // CHZ Mainnet
    
    // Force use of CHZ Mainnet where the marketplace is deployed
    if (chain?.id !== 88888) {
      toast.error(`Você está na ${chain?.name || 'rede desconhecida'}. O marketplace está deployado apenas no CHZ Mainnet. Por favor, troque para CHZ Mainnet (Chain ID: 88888) na sua carteira.`);
      return;
    }

    if (!account || !chain) {
      toast.error('Por favor, conecte sua carteira primeiro.');
      return;
    }

    if (listingType === 'direct') {
      await handleCreateDirectListing();
    } else {
      await handleCreateAuctionListing();
    }
  };

  const handleCreateDirectListing = async () => {
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }

    setIsLoading(true);
    toast.info('Creating direct listing... Approve the transaction in your wallet.');
    
    try {
      // 🔍 DEBUG: Detailed logs before creation
      console.log('🔍 DEBUG - Parâmetros da listagem:');
      console.log('📋 NFT Object:', nft);
      console.log('📋 Asset Contract:', nft.assetContractAddress);
      console.log('📋 Token ID:', nft.tokenId);
      console.log('📋 Chain ID:', chain!.id);
      console.log('📋 Account:', account!.address);
      console.log('📋 Price:', price);
      
      const result = await MarketplaceService.createDirectListing(
        account!,
        chain!.id,
        {
          assetContract: nft.assetContractAddress,
          tokenId: nft.tokenId,
          pricePerToken: price,
          quantity: '1',
        }
      );

      toast.success('NFT listed successfully! 🎉');
      console.log('✅ Listing created:', result.transactionHash);
      console.log('✅ Complete listing result:', result);
      onOpenChange(false);
      
      // Reset form
      setPrice('');
      
      // ✅ CHAMAR CALLBACK DE SUCESSO PARA ATUALIZAR DADOS
      if (onSuccess) {
        console.log('🔄 Chamando onSuccess callback...');
        setTimeout(() => {
          onSuccess();
        }, 2000); // Aguardar 2 segundos para a transação ser confirmada
      }
      
    } catch (error: any) {
      console.error('❌ Error creating listing:', error);
      toast.error(error.message || 'Error creating direct listing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAuctionListing = async () => {
    if (!minBid || isNaN(Number(minBid)) || Number(minBid) <= 0) {
      toast.error('Please enter a valid minimum bid.');
      return;
    }

    if (buyoutPrice && parseFloat(buyoutPrice) <= parseFloat(minBid)) {
      toast.error('Buyout price must be higher than minimum bid.');
      return;
    }

    setIsLoading(true);
    toast.info('Creating auction... Approve the transaction in your wallet.');
    
    try {
      const result = await MarketplaceService.createAuction(
        account!,
        chain!.id,
        {
          assetContract: nft.assetContractAddress,
          tokenId: nft.tokenId,
          quantity: '1',
          currency: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token (MATIC)
          minimumBidAmount: minBid,
          buyoutBidAmount: buyoutPrice || '0',
          timeBufferInSeconds: 300, // 5 minutes
          bidBufferBps: 500, // 5% bid buffer
          startTimestamp: Math.floor(Date.now() / 1000),
          endTimestamp: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days
        }
      );

      toast.success('Auction created successfully!');
      console.log('✅ Auction created:', result.transactionHash);
      onOpenChange(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error creating auction:', error);
      toast.error(error.message || 'Error creating auction.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (!account || !chain) return false;
    
    if (listingType === 'direct') {
      return price && !isNaN(Number(price)) && Number(price) > 0;
    } else {
      return minBid && !isNaN(Number(minBid)) && Number(minBid) > 0;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-secondary/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD]">List your NFT</DialogTitle>
          {nft.name && (
            <p className="text-sm text-[#FDFDFD]/70">
              {nft.name} - Token #{nft.tokenId}
            </p>
          )}
        </DialogHeader>
        
        <Tabs value={listingType} onValueChange={(value) => setListingType(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#333333]/20">
            <TabsTrigger value="direct" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">
              Direct Sale
            </TabsTrigger>
            <TabsTrigger value="auction" className="data-[state=active]:bg-[#FF0052] data-[state=active]:text-white">
              Auction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-[#FDFDFD]">
                Price per NFT ({chain?.nativeCurrency?.symbol || 'CHZ'})
              </Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.1"
                className="cyber-input"
              />
              <p className="text-xs text-[#FDFDFD]/50">
                Set the fixed price for direct sale of your NFT
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="auction" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="minBid" className="text-[#FDFDFD]">
                  Minimum Bid ({chain?.nativeCurrency?.symbol || 'CHZ'})
                </Label>
                <Input 
                  id="minBid" 
                  value={minBid} 
                  onChange={(e) => setMinBid(e.target.value)} 
                  className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD] placeholder:text-[#FDFDFD]/50" 
                  placeholder="0.1" 
                  disabled={isLoading}
                  type="number"
                  step="0.001"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyout" className="text-[#FDFDFD]">
                  Buyout Price (Optional)
                </Label>
                <Input 
                  id="buyout" 
                  value={buyoutPrice} 
                  onChange={(e) => setBuyoutPrice(e.target.value)} 
                  className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD] placeholder:text-[#FDFDFD]/50" 
                  placeholder="1.0" 
                  disabled={isLoading}
                  type="number"
                  step="0.001"
                  min="0"
                />
                <p className="text-xs text-[#FDFDFD]/50">
                  Price at which buyers can purchase immediately (must be higher than minimum bid)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={listingType === 'direct' ? handleCreateDirectListing : handleCreateAuctionListing}
          disabled={isLoading}
          className="w-full bg-[#FF0052] hover:bg-[#FF0052]/90 text-white"
        >
          {isLoading ? 'Processing...' : `Create ${listingType === 'direct' ? 'Listing' : 'Auction'}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
} 