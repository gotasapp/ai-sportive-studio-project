import { useState } from 'react';

interface BatchMintResult {
  success: boolean;
  totalRequested: number;
  successfulMints: number;
  failedMints: number;
  results: Array<{
    mintNumber: number;
    queueId: string;
    transactionHash?: string;
    status: string;
  }>;
  errors?: Array<{
    mintNumber: number;
    error: string;
  }>;
  message: string;
}

interface BatchMintProgress {
  current: number;
  total: number;
  percentage: number;
}

export function useBatchMint() {
  const [isBatchMinting, setIsBatchMinting] = useState(false);
  const [batchMintProgress, setBatchMintProgress] = useState<BatchMintProgress | null>(null);
  const [batchMintResult, setBatchMintResult] = useState<BatchMintResult | null>(null);
  const [batchMintError, setBatchMintError] = useState<string | null>(null);

  const batchMintGasless = async (params: {
    to: string;
    metadataUri: string;
    quantity: number;
    collection?: 'jerseys' | 'stadiums' | 'badges';
  }) => {
    if (params.quantity < 1 || params.quantity > 100) {
      throw new Error('Quantity must be between 1 and 100');
    }

    setIsBatchMinting(true);
    setBatchMintProgress({ current: 0, total: params.quantity, percentage: 0 });
    setBatchMintResult(null);
    setBatchMintError(null);

    try {
      console.log('🚀 Starting batch mint:', params);

      const response = await fetch('/api/engine/batch-mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch mint failed');
      }

      const result: BatchMintResult = await response.json();
      
      console.log('✅ Batch mint completed:', result);
      setBatchMintResult(result);
      setBatchMintProgress({ 
        current: result.successfulMints, 
        total: params.quantity, 
        percentage: (result.successfulMints / params.quantity) * 100 
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch mint failed';
      console.error('❌ Batch mint error:', errorMessage);
      setBatchMintError(errorMessage);
      throw error;
    } finally {
      setIsBatchMinting(false);
    }
  };

  const resetBatchMint = () => {
    setIsBatchMinting(false);
    setBatchMintProgress(null);
    setBatchMintResult(null);
    setBatchMintError(null);
  };

  return {
    // Estado
    isBatchMinting,
    batchMintProgress,
    batchMintResult,
    batchMintError,
    
    // Funções
    batchMintGasless,
    resetBatchMint,
  };
} 