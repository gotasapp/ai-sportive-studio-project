import { useState, useEffect } from 'react';
import { useMarketplaceData } from './useMarketplaceData';
import { useCustomCollectionData } from './useCustomCollectionData';

interface HybridCollectionDataResult {
  nfts: any[];
  loading: boolean;
  error: string | null;
  collectionType: 'standard' | 'custom' | 'unknown';
  refetch: () => void;
}

export function useHybridCollectionData(collectionId?: string): HybridCollectionDataResult {
  const [collectionType, setCollectionType] = useState<'standard' | 'custom' | 'unknown'>('unknown');
  const [contractAddress, setContractAddress] = useState<string>('');

  // Hooks para ambos os tipos
  const { nfts: standardNFTs, loading: standardLoading, error: standardError, refetch: refetchStandard } = useMarketplaceData();
  const { nfts: customNFTs, loading: customLoading, error: customError, refetch: refetchCustom } = useCustomCollectionData(contractAddress);

  // Detectar tipo de coleção
  useEffect(() => {
    const detectCollectionType = async () => {
      if (!collectionId) return;

      try {
        // Primeiro tentar buscar como custom collection
        const customResponse = await fetch(`/api/custom-collections?customCollectionId=${collectionId}`);
        const customData = await customResponse.json();

        if (customData.success && customData.customCollections?.length > 0) {
          const collection = customData.customCollections[0];
          setCollectionType('custom');
          setContractAddress(collection.contractAddress);
          console.log('🎯 Detected CUSTOM collection:', collection.contractAddress);
          return;
        }

        // Se não for custom, assumir que é standard
        setCollectionType('standard');
        console.log('🎯 Detected STANDARD collection');

      } catch (error) {
        console.error('❌ Error detecting collection type:', error);
        setCollectionType('standard'); // Fallback para standard
      }
    };

    detectCollectionType();
  }, [collectionId]);

  // Retornar dados baseado no tipo detectado
  const getNFTsForCollection = () => {
    if (collectionType === 'custom') {
      return customNFTs;
    } else if (collectionType === 'standard') {
      // Filtrar NFTs da coleção específica se necessário
      return standardNFTs.filter(nft => {
        // Adicionar lógica de filtro se necessário
        return true;
      });
    }
    return [];
  };

  const isLoading = () => {
    if (collectionType === 'unknown') return true;
    if (collectionType === 'custom') return customLoading;
    if (collectionType === 'standard') return standardLoading;
    return false;
  };

  const getError = () => {
    if (collectionType === 'custom') return customError;
    if (collectionType === 'standard') return standardError;
    return null;
  };

  const refetch = () => {
    if (collectionType === 'custom') {
      refetchCustom();
    } else if (collectionType === 'standard') {
      refetchStandard();
    }
  };

  return {
    nfts: getNFTsForCollection(),
    loading: isLoading(),
    error: getError(),
    collectionType,
    refetch
  };
}