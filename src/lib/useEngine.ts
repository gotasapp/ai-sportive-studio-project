'use client'

import { useState, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';

// Tipos para comunicação Frontend <-> API
export interface MintRequest {
  to: string;
  metadataUri: string;
}

export interface EngineResponse {
  success: boolean;
  queueId?: string;
  error?: string;
  details?: string;
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

  return {
    isLoading,
    error,
    mintGasless,
    userAddress: address
  };
} 