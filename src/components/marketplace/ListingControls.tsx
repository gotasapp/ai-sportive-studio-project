'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddress, useMakeBid, useBuyNow, useWinningBid } from '@thirdweb-dev/react';
import { Listing, MarketplaceV3, EnglishAuction } from '@thirdweb-dev/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type ListingControlsProps = {
  listing: Listing | EnglishAuction;
  marketplaceContract: MarketplaceV3;
};

type BidFormData = {
  bidAmount: string;
};

export default function ListingControls({ listing, marketplaceContract }: ListingControlsProps) {
  const address = useAddress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<BidFormData>();

  const isAuction = listing.type === 1;

  // Hooks específicos
  const { data: winningBid, isLoading: isLoadingWinningBid } = useWinningBid(marketplaceContract, isAuction ? listing.id : undefined);
  const { mutateAsync: makeBid } = useMakeBid(marketplaceContract);
  const { mutateAsync: buyNow } = useBuyNow(marketplaceContract);
  
  const handleBuyNow = async () => {
    setIsSubmitting(true);
    toast.info('Processing purchase... approve the transaction.');
    try {
      await buyNow({
        id: listing.id,
        buyAmount: 1,
        type: isAuction ? 'auction' : 'direct',
      });
      toast.success('Purchase completed successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to process purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onBidSubmit = async (data: BidFormData) => {
    if (!isAuction) return;

    setIsSubmitting(true);
    toast.info('Submitting your bid... approve the transaction.');
    try {
      await makeBid({
        listingId: listing.id,
        bid: data.bidAmount,
      });
      toast.success('Bid placed successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to place bid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuction) {
    const auction = listing as EnglishAuction;
    return (
      <div>
        <div className="mb-4">
          <p className="text-secondary">Highest Bid:</p>
          <p className="text-2xl font-bold">
             {isLoadingWinningBid ? 'Loading...' : `${winningBid?.bidAmount ?? 'No bids'} ${winningBid?.currencyValue.symbol ?? ''}`}
          </p>
        </div>

        <form onSubmit={handleSubmit(onBidSubmit)} className="space-y-4">
          <Input 
            {...register('bidAmount', { required: 'Bid amount is required' })}
            placeholder={`Minimum bid of ${auction.minimumBidValue.displayValue} ${auction.minimumBidValue.symbol}`}
            disabled={isSubmitting}
          />
          {errors.bidAmount && <p className="text-red-500 text-sm">{errors.bidAmount.message}</p>}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Place Bid'}
          </Button>
        </form>

        {auction.buyoutBidCount.toString() !== '0' && (
          <>
            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
            <Button onClick={handleBuyNow} className="w-full bg-accent hover:bg-accent/80" disabled={isSubmitting}>
              Buy Now for {auction.buyoutCurrencyValue.displayValue} {auction.buyoutCurrencyValue.symbol}
            </Button>
          </>
        )}
      </div>
    );
  }

  // Direct Sale
  return (
    <div>
        <p className="text-secondary">Price</p>
        <p className="text-3xl font-bold mb-6">{listing.pricePerToken.toString()} {listing.currencyValuePerToken.symbol}</p>
        <Button onClick={handleBuyNow} className="w-full bg-accent hover:bg-accent/80" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Buy Now'}
        </Button>
    </div>
  );
} 