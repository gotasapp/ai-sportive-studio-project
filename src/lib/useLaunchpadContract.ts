'use client'

import { useState, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { generateMintSignature, mintWithSignature } from 'thirdweb/extensions/erc721';

// Define a chain Amoy com RPC dedicado
const amoy = defineChain({
  id: 80002,
  rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
});

// Tipos para comunicação Frontend <-> API
export interface LaunchpadMintRequest {
  to: string;
  metadataUri: string;
  collectionId: string;
  price?: string;
  quantity?: number;
}

export interface LaunchpadMintResponse {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  error?: string;
  details?: string;
}

export function useLaunchpadContract() {
  const account = useActiveAccount();
  const address = account?.address;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cliente Thirdweb para Launchpad
  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
  });

  const mintLaunchpadNFT = useCallback(async (
    request: LaunchpadMintRequest
  ): Promise<LaunchpadMintResponse> => {
    setIsLoading(true);
    setError(null);

    if (!request.to || !request.metadataUri || !request.collectionId) {
      const errorMsg = 'Address, metadata URI, and collection ID are required.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }

    try {
      console.log('🚀 Launchpad Contract: Sending mint request to API...');
      
      const response = await fetch('/api/launchpad/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data: LaunchpadMintResponse = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.details || data.error || 'API response indicated an error.';
        throw new Error(errorMessage);
      }

      console.log('✅ Launchpad Contract: API response successful!', data);
      return { ...data, success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with the API.';
      setError(errorMessage);
      console.error('❌ Launchpad Contract: Mint failed:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para gerar signature de mint (para SignatureMintERC721)
  const generateMintSignatureForLaunchpad = useCallback(async (
    contractAddress: string,
    metadata: {
      name: string;
      description: string;
      image: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
    },
    price: string = "0"
  ) => {
    try {
      const contract = getContract({ client, chain: amoy, address: contractAddress });
      
      // Gerar signature para mint
      const { payload, signature } = await generateMintSignature({
        contract,
        to: address || "",
        metadata: {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes || []
        },
        price: price,
        currency: "0x0000000000000000000000000000000000000000", // Native token
        validityStartTimestamp: new Date(),
        validityEndTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      });

      return { payload, signature };
    } catch (error) {
      console.error('❌ Error generating mint signature:', error);
      throw error;
    }
  }, [client, address]);

  // Função para mint com signature (SignatureMintERC721)
  const mintWithSignatureForLaunchpad = useCallback(async (
    contractAddress: string,
    payload: any,
    signature: string
  ) => {
    try {
      const contract = getContract({ client, chain: amoy, address: contractAddress });
      
      const transaction = mintWithSignature({
        contract,
        payload,
        signature,
      });

      // Enviar transação
      const result = await transaction.send();
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        tokenId: result.tokenId
      };
    } catch (error) {
      console.error('❌ Error minting with signature:', error);
      throw error;
    }
  }, [client]);

  // Helper para criar metadados de Launchpad
  const createLaunchpadMetadata = useCallback((
    name: string,
    description: string,
    imageUrl: string,
    attributes: Array<{ trait_type: string; value: string | number }>,
    collectionData?: {
      creator?: string;
      contractAddress?: string;
      vision?: string;
      utility?: string[];
      team?: string[];
      roadmap?: string[];
    }
  ) => {
    const baseMetadata = {
      name,
      description,
      image: imageUrl,
      attributes,
    };

    // Adicionar dados específicos do Launchpad se disponíveis
    if (collectionData) {
      return {
        ...baseMetadata,
        properties: {
          ...baseMetadata,
          creator: collectionData.creator,
          contractAddress: collectionData.contractAddress,
          vision: collectionData.vision,
          utility: collectionData.utility,
          team: collectionData.team,
          roadmap: collectionData.roadmap,
        }
      };
    }

    return baseMetadata;
  }, []);

  return {
    isLoading,
    error,
    mintLaunchpadNFT,
    generateMintSignatureForLaunchpad,
    mintWithSignatureForLaunchpad,
    createLaunchpadMetadata,
    userAddress: address
  };
} 