'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { HandHeart } from 'lucide-react';

interface MakeOfferButtonProps {
  assetContract: string;
  tokenId: string;
  nftName?: string;
  className?: string;
  disabled?: boolean;
}

export default function MakeOfferButton({
  assetContract,
  tokenId,
  nftName,
  className = '',
  disabled = false
}: MakeOfferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Thirdweb v5 hooks
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  // Verificar se precisa de aprovação quando o valor muda
  useEffect(() => {
    const checkApproval = async () => {
      if (!account || !chain || !offerAmount || isNaN(Number(offerAmount))) {
        setNeedsApproval(false);
        return;
      }

      try {
        // Verificar se está usando token nativo (modo teste)
        const { getOfferCurrency, NATIVE_TOKEN_ADDRESS } = await import('@/lib/marketplace-config');
        const offerCurrency = getOfferCurrency(chain.id);
        
        if (offerCurrency === NATIVE_TOKEN_ADDRESS) {
          // Token nativo não precisa de aprovação
          setNeedsApproval(false);
          console.log('🪙 Usando token nativo - não precisa de aprovação');
          return;
        }

        const { isApproved } = await MarketplaceService.checkOfferTokenAllowance(
          account,
          chain.id,
          offerAmount
        );
        setNeedsApproval(!isApproved);
      } catch (error) {
        console.log('Erro ao verificar aprovação:', error);
        setNeedsApproval(false); // Assumir que não precisa de aprovação em caso de erro
      }
    };

    if (isOpen && offerAmount) {
      checkApproval();
    }
  }, [account, chain, offerAmount, isOpen]);

  const handleApproveToken = async () => {
    if (!account || !chain) {
      toast.error('Por favor, conecte sua carteira primeiro.');
      return;
    }

    setIsApproving(true);
    toast.info('Aprovando token... Aprove a transação na sua carteira.');

    try {
      await MarketplaceService.approveOfferToken(account, chain.id, offerAmount);
      toast.success('Token aprovado com sucesso! 🎉');
      setNeedsApproval(false);
    } catch (error: any) {
      console.error('❌ Erro ao aprovar token:', error);
      toast.error(error.message || 'Erro ao aprovar token.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!account || !chain) {
      toast.error('Por favor, conecte sua carteira primeiro.');
      return;
    }

    if (!offerAmount || isNaN(Number(offerAmount)) || Number(offerAmount) <= 0) {
      toast.error('Por favor, insira um valor válido para a oferta.');
      return;
    }

    // Verificar aprovação uma última vez
    try {
      const { getOfferCurrency, NATIVE_TOKEN_ADDRESS } = await import('@/lib/marketplace-config');
      const offerCurrency = getOfferCurrency(chain.id);
      
      if (offerCurrency === NATIVE_TOKEN_ADDRESS) {
        // Token nativo não precisa de aprovação
        setNeedsApproval(false);
        console.log('🪙 Usando token nativo - não precisa de aprovação');
      } else {
        const { isApproved } = await MarketplaceService.checkOfferTokenAllowance(
          account,
          chain.id,
          offerAmount
        );
        if (!isApproved) {
          toast.error('Token not approved. Please approve first before making the offer.');
          setNeedsApproval(true);
          return;
        }
      }
    } catch (error) {
      toast.error('Error checking token approval.');
      return;
    }

    const days = parseInt(expiryDays);
    if (days < 1 || days > 30) {
      toast.error('Offer duration must be between 1 and 30 days.');
      return;
    }

    setIsProcessing(true);
    toast.info('Creating offer... Please approve the transaction in your wallet.');

    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const result = await MarketplaceService.makeOffer(
        account,
        chain.id,
        {
          assetContract,
          tokenId,
          totalPrice: offerAmount,
          quantity: '1',
          expirationTimestamp: expirationDate,
        }
      );

      toast.success('Offer created successfully! 🎉');
      console.log('✅ Offer created:', result.transactionHash);
      console.log('✅ Complete offer result:', result);
      
      setIsOpen(false);
      setOfferAmount('');
      setExpiryDays('7');
      setNeedsApproval(false);
      
      // REMOVIDO: reload automático para poder ver os logs
      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);

    } catch (error: any) {
      console.error('❌ Error creating offer:', error);
      
      if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient balance to make the offer.');
      } else if (error.message.includes('offer exists')) {
        toast.error('You already have an active offer for this NFT.');
      } else {
        toast.error(error.message || 'Error creating offer.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isConnected = !!account && !!chain;
  const currency = chain?.nativeCurrency?.symbol || 'CHZ';

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!isConnected || disabled || isProcessing || isApproving}
        variant="outline"
        className={`${className} border-[#A20131] text-[#A20131] hover:bg-[#A20131] hover:text-white`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Processing...
          </>
        ) : isApproving ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Approving...
          </>
        ) : !isConnected ? (
          <>
            <HandHeart className="mr-2 h-4 w-4" />
            Connect to Offer
          </>
        ) : (
          <>
            <HandHeart className="mr-2 h-4 w-4" />
            Make Offer
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-secondary/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FDFDFD]">Make Offer</DialogTitle>
            {nftName && (
              <p className="text-sm text-[#FDFDFD]/70">
                {nftName} - Token #{tokenId}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="offerAmount" className="text-[#FDFDFD]">
                Offer Amount ({currency})
              </Label>
              <Input
                id="offerAmount"
                type="number"
                step="0.001"
                min="0"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="0.1"
                className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD] placeholder:text-[#FDFDFD]/50"
                disabled={isProcessing || isApproving}
              />
              <p className="text-xs text-[#FDFDFD]/50">
                The amount will be locked in your wallet until the offer is accepted or expires
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDays" className="text-[#FDFDFD]">
                Offer Duration
              </Label>
              <Select value={expiryDays} onValueChange={setExpiryDays} disabled={isProcessing || isApproving}>
                <SelectTrigger className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#333333] border-[#FDFDFD]/20">
                  <SelectItem value="1" className="text-[#FDFDFD] hover:bg-[#A20131]">1 day</SelectItem>
                  <SelectItem value="3" className="text-[#FDFDFD] hover:bg-[#A20131]">3 days</SelectItem>
                  <SelectItem value="7" className="text-[#FDFDFD] hover:bg-[#A20131]">7 days</SelectItem>
                  <SelectItem value="14" className="text-[#FDFDFD] hover:bg-[#A20131]">14 days</SelectItem>
                  <SelectItem value="30" className="text-[#FDFDFD] hover:bg-[#A20131]">30 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#FDFDFD]/50">
                After this period, the offer will automatically expire
              </p>
            </div>
          </div>

          <DialogFooter>
            <div className="w-full space-y-2">
              <div className="bg-[#333333]/20 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-[#FDFDFD]/70">Offer amount:</span>
                  <span className="text-[#FDFDFD]">{offerAmount || '0'} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FDFDFD]/70">Expires in:</span>
                  <span className="text-[#FDFDFD]">{expiryDays} days</span>
                </div>
                {needsApproval && (
                  <div className="flex justify-between text-sm text-yellow-400 mt-1">
                    <span>⚠️ Approval required</span>
                  </div>
                )}
              </div>
              
              {needsApproval ? (
                <Button
                  onClick={handleApproveToken}
                  disabled={isApproving || !offerAmount || parseFloat(offerAmount) <= 0}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isApproving ? 'Approving Token...' : 'Approve Token First'}
                </Button>
              ) : (
                <Button
                  onClick={handleMakeOffer}
                  disabled={isProcessing || !offerAmount || parseFloat(offerAmount) <= 0}
                  className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
                >
                  {isProcessing ? 'Creating Offer...' : 'Confirm Offer'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 