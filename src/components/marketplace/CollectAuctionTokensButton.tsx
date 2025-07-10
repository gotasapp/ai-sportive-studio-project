'use client';

import { useState } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { MarketplaceService } from '@/lib/services/marketplace-service';
import { toast } from 'sonner';

interface CollectAuctionTokensButtonProps {
  auctionId: string;
  nftName: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CollectAuctionTokensButton({
  auctionId,
  nftName,
  onSuccess,
  className = '',
  variant = 'default'
}: CollectAuctionTokensButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const chain = useActiveWalletChain();

  const handleCollectTokens = async () => {
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
      console.log('🏆 Iniciando coleta de NFT:', {
        auctionId,
        nftName,
        account: account.address,
        chainId: chain.id
      });

      await MarketplaceService.collectAuctionTokens(
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
      console.error('❌ Erro na coleta de NFT:', error);
      
      // O toast de erro já é mostrado no MarketplaceService
      // Apenas log adicional aqui
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCollectTokens}
      disabled={isLoading || !account}
      variant={variant}
      className={`${className} ${isLoading ? 'opacity-50' : ''}`}
      title={`Coletar NFT do leilão - ${nftName}`}
    >
      <Award className="mr-2 h-4 w-4" />
      {isLoading ? 'Collecting...' : 'Collect NFT'}
    </Button>
  );
} 