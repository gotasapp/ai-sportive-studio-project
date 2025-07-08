'use client';

import { useState } from 'react';
import { useActiveWalletConnectionStatus, useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { DirectListing } from '@/lib/services/marketplace-service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ListingControlsProps = {
  listing: DirectListing;
};

export default function ListingControls({ listing }: ListingControlsProps) {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const connectionStatus = useActiveWalletConnectionStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Para Marketplace V3, Direct Listings não são leilões
  const isAuction = false;
  
  const handleBuyNow = async () => {
    if (connectionStatus !== 'connected' || !account) {
      toast.error('Please connect your wallet first.');
      return;
    }

    setIsSubmitting(true);
    toast.info('Processing purchase... this would normally interact with the marketplace contract.');
    
    try {
      // TODO: Implementar compra usando thirdweb V5 SDK
      // await MarketplaceService.buyListing(chain.id, listing.listingId, account.address);
      console.log('Comprando listing:', listing.listingId);
      toast.success('Purchase completed successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to process purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Marketplace V3 Direct Listing (sem leilões)
  return (
    <div>
        <p className="text-secondary">Price</p>
        <p className="text-3xl font-bold mb-6">{Number(listing.pricePerToken) / Math.pow(10, 18)} {listing.currency === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 'ETH' : 'MATIC'}</p>
        <Button onClick={handleBuyNow} className="w-full bg-accent hover:bg-accent/80" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Buy Now'}
        </Button>
    </div>
  );
} 