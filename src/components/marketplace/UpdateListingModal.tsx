'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { updateListing } from 'thirdweb/extensions/marketplace';
import { getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { Edit3 } from 'lucide-react';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

const MARKETPLACE_CONTRACT_ADDRESS = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

interface UpdateListingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  listingId: string;
  currentPrice: string;
  nftName?: string;
  tokenId?: string;
}

export function UpdateListingModal({ 
  isOpen, 
  onOpenChange, 
  listingId, 
  currentPrice, 
  nftName,
  tokenId 
}: UpdateListingModalProps) {
  const [newPrice, setNewPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price.');
      return;
    }

    if (!account || !chain) {
      toast.error('Please connect your wallet first.');
      return;
    }

    // Verificar se está na rede correta
    if (chain.id !== 80002) {
      toast.error('Please switch to Polygon Amoy Testnet to update listings.');
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
      
      // 🔧 FIX: Usar função nativa updateListing do Thirdweb 
      console.log('🔄 USANDO FUNÇÃO NATIVA THIRDWEB updateListing...');
      
      const marketplaceContract = getContract({
        client,
        chain: chain,
        address: MARKETPLACE_CONTRACT_ADDRESS,
      });
      
      // Converter preço para Wei
      const priceInWei = (parseFloat(newPrice) * Math.pow(10, 18)).toString();
      
      console.log('📋 Parâmetros para updateListing:', {
        listingId: BigInt(listingId),
        pricePerTokenWei: priceInWei,
        newPriceEther: newPrice
      });
      
      const transaction = updateListing({
        contract: marketplaceContract,
        listingId: BigInt(listingId),
        pricePerTokenWei: priceInWei,
      });
      
      const result = await sendTransaction({
        transaction,
        account,
      });

      toast.success(`Price updated to ${newPrice} MATIC! 🎉`);
      console.log('✅ Listing updated:', result.transactionHash);
      onOpenChange(false);
      
      // Reset form
      setNewPrice('');
      
      // Reload page to see updated price
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error updating listing:', error);
      toast.error(error.message || 'Error updating listing price.');
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
              New Price ({chain?.nativeCurrency?.symbol || 'MATIC'})
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
                  {currentPrice} → {newPrice} {chain?.nativeCurrency?.symbol || 'MATIC'}
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
            disabled={isLoading || !priceChanged}
            className="bg-[#FF0052] hover:bg-[#FF0052]/90 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Updating...
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