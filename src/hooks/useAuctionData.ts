import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useChain } from 'thirdweb/react';
import { NETWORK_CURRENCY, USE_CHZ_MAINNET } from '@/lib/network-config';
import { MarketplaceService } from '@/lib/services/marketplace-service';

interface UseAuctionDataProps {
  auctionId?: string;
  isAuction?: boolean;
  initialBid?: string;
  refreshInterval?: number;
}

interface AuctionDataState {
  currentBid: string;
  hasValidBid: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
}

interface AuctionData extends AuctionDataState {
  refetch: () => void;
}

export function useAuctionData({
  auctionId,
  isAuction = false,
  initialBid = `0 ${NETWORK_CURRENCY}`,
  refreshInterval = 30
}: UseAuctionDataProps): AuctionData {
  const account = useActiveAccount();
  const chain = useChain();
  
  const [auctionData, setAuctionData] = useState<AuctionDataState>({
    currentBid: initialBid,
    hasValidBid: false,
    isLoading: false,
    lastUpdated: null,
    error: null,
  });

  // Função para buscar dados do leilão
  const fetchAuctionData = useCallback(async () => {
    if (!auctionId || !isAuction) {
      return;
    }

    console.log('🔄 Fetching auction data:', { auctionId });
    
    setAuctionData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Assuming MarketplaceService.getWinningBid is available and returns the correct type
      // This part of the code was not provided in the original file, so it's kept as is.
      // If MarketplaceService.getWinningBid is not defined or returns a different structure,
      // this will cause a runtime error.
      const winningBid = await MarketplaceService.getWinningBid(chain.id, auctionId);
      
      setAuctionData({
        currentBid: winningBid.hasValidBid ? winningBid.bidAmountFormatted : initialBid,
        hasValidBid: winningBid.hasValidBid,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      });

      console.log('✅ Auction data updated:', {
        auctionId,
        currentBid: winningBid.bidAmountFormatted,
        hasValidBid: winningBid.hasValidBid
      });

    } catch (error: any) {
      console.error('❌ Error fetching auction data:', error);
      setAuctionData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch auction data'
      }));
    }
  }, [auctionId, isAuction, initialBid]);

  // Função para atualizar manualmente (após fazer bid)
  const refetchAuctionData = () => {
    fetchAuctionData();
  };

  // Buscar dados iniciais
  useEffect(() => {
    if (isAuction && auctionId) {
      fetchAuctionData();
    }
  }, [fetchAuctionData, isAuction, auctionId]);

  // Auto-refresh a cada intervalo
  useEffect(() => {
    if (!isAuction || !auctionId) {
      return;
    }

    const interval = setInterval(() => {
      fetchAuctionData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchAuctionData, isAuction, auctionId, refreshInterval]);

  return {
    ...auctionData,
    refetch: refetchAuctionData
  };
} 