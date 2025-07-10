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

const MARKETPLACE_CONTRACT_ADDRESS = '0x723436a84d57150A5109eFC540B2f0b2359Ac76d';

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
      contractAddress={MARKETPLACE_CONTRACT_ADDRESS}
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
        console.log('🔗 View on explorer:', `https://amoy.polygonscan.com/tx/${result.transactionHash}`);
        
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
            ? 'bg-[#A20131] hover:bg-[#A20131]/90 text-white' 
            : variant === 'outline'
            ? 'border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white'
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