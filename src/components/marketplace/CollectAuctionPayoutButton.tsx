'use client';

import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { toast } from 'sonner';

interface CollectAuctionPayoutButtonProps {
  auctionId: string;
  nftName: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CollectAuctionPayoutButton({
  auctionId,
  nftName,
  onSuccess,
  className = '',
  variant = 'default'
}: CollectAuctionPayoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleCollectPayout = async () => {
    if (!account) {
      toast.error('Conecte sua carteira primeiro');
      return;
    }

    if (!chain?.id) {
      toast.error('Selecione uma rede válida');
      return;
    }

    setIsLoading(true);

    try {
      console.log('💰 Iniciando coleta de pagamento:', {
        auctionId,
        nftName,
        account: account.address,
        chainId: chain.id
      });

      await MarketplaceService.collectAuctionPayout(
        account,
        chain.id,
        auctionId
      );

      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess();
      }

      // Reload page after success to update data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro na coleta de pagamento:', error);
      
      // Error toast is already shown in MarketplaceService
      // Apenas log adicional aqui
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCollectPayout}
      disabled={isLoading || !account}
      variant={variant}
      className={`${className} ${isLoading ? 'opacity-50' : ''}`}
      title={`Coletar pagamento do leilão - ${nftName}`}
    >
      <DollarSign className="mr-2 h-4 w-4" />
      {isLoading ? 'Collecting...' : 'Collect Payout'}
    </Button>
  );
} 