'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ClearAndSyncButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export function ClearAndSyncButton({ onSyncComplete, className }: ClearAndSyncButtonProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAndSync = async () => {
    setIsClearing(true);
    
    try {
      toast.info('🧹 Limpando dados antigos e sincronizando com blockchain...');
      
      const response = await fetch('/api/marketplace/clear-and-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`🎉 Limpeza completa! ${result.stats.updatedListings} listings e ${result.stats.updatedAuctions} auctions sincronizados.`);
        console.log('📊 Resultado da limpeza:', result);
        
        // Chamar callback se fornecido
        if (onSyncComplete) {
          onSyncComplete();
        }
        
        // Force page reload to ensure data is updated
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Erro na limpeza: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro ao limpar e sincronizar:', error);
      toast.error('Erro ao limpar e sincronizar marketplace');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      onClick={handleClearAndSync}
      disabled={isClearing}
      variant="destructive"
      className={className}
    >
      {isClearing ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      {isClearing ? 'Limpando...' : '🧹 Limpar & Sincronizar'}
    </Button>
  );
}