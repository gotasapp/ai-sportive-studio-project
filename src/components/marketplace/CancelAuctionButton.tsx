'use client';

import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { toast } from 'sonner';

interface CancelAuctionButtonProps {
  auctionId: string;
  nftName: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CancelAuctionButton({
  auctionId,
  nftName,
  onSuccess,
  className = '',
  variant = 'destructive'
}: CancelAuctionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleCancelAuction = async () => {
    if (!account) {
      toast.error('Conecte sua carteira primeiro');
      return;
    }

    if (!chain?.id) {
      toast.error('Selecione uma rede válida');
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja cancelar o leilão do NFT "${nftName}"?\n\n` +
      'O NFT será retornado para sua carteira e todos os lances serão invalidados.'
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      console.log('🚫 Iniciando cancelamento do leilão:', {
        auctionId,
        nftName,
        account: account.address,
        chainId: chain.id
      });

      await MarketplaceService.cancelAuction(
        account,
        chain.id,
        auctionId
      );

      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess();
      }

      // Recarregar a página após sucesso para atualizar dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erro no cancelamento:', error);
      
      // O toast de erro já é mostrado no MarketplaceService
      // Apenas log adicional aqui
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCancelAuction}
      disabled={isLoading || !account}
      variant={variant}
      className={`${className} ${isLoading ? 'opacity-50' : ''}`}
      title={`Cancelar leilão do ${nftName}`}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isLoading ? 'Cancelando...' : 'Cancel Auction'}
    </Button>
  );
} 