'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { Gavel, Clock, DollarSign, Timer } from 'lucide-react';
import { convertIpfsToHttp, normalizeIpfsUri } from '@/lib/utils';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    assetContractAddress: string;
    tokenId: string;
    name: string;
    imageUrl: string;
  };
}

const CURRENCY_OPTIONS = [
  { value: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', label: 'MATIC (Polygon Amoy)', symbol: 'MATIC' },
  // Removendo USDC por enquanto até configurarmos o endereço correto
  // { value: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', label: 'USDC (Amoy)', symbol: 'USDC' },
];

const DURATION_PRESETS = [
  { value: '3600', label: '1 Hour' },
  { value: '21600', label: '6 Hours' },
  { value: '43200', label: '12 Hours' },
  { value: '86400', label: '1 Day' },
  { value: '259200', label: '3 Days' },
  { value: '604800', label: '7 Days' },
];

export function CreateAuctionModal({ isOpen, onOpenChange, nft }: CreateAuctionModalProps) {
  const [minimumBidAmount, setMinimumBidAmount] = useState('');
  const [buyoutBidAmount, setBuyoutBidAmount] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('86400'); // 1 day default
  const [currency, setCurrency] = useState('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
  const [startImmediately, setStartImmediately] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug log
  console.log('🏆 CreateAuctionModal RENDERED:', { isOpen, nft });

  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const selectedCurrency = CURRENCY_OPTIONS.find(c => c.value === currency);

  const validateForm = (): string | null => {
    if (!minimumBidAmount || parseFloat(minimumBidAmount) <= 0) {
      return 'Minimum bid amount is required and must be greater than 0';
    }

    if (buyoutBidAmount) {
      const minBid = parseFloat(minimumBidAmount);
      const buyoutBid = parseFloat(buyoutBidAmount);
      
      if (buyoutBid <= minBid) {
        return 'Buyout price must be higher than minimum bid';
      }
    }

    return null;
  };

  const handleCreateAuction = async () => {
    console.log('🚀 CREATE AUCTION FUNCTION CALLED!');
    
    if (!account || !chain) {
      console.log('❌ No account or chain:', { account: !!account, chain: !!chain });
      toast.error('Please connect your wallet first.');
      return;
    }

    console.log('✅ Account and chain OK:', { 
      account: account.address, 
      chainId: chain.id, 
      chainName: chain.name 
    });

    // Verificar se está na rede correta
    if (chain.id !== 80002) {
      console.log('❌ Wrong network:', { currentChainId: chain.id, expectedChainId: 80002 });
      toast.error(`You are on ${chain.name}. The marketplace is deployed only on Polygon Amoy Testnet. Please switch to Polygon Amoy (Chain ID: 80002) in your wallet.`);
      return;
    }

    console.log('✅ Network OK: Polygon Amoy');

    const validationError = validateForm();
    if (validationError) {
      console.log('❌ Validation error:', validationError);
      toast.error(validationError);
      return;
    }

    console.log('✅ Validation passed');

    setIsProcessing(true);
    toast.info('Creating auction... Please approve the transaction in your wallet.');

    try {
      console.log('🔄 Starting auction creation process...');
      
      // Calcular timestamps
      const now = Math.floor(Date.now() / 1000);
      const startTimestamp = startImmediately ? now : now + 300; // 5 min delay if not immediate
      const duration = parseInt(auctionDuration);
      const endTimestamp = startTimestamp + duration;

      // Converter valores para Wei (para MATIC)
      const minimumBidWei = (parseFloat(minimumBidAmount) * Math.pow(10, 18)).toString();
      const buyoutBidWei = buyoutBidAmount 
        ? (parseFloat(buyoutBidAmount) * Math.pow(10, 18)).toString()
        : '0'; // 0 = sem buyout

      console.log('🏆 Creating auction with parameters:', {
        assetContract: nft.assetContractAddress,
        tokenId: nft.tokenId,
        minimumBidAmount: minimumBidAmount,
        minimumBidWei,
        buyoutBidAmount: buyoutBidAmount,
        buyoutBidWei,
        currency: currency,
        duration: duration,
        startTimestamp,
        endTimestamp,
      });

      console.log('📞 Calling MarketplaceService.createAuction...');

      const result = await MarketplaceService.createAuction(
        account,
        chain.id,
        {
          assetContract: nft.assetContractAddress,
          tokenId: nft.tokenId,
          quantity: '1',
          currency: currency,
          minimumBidAmount: minimumBidWei,
          buyoutBidAmount: buyoutBidWei,
          timeBufferInSeconds: 300, // 5 minutes
          bidBufferBps: 500, // 5%
          startTimestamp,
          endTimestamp,
        }
      );

      console.log('✅ Auction creation successful:', result);
      toast.success('Auction created successfully! 🏆');
      console.log('✅ Auction created:', result.transactionHash);
      
      onOpenChange(false);
      
      // Recarregar página para mostrar o leilão
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error creating auction:', error);
      console.error('❌ Error details:', {
        message: error.message,
        reason: error.reason,
        code: error.code,
        stack: error.stack
      });
      
      if (error.message.includes('not approved')) {
        toast.error('Please approve the marketplace contract to transfer your NFT first.');
      } else if (error.message.includes('not owner')) {
        toast.error('You must be the owner of this NFT to create an auction.');
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds to pay for the transaction.');
      } else {
        toast.error(error.message || 'Failed to create auction. Please try again.');
      }
    } finally {
      console.log('🔄 Setting isProcessing to false');
      setIsProcessing(false);
    }
  };

  const isConnected = !!account && !!chain;
  const isFormValid = isConnected && minimumBidAmount && parseFloat(minimumBidAmount) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-secondary/20 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD] flex items-center gap-2">
            <Gavel className="h-5 w-5 text-[#A20131]" />
            Create Auction
          </DialogTitle>
          <p className="text-sm text-[#FDFDFD]/70">
            {nft.name} - Token #{nft.tokenId}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Preview */}
          <div className="bg-[#333333]/20 rounded-lg p-3 border border-[#FDFDFD]/10">
            <div className="flex items-center gap-3">
              <img
                src={normalizeIpfsUri(nft.imageUrl)}
                alt={nft.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover"
                onError={e => { e.currentTarget.src = '/fallback.jpg'; }}
              />
              <div>
                <h3 className="font-semibold text-[#FDFDFD] text-sm">{nft.name}</h3>
                <p className="text-xs text-[#FDFDFD]/70">Token ID: {nft.tokenId}</p>
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-[#FDFDFD]">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-[#333333] border-[#FDFDFD]/20">
                {CURRENCY_OPTIONS.map((currencyOption) => (
                  <SelectItem key={currencyOption.value} value={currencyOption.value} className="text-[#FDFDFD] hover:bg-[#A20131]">
                    {currencyOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Bid */}
          <div className="space-y-2">
            <Label htmlFor="minimumBid" className="text-[#FDFDFD]">
              Minimum Bid Amount ({selectedCurrency?.symbol})
            </Label>
            <Input
              id="minimumBid"
              type="number"
              step="0.001"
              placeholder="0.1"
              value={minimumBidAmount}
              onChange={(e) => setMinimumBidAmount(e.target.value)}
              className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD]"
            />
            <p className="text-xs text-[#FDFDFD]/60">The minimum amount required to place a bid</p>
          </div>

          {/* Buyout Price (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="buyoutBid" className="text-[#FDFDFD]">
              Buyout Price ({selectedCurrency?.symbol}) - Optional
            </Label>
            <Input
              id="buyoutBid"
              type="number"
              step="0.001"
              placeholder="1.0"
              value={buyoutBidAmount}
              onChange={(e) => setBuyoutBidAmount(e.target.value)}
              className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD]"
            />
            <p className="text-xs text-[#FDFDFD]/60">Set a price for instant purchase. Leave empty for bid-only auction.</p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-[#FDFDFD]">Auction Duration</Label>
            <Select value={auctionDuration} onValueChange={setAuctionDuration}>
              <SelectTrigger className="bg-[#333333]/20 border-[#FDFDFD]/20 text-[#FDFDFD]">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-[#333333] border-[#FDFDFD]/20">
                {DURATION_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value} className="text-[#FDFDFD] hover:bg-[#A20131]">
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="startImmediately"
                checked={startImmediately}
                onCheckedChange={setStartImmediately}
              />
              <Label htmlFor="startImmediately" className="text-[#FDFDFD]">
                Start auction immediately
              </Label>
            </div>
            <p className="text-xs text-[#FDFDFD]/60">
              {startImmediately 
                ? "Auction will start immediately after creation" 
                : "Auction will start in 5 minutes after creation"
              }
            </p>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
          >
            Cancel
          </Button>
          
          <Button
            onClick={() => {
              console.log('🎯 CREATE AUCTION BUTTON CLICKED INSIDE MODAL!');
              console.log('📋 Form state:', {
                minimumBidAmount,
                buyoutBidAmount,
                isFormValid,
                isProcessing,
                isConnected
              });
              handleCreateAuction();
            }}
            disabled={!isFormValid || isProcessing}
            className="bg-[#A20131] hover:bg-[#A20131]/90 text-white"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Creating...
              </>
            ) : !isConnected ? (
              'Connect Wallet'
            ) : (
              <>
                <Gavel className="mr-2 h-4 w-4" />
                Create Auction
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 