'use client'

import { useState, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';

// Tipos para comunicação Frontend <-> API
export interface MintRequest {
  to: string;
  metadataUri: string;
  chainId?: number; // Opcional para compatibilidade com componentes existentes
}

export interface EngineResponse {
  success: boolean;
  queueId?: string;
  error?: string;
  details?: string;
  transactionHash?: string; // Para compatibilidade com componentes existentes
  tokenId?: string; // Para compatibilidade com componentes existentes
}

export function useEngine() {
  const account = useActiveAccount();
  const address = account?.address;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mintGasless = useCallback(async (
    request: MintRequest
  ): Promise<EngineResponse> => {
    setIsLoading(true);
    setError(null);

    if (!request.to || !request.metadataUri) {
      const errorMsg = 'Address and metadata URI are required.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }

    try {
      console.log('🚀 Engine Hook: Sending mint request to API...');
      
      const response = await fetch('/api/engine/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data: EngineResponse = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.details || data.error || 'API response indicated an error.';
        throw new Error(errorMessage);
      }

      console.log('✅ Engine Hook: API response successful!', data);
      return { ...data, success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with the API.';
      setError(errorMessage);
      console.error('❌ Engine Hook: Gasless mint failed:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para checar o status da transação na Engine
  const getTransactionStatus = async (queueId: string) => {
    try {
      // Este endpoint precisa ser criado se quisermos monitorar o status.
      const response = await fetch(`/api/engine/status/${queueId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch transaction status');
      }
      return await response.json();
    } catch (err) {
      console.error('❌ Engine Hook: Failed to get transaction status', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  // Helper para criar metadados
  const createNFTMetadata = useCallback((
    name: string,
    description: string,
    imageUrl: string,
    attributes: Array<{ trait_type: string; value: string | number }>
  ) => {
    return {
      name,
      description,
      image: imageUrl,
      attributes,
    };
  }, []);

  return {
    isLoading,
    error,
    mintGasless,
    getTransactionStatus,
    createNFTMetadata,
    userAddress: address
  };
} 