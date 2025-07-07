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
  currency = 'CHZ',
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
      toast.error('Por favor, conecte sua carteira primeiro.');
      return;
    }

    if (!bidAmount || isNaN(Number(bidAmount))) {
      toast.error('Por favor, insira um valor válido para o lance.');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    const minRequired = parseFloat(nextMinBid);

    if (bidValue < minRequired) {
      toast.error(`Lance deve ser pelo menos ${nextMinBid} ${currency}`);
      return;
    }

    setIsProcessing(true);
    toast.info('Enviando lance... Aprove a transação na sua carteira.');

    try {
      const result = await MarketplaceService.bidInAuction(
        account,
        chain.id,
        {
          auctionId,
          bidAmount,
        }
      );

      toast.success('Lance enviado com sucesso! 🎉');
      console.log('✅ Lance enviado:', result.transactionHash);
      
      setIsOpen(false);
      setBidAmount('');
      
      // Opcional: Recarregar dados do leilão
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro ao enviar lance:', error);
      
      if (error.message.includes('insufficient funds')) {
        toast.error('Saldo insuficiente para o lance.');
      } else if (error.message.includes('auction ended')) {
        toast.error('Este leilão já terminou.');
      } else if (error.message.includes('bid too low')) {
        toast.error('Lance muito baixo. Deve ser maior que o lance atual.');
      } else {
        toast.error(error.message || 'Erro ao enviar lance.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyout = async () => {
    if (!buyoutPrice || !account || !chain) return;

    setIsProcessing(true);
    toast.info('Comprando imediatamente... Aprove a transação.');

    try {
      const result = await MarketplaceService.bidInAuction(
        account,
        chain.id,
        {
          auctionId,
          bidAmount: buyoutPrice.replace(/[^\d.]/g, ''),
        }
      );

      toast.success('Compra imediata realizada! 🎉');
      console.log('✅ Buyout realizado:', result.transactionHash);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro no buyout:', error);
      toast.error(error.message || 'Erro na compra imediata.');
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
              Processando...
            </>
          ) : isExpired ? (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Leilão Finalizado
            </>
          ) : !isConnected ? (
            <>
              <Gavel className="mr-2 h-4 w-4" />
              Conectar para Dar Lance
            </>
          ) : (
            <>
              <Gavel className="mr-2 h-4 w-4" />
              Dar Lance
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
            Comprar Agora por {buyoutPrice}
          </Button>
        )}
      </div>

      {/* Modal de lance */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-secondary/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FDFDFD]">Fazer Lance</DialogTitle>
            <div className="text-sm text-[#FDFDFD]/70 space-y-1">
              {currentBid && <p>Lance atual: {currentBid}</p>}
              <p>Lance mínimo: {nextMinBid} {currency}</p>
              {buyoutPrice && <p>Compra imediata: {buyoutPrice}</p>}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmount" className="text-[#FDFDFD]">
                Seu Lance ({currency})
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
                Deve ser pelo menos {nextMinBid} {currency}
              </p>
            </div>
          </div>

          <DialogFooter className="space-y-2">
            <Button
              onClick={handleBid}
              disabled={isProcessing || !bidAmount || parseFloat(bidAmount) < parseFloat(nextMinBid)}
              className="w-full bg-[#A20131] hover:bg-[#A20131]/90 text-white"
            >
              {isProcessing ? 'Enviando Lance...' : 'Confirmar Lance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 