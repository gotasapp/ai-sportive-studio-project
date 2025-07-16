import { useCallback } from 'react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { mintTo } from 'thirdweb/extensions/erc721';
import { toast } from 'sonner';

// Define Polygon Amoy
const amoy = defineChain(80002);

// Create client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
});

export function useGaslessMint() {
  const handleGaslessMint = useCallback(async (
    address: string,
    metadataUri: string,
    onSuccess?: (hash: string) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_NFT_COLLECTION_CONTRACT_ADDRESS || '';
      
      const contract = getContract({
        client,
        chain: amoy,
        address: contractAddress,
      });

      // Preparar transação
      const transaction = mintTo({
        contract,
        to: address,
        nft: metadataUri
      });

      // Configuração gasless
      const gaslessConfig = {
        provider: "engine" as const,
        relayerUrl: process.env.NEXT_PUBLIC_ENGINE_URL || '',
        relayerForwarderAddress: process.env.BACKEND_WALLET_ADDRESS || ''
      };

      console.log('🚀 Gasless mint config:', {
        to: address,
        metadata: metadataUri,
        relayerUrl: gaslessConfig.relayerUrl
      });

      // Retornar a transação e configuração para uso com TransactionButton
      return { transaction, gaslessConfig };
      
    } catch (error) {
      console.error('❌ Gasless mint preparation failed:', error);
      onError?.(error as Error);
      throw error;
    }
  }, []);

  return { handleGaslessMint };
} 