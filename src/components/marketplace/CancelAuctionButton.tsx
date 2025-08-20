'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { MarketplaceService } from '@/lib/services/marketplace-service';

interface CancelAuctionButtonProps {
  auctionId: string;
  nftName: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CancelAuctionButton({
  auctionId,
  nftName,
  onSuccess,
  className = '',
  variant = 'destructive'
}: CancelAuctionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleCancelAuction = async () => {
    if (!account || !chain) {
      toast.error('Please connect your wallet first.');
      return;
    }

    // Check if on correct network
    if (chain.id !== 80002) {
      toast.error('Please switch to Polygon Amoy Testnet to cancel auctions.');
      return;
    }

    setIsLoading(true);
    toast.info('Canceling auction... Approve the transaction in your wallet.');
    
    try {
      console.log('❌ CANCELING AUCTION:');
      console.log('📋 Auction ID:', auctionId);
      console.log('📋 Account:', account.address);
      console.log('📋 Chain:', chain.id);
      
      const result = await MarketplaceService.cancelAuction(
        account,
        chain.id,
        auctionId
      );

      toast.success('Auction canceled successfully! 🎉');
      console.log('✅ Auction canceled:', result.transactionHash);
      
      // ✅ CHAMAR CALLBACK DE SUCESSO EM VEZ DE RELOAD
      if (onSuccess) {
        console.log('🔄 Chamando onSuccess callback...');
        onSuccess();
      }

    } catch (error: any) {
      console.error('❌ Error canceling auction:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to cancel auction';
      if (error?.reason) {
        errorMessage = error.reason;
      } else if (error?.message) {
        if (error.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fee';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCancelAuction}
      disabled={isLoading || !account}
      variant={variant}
      className={`${className} ${isLoading ? 'opacity-50' : ''}`}
      title={`Cancelar leilão do ${nftName}`}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isLoading ? 'Cancelando...' : 'Cancel Auction'}
    </Button>
  );
}