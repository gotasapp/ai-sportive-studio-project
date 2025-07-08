'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { ShoppingCart } from 'lucide-react';

interface BuyNowButtonProps {
  listingId: string;
  price: string;
  quantity?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export default function BuyNowButton({ 
  listingId, 
  price, 
  quantity = '1',
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false 
}: BuyNowButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Thirdweb v5 hooks
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleBuy = async () => {
    if (!account || !chain) {
      toast.error('Please connect your wallet first.');
      return;
    }

    console.log('🛒 STARTING PURCHASE:');
    console.log('📋 Listing ID:', listingId);
    console.log('📋 Displayed Price:', price);
    console.log('📋 Quantity:', quantity);
    console.log('📋 Buyer:', account.address);
    console.log('📋 Network:', chain.name, '(', chain.id, ')');

    // 🚨 CRITICAL VALIDATION: Check if price is reasonable
    const displayedPriceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
    console.log('🔍 Parsed displayed price:', displayedPriceNum);
    
    if (isNaN(displayedPriceNum) || displayedPriceNum <= 0) {
      toast.error('Invalid price detected. Cannot proceed with purchase.');
      console.error('❌ INVALID PRICE:', price);
      return;
    }
    
    if (displayedPriceNum > 1000) {
      toast.error(`Suspicious price detected: ${displayedPriceNum} MATIC. Canceling purchase for safety.`);
      console.error('❌ ASTRONOMICAL PRICE DETECTED:', displayedPriceNum);
      return;
    }

    setIsProcessing(true);
    toast.info('Starting purchase... Please approve the transaction in your wallet.');
    
    try {
      // 🔍 BUSCAR DADOS REAIS DA LISTAGEM DO BLOCKCHAIN
      console.log('🔍 Fetching real listing data from blockchain...');
      const realListing = await MarketplaceService.getListing(chain.id, listingId);
      
      console.log('📋 Real listing data:', {
        listingId: realListing.listingId.toString(),
        pricePerToken: realListing.pricePerToken.toString(),
        currency: realListing.currency,
        quantity: realListing.quantity.toString(),
        status: realListing.status
      });
      
             // 🚨 CRITICAL VALIDATION: Check if blockchain data is valid
       const pricePerTokenWei = realListing.pricePerToken;
       const pricePerTokenEther = Number(pricePerTokenWei) / Math.pow(10, 18);
       
       console.log('🔍 BLOCKCHAIN PRICE VALIDATION:');
       console.log('📋 Price per token (wei):', pricePerTokenWei.toString());
       console.log('📋 Price per token (ether):', pricePerTokenEther);
       
       // Check if blockchain price is reasonable (maximum 100 MATIC)
       if (pricePerTokenEther > 100) {
         toast.error(`Suspicious blockchain price: ${pricePerTokenEther.toFixed(6)} MATIC. Canceling for safety.`);
         console.error('❌ ASTRONOMICAL BLOCKCHAIN PRICE:', pricePerTokenEther);
         return;
       }
       
       // Check if listing status is valid
       if (realListing.status !== 'CREATED') {
         toast.error('This listing is no longer available.');
         console.error('❌ LISTING WITH INVALID STATUS:', realListing.status);
         return;
       }
      
      // Calcular preço total baseado nos dados reais da listagem
      const totalQuantity = BigInt(quantity);
      const expectedTotalPrice = realListing.pricePerToken * totalQuantity;
      const expectedTotalPriceEther = Number(expectedTotalPrice) / Math.pow(10, 18);
      
      console.log('💰 PURCHASE CALCULATIONS (VALIDATED):');
      console.log('📋 Price per token (wei):', realListing.pricePerToken.toString());
      console.log('📋 Price per token (ether):', pricePerTokenEther.toFixed(6));
      console.log('📋 Total quantity:', totalQuantity.toString());
      console.log('📋 Expected total price (wei):', expectedTotalPrice.toString());
      console.log('📋 Expected total price (ether):', expectedTotalPriceEther.toFixed(6));
      
             // Final validation before transaction
       if (expectedTotalPriceEther > 100) {
         toast.error(`Total price too high: ${expectedTotalPriceEther.toFixed(6)} MATIC. Canceling for safety.`);
         console.error('❌ TOTAL PRICE TOO HIGH:', expectedTotalPriceEther);
         return;
       }

      const result = await MarketplaceService.buyFromListing(
        account,
        chain.id,
        {
          listingId,
          quantity,
          expectedTotalPrice: expectedTotalPrice.toString(),
        }
      );

      toast.success('Purchase completed successfully! 🎉');
      console.log('✅ PURCHASE COMPLETED SUCCESSFULLY!');
      console.log('📄 Transaction Hash:', result.transactionHash);
      console.log('🔗 View on explorer:', `https://amoy.polygonscan.com/tx/${result.transactionHash}`);
      
      // Optional: Reload page or update marketplace state
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ PURCHASE FAILED:', error);
      console.error('❌ Full error:', error.message);
      
      // More specific error messages
      if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient balance to complete the purchase.');
      } else if (error.message.includes('listing not found')) {
        toast.error('This NFT is no longer available.');
      } else if (error.message.includes('already sold')) {
        toast.error('This NFT has already been sold.');
      } else if (error.message.includes('price') || error.message.includes('Price')) {
        toast.error(error.message); // Invalid price messages
      } else {
        toast.error(error.message || 'An error occurred while trying to complete the purchase.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const finalIsLoading = isProcessing || disabled;
  const isConnected = !!account && !!chain;

  return (
    <Button
      onClick={handleBuy}
      disabled={finalIsLoading || !isConnected}
      className={`${className} ${
        variant === 'default' 
          ? 'bg-[#A20131] hover:bg-[#A20131]/90 text-white' 
          : variant === 'outline'
          ? 'border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white'
          : 'bg-[#333333]/20 hover:bg-[#333333]/30 text-[#FDFDFD]'
      }`}
      size={size}
    >
      {finalIsLoading ? (
        <>
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          Processing...
        </>
      ) : !isConnected ? (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Buy for {price}
        </>
      )}
    </Button>
  );
} 