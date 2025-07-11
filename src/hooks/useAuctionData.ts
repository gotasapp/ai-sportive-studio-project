import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { MarketplaceService } from '@/lib/services/marketplace-service';

interface AuctionData {
  currentBid: string;
  currentBidder: string;
  hasValidBid: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

interface UseAuctionDataProps {
  auctionId?: string;
  isAuction?: boolean;
  initialBid?: string;
  refreshInterval?: number; // em segundos
}

export function useAuctionData({ 
  auctionId, 
  isAuction = false, 
  initialBid = '0 MATIC',
  refreshInterval = 30 // atualizar a cada 30 segundos
}: UseAuctionDataProps) {
  const chain = useActiveWalletChain();
  const account = useActiveAccount();
  
  const [auctionData, setAuctionData] = useState<AuctionData>({
    currentBid: initialBid,
    currentBidder: '',
    hasValidBid: false,
    isLoading: false,
    error: null,
    lastUpdated: Date.now()
  });

  // Função para buscar dados do leilão
  const fetchAuctionData = useCallback(async () => {
    if (!auctionId || !isAuction || !chain) {
      return;
    }

    console.log('🔄 Fetching auction data:', { auctionId, chainId: chain.id });
    
    setAuctionData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const winningBid = await MarketplaceService.getWinningBid(chain.id, auctionId);
      
      setAuctionData({
        currentBid: winningBid.hasValidBid ? winningBid.bidAmountFormatted : initialBid,
        currentBidder: winningBid.bidder,
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
  }, [auctionId, isAuction, chain, initialBid]);

  // Função para atualizar manualmente (após fazer bid)
  const refetchAuctionData = () => {
    fetchAuctionData();
  };

  // Buscar dados iniciais
  useEffect(() => {
    if (isAuction && auctionId && chain) {
      fetchAuctionData();
    }
  }, [fetchAuctionData, isAuction, auctionId, chain]);

  // Auto-refresh a cada intervalo
  useEffect(() => {
    if (!isAuction || !auctionId || !chain) {
      return;
    }

    const interval = setInterval(() => {
      fetchAuctionData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [fetchAuctionData, isAuction, auctionId, chain, refreshInterval]);

  return {
    ...auctionData,
    refetch: refetchAuctionData
  };
} 