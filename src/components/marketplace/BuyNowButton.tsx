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
      toast.error('Por favor, conecte sua carteira primeiro.');
      return;
    }

    setIsProcessing(true);
    toast.info('Iniciando compra... Por favor, aprove a transação na sua carteira.');
    
    try {
      // Parse price para calcular o total esperado
      const pricePerToken = parseFloat(price.replace(/[^\d.]/g, ''));
      const totalQuantity = parseInt(quantity);
      const expectedTotalPrice = (pricePerToken * totalQuantity).toString();

      const result = await MarketplaceService.buyFromListing(
        account,
        chain.id,
        {
          listingId,
          quantity,
          expectedTotalPrice,
        }
      );

      toast.success('Compra realizada com sucesso! 🎉');
      console.log('✅ Compra concluída:', result.transactionHash);
      
      // Opcional: Recarregar a página ou atualizar estado do marketplace
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Falha na compra:', error);
      
      // Mensagens de erro mais específicas
      if (error.message.includes('insufficient funds')) {
        toast.error('Saldo insuficiente para realizar a compra.');
      } else if (error.message.includes('listing not found')) {
        toast.error('Este NFT não está mais disponível.');
      } else if (error.message.includes('already sold')) {
        toast.error('Este NFT já foi vendido.');
      } else {
        toast.error(error.message || 'Ocorreu um erro ao tentar realizar a compra.');
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
          Processando...
        </>
      ) : !isConnected ? (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Conectar Carteira
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Comprar por {price}
        </>
      )}
    </Button>
  );
} 