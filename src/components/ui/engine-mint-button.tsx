'use client'

import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEngine } from '@/lib/useEngine';

interface EngineMintButtonProps {
  address: string;
  metadataUri: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: (queueId: string) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

export function EngineMintButton({
  address,
  metadataUri,
  disabled,
  className,
  onSuccess,
  onError,
  children
}: EngineMintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mintGasless } = useEngine();

  const handleClick = async () => {
    if (!address || !metadataUri) {
      toast.error('Missing required data for minting');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 ENGINE: Starting gasless mint...');
      
      const result = await mintGasless({
        to: address,
        metadataUri: metadataUri,
        chainId: 80002 // Polygon Amoy
      });

      console.log('✅ ENGINE: Mint successful!', result);
      toast.success(`Transaction sent! Queue ID: ${result.queueId}`);
      onSuccess?.(result.queueId);
      
    } catch (error) {
      console.error('❌ ENGINE: Mint failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Engine mint failed';
      toast.error(errorMessage);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading || !address || !metadataUri}
      variant="outline"
      className={cn(
        "transition-all duration-200",
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Minting...</span>
        </div>
      ) : (
        children || (
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            <span>Mint (Gasless)</span>
          </div>
        )
      )}
    </Button>
  );
}