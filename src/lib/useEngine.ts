'use client'

import { useState, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';

// Tipos para comunicação Frontend <-> API
export interface MintRequest {
  chain: string;
  contractAddress: string;
  to: string;
  metadata: any;
}

export interface EngineResponse {
  success: boolean;
  queueId?: string;
  error?: string;
  details?: string;
  message?: string;
}

export function useEngine() {
  const { address } = useAppKitAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função que o frontend chama. Ela envia o pedido para a nossa API segura.
  const mintGasless = useCallback(async (
    request: MintRequest
  ): Promise<EngineResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🎁 Engine Hook: Enviando requisição para a API de mint...');
      
      const response = await fetch('/api/engine/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const data: EngineResponse = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.details || data.error || 'A resposta da API indicou um erro.';
        throw new Error(errorMessage);
      }

      console.log('✅ Engine Hook: Resposta da API recebida com sucesso!', data);
      return {
        ...data,
        success: true,
        message: `Mint bem-sucedido! Queue ID: ${data.queueId}`
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha na comunicação com a API.';
      setError(errorMessage);
      console.error('❌ Engine Hook: Falha no mint gasless:', errorMessage);
      throw err; // Lança o erro para o componente poder tratar
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper para criar metadados (continua igual)
  const createNFTMetadata = useCallback((
    name: string,
    description: string,
    imageUrl: string,
    attributes: Array<{ trait_type: string; value: string }>
  ) => {
    return {
      name,
      description,
      image: imageUrl,
      attributes,
      properties: {
        created_by: 'AI Sports NFT Generator',
        created_at: new Date().toISOString(),
      }
    };
  }, []);

  return {
    isLoading,
    error,
    mintGasless,
    createNFTMetadata,
    userAddress: address
  };
} 