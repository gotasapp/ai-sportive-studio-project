'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { X, AlertTriangle } from 'lucide-react';

interface CancelListingButtonProps {
  listingId: string;
  price: string;
  nftName?: string;
  tokenId?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CancelListingButton({ 
  listingId, 
  price, 
  nftName,
  tokenId,
  className = '',
  variant = 'outline',
  size = 'default'
}: CancelListingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleCancel = async () => {
    if (!account || !chain) {
      toast.error('Please connect your wallet first.');
      return;
    }

    // Verificar se está na rede correta
    if (chain.id !== 80002) {
      toast.error('Please switch to Polygon Amoy Testnet to cancel listings.');
      return;
    }

    setIsProcessing(true);
    toast.info('Canceling listing... Approve the transaction in your wallet.');
    
    try {
      console.log('❌ CANCELING LISTING:');
      console.log('📋 Listing ID:', listingId);
      console.log('📋 Price:', price);
      console.log('📋 Account:', account.address);
      console.log('📋 Chain:', chain.id);
      
      const result = await MarketplaceService.cancelListing(
        account,
        chain.id,
        listingId
      );

      toast.success('Listing canceled successfully! 🎉');
      console.log('✅ Listing canceled:', result.transactionHash);
      setIsOpen(false);
      
      // Reload page to see changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error canceling listing:', error);
      toast.error(error.message || 'Error canceling listing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isConnected = !!account && !!chain;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!isConnected}
        className={`${className} ${
          variant === 'destructive' 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : variant === 'outline'
            ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
            : 'bg-[#333333]/20 hover:bg-red-600 text-[#FDFDFD] hover:text-white'
        }`}
        size={size}
      >
        {!isConnected ? (
          <>
            <X className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        ) : (
          <>
            <X className="mr-2 h-4 w-4" />
            Cancel Listing
          </>
        )}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="bg-card border-secondary/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FDFDFD] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Listing
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#FDFDFD]/70">
              Are you sure you want to cancel this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            {nftName && (
              <div className="p-3 bg-[#333333]/20 rounded-lg">
                <p className="text-sm text-[#FDFDFD]">
                  <span className="text-[#FDFDFD]/70">NFT:</span> {nftName}
                  {tokenId && ` - Token #${tokenId}`}
                </p>
                <p className="text-sm text-[#FDFDFD]">
                  <span className="text-[#FDFDFD]/70">Current Price:</span> {price}
                </p>
                <p className="text-sm text-[#FDFDFD]">
                  <span className="text-[#FDFDFD]/70">Listing ID:</span> {listingId}
                </p>
              </div>
            )}
            
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                ⚠️ After canceling, your NFT will be removed from the marketplace and you&apos;ll need to create a new listing to sell it again.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isProcessing}
              className="border-secondary/30 text-[#FDFDFD] hover:bg-secondary/10"
            >
              Keep Listing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Canceling...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Yes, Cancel Listing
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 