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
}

export function CreateListingModal({ isOpen, onOpenChange, nft }: CreateListingModalProps) {
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
    isPolygonAmoy: chain?.id === 80002,
    needsNetworkSwitch: chain?.id !== 80002
  });

  const handleSubmit = async () => {
    // Verificar se está na rede correta
    if (chain?.id !== 80002) {
      toast.error('Por favor, troque para a rede Polygon Amoy (testnet) para listar NFTs.');
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
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast.error('Por favor, insira um preço válido.');
      return;
    }

    setIsLoading(true);
    toast.info('Criando listagem direta... Aprove a transação na sua carteira.');
    
    try {
      // 🔍 DEBUG: Logs detalhados antes da criação
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

      toast.success('NFT listado com sucesso! 🎉');
      console.log('✅ Listagem criada:', result.transactionHash);
      console.log('✅ Resultado completo da listagem:', result);
      onOpenChange(false);
      
      // Reset form
      setPrice('');
      
      // NOTA: Não recarregar automaticamente para ver logs
      
    } catch (error: any) {
      console.error('❌ Erro ao criar listagem:', error);
      toast.error(error.message || 'Erro ao criar listagem direta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAuctionListing = async () => {
    if (!minBid || isNaN(Number(minBid)) || Number(minBid) <= 0) {
      toast.error('Insira um lance mínimo válido.');
      return;
    }

    if (buyoutPrice && (isNaN(Number(buyoutPrice)) || Number(buyoutPrice) <= Number(minBid))) {
      toast.error('Preço de compra imediata deve ser maior que o lance mínimo.');
      return;
    }

    setIsLoading(true);
    toast.info('Criando leilão... Aprove a transação na sua carteira.');
    
    try {
      const result = await MarketplaceService.createAuction(
        account!,
        chain!.id,
        {
          assetContract: nft.assetContractAddress,
          tokenId: nft.tokenId,
          minimumBidAmount: minBid,
          buyoutBidAmount: buyoutPrice || undefined,
          quantity: '1',
          timeBufferInSeconds: 300, // 5 minutos
          bidBufferBps: 500, // 5%
        }
      );

      toast.success('Leilão criado com sucesso!');
      console.log('✅ Leilão criado:', result.transactionHash);
      onOpenChange(false);
      
      // Reset form
      setMinBid('');
      setBuyoutPrice('');
      
    } catch (error: any) {
      console.error('❌ Erro ao criar leilão:', error);
      toast.error(error.message || 'Erro ao criar leilão.');
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
          <DialogTitle className="text-[#FDFDFD]">Listar seu NFT</DialogTitle>
          {nft.name && (
            <p className="text-sm text-[#FDFDFD]/70">
              {nft.name} - Token #{nft.tokenId}
            </p>
          )}
        </DialogHeader>
        
        <Tabs value={listingType} onValueChange={(value) => setListingType(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#333333]/20">
            <TabsTrigger 
              value="direct" 
              className="data-[state=active]:bg-[#A20131] data-[state=active]:text-white text-[#FDFDFD]/70"
            >
              Venda Direta
            </TabsTrigger>
            <TabsTrigger 
              value="auction"
              className="data-[state=active]:bg-[#A20131] data-[state=active]:text-white text-[#FDFDFD]/70"
            >
              Leilão
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-[#FDFDFD]">
                  Preço por NFT ({chain?.nativeCurrency?.symbol || 'CHZ'})
                </Label>
                <Input 
                  id="price" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD] placeholder:text-[#FDFDFD]/50" 
                  placeholder="0.05" 
                  disabled={isLoading}
                  type="number"
                  step="0.001"
                  min="0"
                />
                <p className="text-xs text-[#FDFDFD]/50">
                  Defina o preço fixo para venda direta do seu NFT
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="auction" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="minBid" className="text-[#FDFDFD]">
                  Lance Mínimo ({chain?.nativeCurrency?.symbol || 'CHZ'})
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
                  Compra Imediata (Opcional)
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
                  Preço pelo qual compradores podem adquirir imediatamente (deve ser maior que o lance mínimo)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white" 
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? 'Processando...' : `Criar ${listingType === 'direct' ? 'Listagem' : 'Leilão'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 