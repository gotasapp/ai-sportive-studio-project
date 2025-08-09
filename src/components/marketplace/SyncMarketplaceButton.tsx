'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveAccount } from 'thirdweb/react';

interface SyncMarketplaceButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export function SyncMarketplaceButton({ onSyncComplete, className }: SyncMarketplaceButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const account = useActiveAccount();

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      toast.info('Sincronizando marketplace com blockchain...');
      
      const response = await fetch('/api/marketplace/force-sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: account?.address || null
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Sincronização completa! ${result.stats.updatedNFTs} NFTs atualizados.`);
        console.log('📊 Resultado da sincronização:', result);
        
        // Mostrar contratos encontrados
        if (result.contracts && result.contracts.length > 0) {
          console.log('📋 Contratos sincronizados:', result.contracts);
        }

        // Chamar callback se fornecido
        if (onSyncComplete) {
          onSyncComplete();
        }
        
        // Forçar recarregamento da página para garantir que os dados sejam atualizados
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Erro na sincronização: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar marketplace');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className={className}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Sincronizando...' : 'Sincronizar Marketplace'}
    </Button>
  );
}