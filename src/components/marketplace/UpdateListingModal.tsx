'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActiveAccount, useActiveWalletChain, useSendTransaction } from 'thirdweb/react';
import { toast } from 'sonner';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { Edit3 } from 'lucide-react';
import { ACTIVE_CHAIN_ID, NETWORK_NAME, ACTIVE_CONTRACTS } from '@/lib/network-config';
import { clearThirdwebCache } from '@/lib/thirdweb-production-fix';

interface UpdateListingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  listingId: string;
  currentPrice: string;
  nftName?: string;
  tokenId?: string;
  onSuccess?: () => void;
}

export function UpdateListingModal({ 
  isOpen, 
  onOpenChange, 
  listingId, 
  currentPrice, 
  nftName,
  tokenId,
  onSuccess
}: UpdateListingModalProps) {
  const [newPrice, setNewPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }

    if (!account || !chain) {
      toast.error('Please connect your wallet first.');
      return;
    }

    // Check if on correct network using dynamic configuration
    if (chain.id !== ACTIVE_CHAIN_ID) {
      toast.error(`Please switch to ${NETWORK_NAME} to update listings.`);
      return;
    }

    setIsLoading(true);
    toast.info('Updating listing price... Approve the transaction in your wallet.');
    
    try {
      console.log('🔄 UPDATING LISTING:');
      console.log('📋 Listing ID:', listingId);
      console.log('📋 Current Price:', currentPrice);
      console.log('📋 New Price:', newPrice);
      console.log('📋 Account:', account.address);
      console.log('📋 Chain:', chain.id);
      
      // ✅ CORRETO: Usar MarketplaceService.updateListing
      console.log('🔄 USANDO MARKETPLACE SERVICE updateListing...');
      
      // Preparar a transação usando MarketplaceService
      const transaction = await MarketplaceService.prepareUpdateListingTransaction(account, chain.id, {
        listingId: listingId,
        newPricePerToken: newPrice
      });

      // Usar o hook useSendTransaction para enviar a transação
      sendTransaction(transaction, {
        onSuccess: async (result) => {
          console.log('✅ Listing updated successfully:', result.transactionHash);
          toast.success(`Price updated to ${newPrice} ${chain.nativeCurrency?.symbol || 'CHZ'}! 🎉`);
          
          // 🧹 LIMPAR CACHE DO THIRDWEB PARA FORÇAR ATUALIZAÇÃO
          clearThirdwebCache();
          
          // 🔄 SINCRONIZAR DADOS APÓS ATUALIZAÇÃO (usando API existente)
          try {
            console.log('🔄 Sincronizando dados após atualização...');
            const syncResponse = await fetch('/api/marketplace/sync-after-listing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionHash: result.transactionHash,
                tokenId: tokenId || '0',
                assetContract: ACTIVE_CONTRACTS.nftDrop,
                userWallet: account.address,
                listingId: listingId,
                pricePerToken: newPrice
              })
            });
            
            if (syncResponse.ok) {
              console.log('✅ Dados sincronizados com sucesso');
            } else {
              console.warn('⚠️ Falha na sincronização, mas listing foi atualizada');
            }
          } catch (syncError) {
            console.warn('⚠️ Erro na sincronização:', syncError);
          }
          
          onOpenChange(false);
          
          // Reset form
          setNewPrice('');
          
          // ✅ CHAMAR CALLBACK DE SUCESSO EM VEZ DE RELOAD
          if (onSuccess) {
            console.log('🔄 Chamando onSuccess callback...');
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        },
        onError: (error) => {
          console.error('❌ Error updating listing:', error);
          
          // Tratamento de erro mais específico
          if (error.message.includes('insufficient funds')) {
            toast.error('Insufficient balance to update listing.');
          } else if (error.message.includes('not owner')) {
            toast.error('You are not the owner of this listing.');
          } else if (error.message.includes('listing not found')) {
            toast.error('Listing not found or already sold.');
          } else {
            toast.error(error.message || 'Error updating listing price.');
          }
        }
      });

    } catch (error: any) {
      console.error('❌ Error preparing transaction:', error);
      toast.error(error.message || 'Error preparing transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  // Extrair apenas números do currentPrice (remover "MATIC", etc)
  const currentPriceNumeric = currentPrice ? parseFloat(currentPrice.replace(/[^0-9.]/g, '')) : 0;
  const priceChanged = newPrice && parseFloat(newPrice) !== currentPriceNumeric;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-secondary/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD] flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Update Listing Price
          </DialogTitle>
          {nftName && (
            <p className="text-sm text-[#FDFDFD]/70">
              {nftName} {tokenId && `- Token #${tokenId}`}
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPrice" className="text-[#FDFDFD]/70">
              Current Price
            </Label>
            <div className="cyber-input bg-[#333333]/10 text-[#FDFDFD]/50 cursor-not-allowed">
              {currentPrice}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPrice" className="text-[#FDFDFD]">
              New Price ({chain?.nativeCurrency?.symbol || 'CHZ'})
            </Label>
            <Input
              id="newPrice"
              type="number"
              step="0.001"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.1"
              className="cyber-input"
              disabled={isLoading}
            />
            <p className="text-xs text-[#FDFDFD]/50">
              Enter the new price for your NFT listing
            </p>
          </div>

          {newPrice && (
            <div className="p-3 bg-[#FF0052]/10 border border-[#FF0052]/30 rounded-lg">
              <p className="text-sm text-[#FDFDFD]">
                <span className="text-[#FDFDFD]/70">Price change:</span>{' '}
                <span className="font-medium">
                  {currentPrice} → {newPrice} {chain?.nativeCurrency?.symbol || 'CHZ'}
                </span>
              </p>
              {priceChanged && (
                <p className="text-xs text-[#FDFDFD]/70 mt-1">
                  {parseFloat(newPrice) > parseFloat(currentPrice.replace(/[^0-9.]/g, '')) 
                    ? '📈 Price increase' 
                    : '📉 Price decrease'
                  }
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-secondary/30 text-[#FDFDFD] hover:bg-secondary/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePrice}
            disabled={isLoading || isPending || !priceChanged}
            className="bg-[#FF0052] hover:bg-[#FF0052]/90 text-white"
          >
            {isLoading || isPending ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                {isPending ? 'Waiting for wallet...' : 'Updating...'}
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Update Price
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 