'use client';

import { Button } from '@/components/ui/button';
import { BuyDirectListingButton } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { useActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});



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
  const chain = useActiveWalletChain();

  if (!chain) {
    return (
      <Button 
        disabled 
        className={`${className} bg-gray-500/20 text-gray-400`}
        size={size}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <BuyDirectListingButton
      contractAddress={process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '0x2403863b192b649448793dfbB6926Cdd0d7A14Ad'}
      chain={chain}
      client={client}
      listingId={BigInt(listingId)}
      quantity={BigInt(quantity)}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        display: 'contents'
      }}
      onTransactionSent={(result) => {
        console.log('🚀 Transaction sent:', result.transactionHash);
        toast.info('Purchase transaction sent! Waiting for confirmation...');
      }}
      onTransactionConfirmed={(result) => {
        console.log('✅ Transaction confirmed:', result.transactionHash);
        toast.success('Purchase completed successfully! 🎉');
        console.log('🔗 View on explorer:', `https://scan.chiliz.com/tx/${result.transactionHash}`);
        
        // Reload page to see updated ownership
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }}
      onError={(error) => {
        console.error('❌ Purchase failed:', error);
        
        // More specific error messages
        if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient balance to complete the purchase.');
        } else if (error.message.includes('listing not found')) {
          toast.error('This NFT is no longer available.');
        } else if (error.message.includes('already sold')) {
          toast.error('This NFT has already been sold.');
        } else {
          toast.error(error.message || 'An error occurred while trying to complete the purchase.');
        }
      }}
    >
      <Button
        className={`${className} ${
          variant === 'default' 
            ? 'bg-[#FF0052] hover:bg-[#FF0052]/90 text-white' 
            : variant === 'outline'
            ? 'border-[#FF0052] text-[#FF0052] hover:bg-[#FF0052] hover:text-white'
            : 'bg-[#333333]/20 hover:bg-[#333333]/30 text-[#FDFDFD]'
        }`}
        size={size}
        disabled={disabled}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Buy for {price}
      </Button>
    </BuyDirectListingButton>
  );
} 