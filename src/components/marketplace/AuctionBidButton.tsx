'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { Gavel, Clock } from 'lucide-react';

interface AuctionBidButtonProps {
  auctionId: string;
  currentBid?: string;
  minimumBid: string;
  buyoutPrice?: string;
  endTime: Date;
  currency?: string;
  className?: string;
  disabled?: boolean;
}

export default function AuctionBidButton({
  auctionId,
  currentBid,
  minimumBid,
  buyoutPrice,
  endTime,
  currency = 'MATIC',
  className = '',
  disabled = false
}: AuctionBidButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Thirdweb v5 hooks
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  // Verificar se leilão expirou
  const isExpired = new Date() > endTime;
  
  // Calcular próximo lance mínimo (5% maior que o atual)
  const nextMinBid = currentBid 
    ? (parseFloat(currentBid.replace(/[^\d.]/g, '')) * 1.05).toFixed(3)
    : parseFloat(minimumBid.replace(/[^\d.]/g, '')).toFixed(3);

  const handleBid = async () => {
    if (!account || !chain) {
      toast.error('Please connect your wallet first.');
      return;
    }

    if (!bidAmount || isNaN(Number(bidAmount))) {
      toast.error('Please enter a valid bid amount.');
      return;
    }

    // 🔧 VALIDAÇÃO: Verificar se auctionId é válido
    if (!auctionId || auctionId === 'undefined' || auctionId === 'null' || auctionId === 'INVALID_AUCTION_ID') {
      console.error('❌ AuctionBidButton: auctionId inválido:', auctionId);
      toast.error('This auction has technical issues. Please contact support.');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    const minRequired = parseFloat(nextMinBid);

    if (bidValue < minRequired) {
      toast.error(`Bid must be at least ${nextMinBid} ${currency}`);
      return;
    }

    setIsProcessing(true);
    toast.info('Sending bid... Approve the transaction in your wallet.');

    try {
      // 🔍 DEBUG: Log do auctionId antes de enviar bid
      console.log('🔍 DEBUG AuctionBidButton - Starting bid process:', {
        auctionId,
        auctionIdType: typeof auctionId,
        auctionIdValue: auctionId,
        bidAmount,
        chainId: chain.id
      });

      console.log('✅ SENDING BID TO CONTRACT - Skipping expiration check...');

      // Validate bid amount against current bid
      if (!bidAmount || parseFloat(bidAmount) <= parseFloat(currentBid || '0')) {
        console.log('❌ BID VALIDATION FAILED:', {
          bidAmount,
          currentBid,
          parsedBid: parseFloat(bidAmount),
          parsedCurrent: parseFloat(currentBid || '0'),
          isTooLow: parseFloat(bidAmount) <= parseFloat(currentBid || '0')
        });
        toast.error('Bid too low. Must be higher than current bid.');
        return;
      }

      console.log('✅ BID VALIDATION PASSED - Sending transaction...');

      const result = await MarketplaceService.bidInAuction(
        account,
        chain.id,
        {
          auctionId,
          bidAmount,
        }
      );

      toast.success('Bid sent successfully! 🎉');
      console.log('✅ Bid sent:', result.transactionHash);
      
      setIsOpen(false);
      setBidAmount('');
      
      // Opcional: Recarregar dados do leilão
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error sending bid:', error);
      
      if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for the bid.');
      } else if (error.message.includes('auction ended')) {
        toast.error('This auction has already ended.');
      } else if (error.message.includes('bid too low')) {
        toast.error('Bid too low. Must be higher than current bid.');
      } else {
        toast.error(error.message || 'Error sending bid.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyout = async () => {
    if (!buyoutPrice || !account || !chain) return;

    setIsProcessing(true);
    toast.info('Buying immediately... Approve the transaction.');

    try {
      const result = await MarketplaceService.bidInAuction(
        account,
        chain.id,
        {
          auctionId,
          bidAmount: buyoutPrice.replace(/[^\d.]/g, ''),
        }
      );

      toast.success('Immediate purchase completed! 🎉');
      console.log('✅ Buyout completed:', result.transactionHash);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error in buyout:', error);
      toast.error(error.message || 'Error in immediate purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isConnected = !!account && !!chain;
  const canBid = isConnected && !isExpired && !disabled;

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Botão principal de lance */}
        <Button
          onClick={() => setIsOpen(true)}
          disabled={!canBid || isProcessing}
          className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Processing...
            </>
          ) : isExpired ? (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Auction Ended
            </>
          ) : !isConnected ? (
            <>
              <Gavel className="mr-2 h-4 w-4" />
              Connect to Bid
            </>
          ) : (
            <>
              <Gavel className="mr-2 h-4 w-4" />
              Bid
            </>
          )}
        </Button>

        {/* Botão de compra imediata (se disponível) */}
        {buyoutPrice && canBid && (
          <Button
            onClick={handleBuyout}
            disabled={isProcessing}
            variant="outline"
            className="w-full border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white"
          >
            Buy Now for {buyoutPrice}
          </Button>
        )}
      </div>

      {/* Modal de lance */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-secondary/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FDFDFD]">Make Bid</DialogTitle>
            <div className="text-sm text-[#FDFDFD]/70 space-y-1">
              {currentBid && <p>Current Bid: {currentBid}</p>}
              <p>Minimum Bid: {nextMinBid} {currency}</p>
              {buyoutPrice && <p>Buy Now: {buyoutPrice}</p>}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmount" className="text-[#FDFDFD]">
                Your Bid ({currency})
              </Label>
              <Input
                id="bidAmount"
                type="number"
                step="0.001"
                min={nextMinBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={nextMinBid}
                className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD] placeholder:text-[#FDFDFD]/50"
                disabled={isProcessing}
              />
              <p className="text-xs text-[#FDFDFD]/50">
                Must be at least {nextMinBid} {currency}
              </p>
            </div>
          </div>

          <DialogFooter className="space-y-2">
            <Button
              onClick={handleBid}
              disabled={isProcessing || !bidAmount || parseFloat(bidAmount) < parseFloat(nextMinBid)}
              className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
            >
              {isProcessing ? 'Sending Bid...' : 'Confirm Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 