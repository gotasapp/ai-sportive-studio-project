import { useState, useEffect } from 'react';

interface CustomCollectionNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  tokenId: string;
  contractAddress: string;
  owner: string;
  price: string;
  currency: string;
  metadata: {
    category: string;
    subcategoryType: string;
    teamName: string;
    season: string;
    mintedAt: string;
  };
  marketplace: {
    isListable: boolean;
    canTrade: boolean;
    verified: boolean;
  };
}

interface UseCustomCollectionDataResult {
  nfts: CustomCollectionNFT[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCustomCollectionData(contractAddress?: string): UseCustomCollectionDataResult {
  const [nfts, setNfts] = useState<CustomCollectionNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!contractAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/custom-collections/minted?contractAddress=${contractAddress}`);
      const data = await response.json();

      if (data.success) {
        setNfts(data.nfts || []);
        console.log(`✅ Loaded ${data.nfts?.length || 0} NFTs from custom collection`);
      } else {
        setError(data.error || 'Failed to load custom collection NFTs');
      }
    } catch (err) {
      console.error('❌ Error fetching custom collection data:', err);
      setError('Failed to fetch custom collection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contractAddress]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchData
  };
}