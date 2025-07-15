'use client'

import { useState, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';

// Tipos para comunicação Frontend <-> API
export interface MintRequest {
  to: string;
  metadataUri: string;
  chainId: number;
}

export interface EngineResponse {
  success: boolean;
  queueId?: string;
  error?: string;
  details?: string;
  message?: string;
  transactionHash?: string; // Para compatibilidade
  tokenId?: string; // Para compatibilidade
}

export function useEngine() {
  const account = useActiveAccount();
  const address = account?.address;
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

  // Função para checar o status da transação
  const getTransactionStatus = async (queueId: string) => {
    try {
      const response = await fetch(`/api/engine/status/${queueId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch status');
      }
      return await response.json();
    } catch (err) {
      console.error('❌ Engine Hook: Falha ao buscar status da transação', err);
      // Retornar um objeto de erro padronizado
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    isLoading,
    error,
    getTransactionStatus,
    mintGasless,
    createNFTMetadata,
    userAddress: address
  };
} 