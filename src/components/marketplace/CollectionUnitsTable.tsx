'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Tag, Gavel, Clock, User, AlertTriangle } from 'lucide-react';
import { useAuctionData } from '@/hooks/useAuctionData';

// Importar TODOS os componentes de trading do backup
import { CreateListingModal } from './CreateListingModal';
import { UpdateListingModal } from './UpdateListingModal';
import { CreateAuctionModal } from './CreateAuctionModal';
import { CancelListingButton } from './CancelListingButton';
import { CancelAuctionButton } from './CancelAuctionButton';
import BuyNowButton from './BuyNowButton';
import AuctionBidButton from './AuctionBidButton';
import MakeOfferButton from './MakeOfferButton';
import { formatPriceSafe, isValidPrice } from '@/lib/marketplace-config';

interface CollectionUnit {
  id: string;
  tokenId: string;
  name: string;
  imageUrl: string;
  contractAddress: string;
  owner?: string;
  minterAddress?: string;
  marketplace: {
    isListed: boolean;
    isAuction: boolean;
    canTrade: boolean;
    verified: boolean;
    price: string;
    listingId?: string;
    auctionId?: string;
    auctionEndTime?: Date;
    thirdwebData?: any;
    thirdwebAuctionData?: any;
  };
}

interface CollectionUnitsTableProps {
  collectionId: string;
  category?: string;
}

export default function CollectionUnitsTable({ collectionId, category }: CollectionUnitsTableProps) {
  const [units, setUnits] = useState<CollectionUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const account = useActiveAccount();

  // Estados dos modais (MESMA LÓGICA DO BACKUP)
  const [showCreateListing, setShowCreateListing] = useState<string | null>(null);
  const [showUpdateListing, setShowUpdateListing] = useState<string | null>(null);
  const [showCreateAuction, setShowCreateAuction] = useState<string | null>(null);

  // Buscar unidades da coleção
  useEffect(() => {
    async function fetchUnits() {
      try {
        setLoading(true);
        console.log('🎯 Fetching collection units:', { collectionId, category });
        
        const response = await fetch(
          `/api/marketplace/collection-units?collectionId=${collectionId}&category=${category || ''}&_t=${Date.now()}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch collection units');
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('🎯 RAW API RESPONSE:', result);
          console.log('🎯 UNITS DATA:', result.data);
          console.log('🎯 UNITS LENGTH:', result.data?.length);
          setUnits(result.data);
          setStats(result.stats);
          console.log('✅ Collection units loaded:', result.stats);
        } else {
          throw new Error(result.error || 'Failed to load units');
        }
      } catch (err) {
        console.error('❌ Error fetching collection units:', err);
        setError(err instanceof Error ? err.message : 'Failed to load collection units');
      } finally {
        setLoading(false);
      }
    }

    if (collectionId) {
      fetchUnits();
    }
  }, [collectionId, category]);

  // 🔄 AUTO-REFRESH: Atualizar dados a cada 30 segundos (COPIANDO LÓGICA LEGACY)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh: Atualizando dados da coleção...');
        
        const response = await fetch(
          `/api/marketplace/collection-units?collectionId=${collectionId}&category=${category || ''}&_t=${Date.now()}`
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUnits(result.data);
            setStats(result.stats);
            console.log('✅ Auto-refresh: Dados atualizados');
          }
        }
      } catch (error) {
        console.warn('⚠️ Auto-refresh failed:', error);
      }
    }, 10000); // 10 segundos (mais rápido)

    return () => clearInterval(interval);
  }, [collectionId, category]);

  // Refresh após ações de trading
  const refreshUnits = async () => {
    try {
      console.log('🔄 Manual refresh: Recarregando dados após trading...');
      
      const response = await fetch(
        `/api/marketplace/collection-units?collectionId=${collectionId}&category=${category || ''}&_t=${Date.now()}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnits(result.data);
          setStats(result.stats);
          console.log('✅ Manual refresh: Dados atualizados');
        }
      }
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    }
  };

  // Determinar ownership (CORRIGIDO PARA AUCTIONS)
  const isOwner = (unit: CollectionUnit) => {
    if (!account?.address) return false;
    const owner = unit.owner || unit.minterAddress;
    return owner?.toLowerCase() === account.address.toLowerCase();
  };

  // 🎯 COMPONENTE DE AUCTION COM DADOS EM TEMPO REAL
  const AuctionDisplay = ({ unit }: { unit: CollectionUnit }) => {
    const auctionData = useAuctionData({
      auctionId: unit.marketplace?.auctionId,
      isAuction: unit.marketplace?.isAuction,
      initialBid: unit.marketplace?.price || '0 MATIC',
      refreshInterval: 30
    });

    // Usar bid em tempo real se disponível
    const displayCurrentBid = auctionData.hasValidBid ? auctionData.currentBid : unit.marketplace?.price;
    
    // Verificar se auction expirou
    const auctionEndTime = unit.marketplace?.thirdwebAuctionData?.endTime ? 
      new Date(unit.marketplace.thirdwebAuctionData.endTime) : null;
    const isAuctionEnded = auctionEndTime ? new Date() > auctionEndTime : false;

    return (
      <div>
        <Badge className={`mb-1 ${isAuctionEnded ? 'bg-gray-600' : 'bg-orange-600'} text-white`}>
          <Clock className="h-3 w-3 mr-1" />
          {isAuctionEnded ? 'Auction Ended' : 'Live Auction'}
        </Badge>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#FDFDFD]/70">Current Bid</span>
            {auctionData.isLoading && (
              <div className="animate-spin h-3 w-3 border border-[#A20131] border-t-transparent rounded-full"></div>
            )}
          </div>
          <div className="text-sm font-medium text-[#A20131]">
            {displayCurrentBid || 'No bids'}
          </div>
          {auctionData.lastUpdated && (
            <div className="text-xs text-[#FDFDFD]/50">
              Updated: {new Date(auctionData.lastUpdated).toLocaleTimeString()}
            </div>
          )}
          {auctionEndTime && !isAuctionEnded && (
            <div className="text-xs text-[#FDFDFD]/70">
              Ends: {auctionEndTime.toLocaleDateString()} {auctionEndTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determinar se é criador do auction (NOVA FUNÇÃO)
  const isAuctionCreator = (unit: CollectionUnit) => {
    if (!account?.address) return false;
    // Para auctions, verificar se existe thirdwebAuctionData com creatorAddress
    const auctionCreator = unit.marketplace?.thirdwebAuctionData?.creatorAddress;
    return auctionCreator?.toLowerCase() === account.address.toLowerCase();
  };

  // Renderizar botões de ação (MESMA LÓGICA DO BACKUP)
  const renderActionButtons = (unit: CollectionUnit) => {
    const isUserOwner = isOwner(unit);
    const { isListed, isAuction, listingId, auctionId, auctionEndTime } = unit.marketplace;
    
    // Determinar estado e ações disponíveis
    
    if (isListed && listingId) {
      // 🛒 NFT LISTADO - DESIGN PROFISSIONAL
      const isPriceValid = isValidPrice(unit.marketplace.price);
      
      if (isUserOwner) {
        // Proprietário: Gerenciar listagem
        return (
          <div className="flex flex-col sm:flex-row gap-2 min-w-[140px]">
            <Button

              onClick={() => setShowUpdateListing(unit.id)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm text-xs"
            >
              <Tag className="mr-1 h-3 w-3" />
              Update
            </Button>
            <CancelListingButton
              listingId={listingId}
              price={unit.marketplace.price}
              nftName={unit.name}
              tokenId={unit.tokenId}
              variant="outline"

              className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
            />
          </div>
        );
      } else {
        // Comprador: Comprar ou fazer oferta
        return (
          <div className="flex flex-col sm:flex-row gap-2 min-w-[140px]">
            {isPriceValid ? (
              <BuyNowButton
                listingId={listingId}
                price={unit.marketplace.price}
  
                className="bg-gradient-to-r from-[#A20131] to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-sm text-xs"
              />
            ) : (
              <Button disabled size="sm" variant="destructive" className="opacity-50 text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Invalid
              </Button>
            )}
            <MakeOfferButton
              assetContract={unit.contractAddress}
              tokenId={unit.tokenId}
              nftName={unit.name}

              className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
            />
          </div>
        );
      }
    } else if (isAuction && auctionId) {
      // 🔨 NFT EM LEILÃO - DESIGN PROFISSIONAL
      const isAuctionEnded = auctionEndTime ? new Date() > auctionEndTime : false;
      
      if (isUserOwner) {
        // Criador do leilão
        return (
          <div className="flex flex-col gap-2 min-w-[140px]">
            {!isAuctionEnded ? (
              <>
                <div className="text-xs text-amber-600 font-medium">Your Auction</div>
                <CancelAuctionButton
                  auctionId={auctionId}
                  nftName={unit.name}
                  variant="outline"
    
                  className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                  onSuccess={refreshUnits}
                />
              </>
            ) : (
              <>
                <div className="text-xs text-gray-500">Auction Ended</div>
                <Button disabled size="sm" variant="ghost" className="text-gray-400 text-xs">
                  Collect Results
                </Button>
              </>
            )}
          </div>
        );
      } else {
        // Participante do leilão
        return (
          <div className="flex flex-col sm:flex-row gap-2 min-w-[140px]">
            {!isAuctionEnded ? (
              <>
                <AuctionBidButton
                  auctionId={auctionId}
                  currentBid="0 MATIC"
                  minimumBid="0"
                  endTime={auctionEndTime || new Date()}
                  currency="MATIC"
    
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-sm text-xs"
                  onBidSuccess={refreshUnits}
                />
                <MakeOfferButton
                  assetContract={unit.contractAddress}
                  tokenId={unit.tokenId}
                  nftName={unit.name}
    
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                />
              </>
            ) : (
              <>
                <div className="text-xs text-gray-500 mb-1">Auction Ended</div>
                <MakeOfferButton
                  assetContract={unit.contractAddress}
                  tokenId={unit.tokenId}
                  nftName={unit.name}
    
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                />
              </>
            )}
          </div>
        );
      }
    } else {
      // 💎 NFT DISPONÍVEL - DESIGN PROFISSIONAL
      if (isUserOwner) {
        // Proprietário: Listar ou leiloar
        return (
          <div className="flex flex-col sm:flex-row gap-2 min-w-[140px]">
            <Button

              onClick={() => setShowCreateListing(unit.id)}
              className="bg-gradient-to-r from-[#A20131] to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-sm text-xs"
            >
              <Tag className="mr-1 h-3 w-3" />
              List
            </Button>
            <Button

              variant="outline"
              onClick={() => setShowCreateAuction(unit.id)}
              className="border-amber-300 text-amber-600 hover:bg-amber-50 text-xs"
            >
              <Gavel className="mr-1 h-3 w-3" />
              Auction
            </Button>
          </div>
        );
      } else {
        // Visitante: Fazer oferta
        return (
          <div className="flex flex-col gap-2 min-w-[140px]">
            <div className="text-xs text-gray-500">Not Listed</div>
            <MakeOfferButton
              assetContract={unit.contractAddress}
              tokenId={unit.tokenId}
              nftName={unit.name}

              className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
            />
          </div>
        );
      }
    }
  };

  // Encontrar unidade para modais
  const getUnitForModal = (unitId: string) => {
    return units.find(u => u.id === unitId);
  };

  if (loading) {
    return (
      <Card className="bg-transparent border-[#FDFDFD]/10">
        <CardHeader>
          <CardTitle className="text-[#FDFDFD]">Collection Units</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-[#FDFDFD]/10 rounded-lg">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-transparent border-[#FDFDFD]/10">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">Failed to Load Units</h3>
          <p className="text-[#FDFDFD]/70 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {stats && (
        <Card className="bg-transparent border-[#FDFDFD]/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FDFDFD]">{stats.total}</div>
                <div className="text-sm text-[#FDFDFD]/70">Total Units</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.listed}</div>
                <div className="text-sm text-[#FDFDFD]/70">For Sale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats.auctions}</div>
                <div className="text-sm text-[#FDFDFD]/70">Auctions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FDFDFD]/70">{stats.notForSale}</div>
                <div className="text-sm text-[#FDFDFD]/70">Not Listed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Units Table */}
      <Card className="bg-transparent border-[#FDFDFD]/10">
        <CardHeader>
          <CardTitle className="text-[#FDFDFD] flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Individual Units ({units.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#FDFDFD]/70">No units found in this collection.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <div 
                  key={unit.id}
                  className="flex items-center gap-4 p-4 border border-[#FDFDFD]/10 rounded-lg hover:border-[#FDFDFD]/20 transition-colors"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FDFDFD]/5">
                    {unit.imageUrl ? (
                      <img
                        src={unit.imageUrl}
                        alt={unit.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#FDFDFD]/50">
                        <Eye className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#FDFDFD] truncate">{unit.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-[#FDFDFD]/70">#{unit.tokenId}</span>
                      {isOwner(unit) && (
                        <Badge variant="secondary" className="bg-[#A20131]/20 text-[#A20131]">
                          <User className="h-3 w-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="text-right min-w-0">
                    {unit.marketplace.isAuction ? (
                      <AuctionDisplay unit={unit} />
                    ) : unit.marketplace.isListed ? (
                      <div>
                        <Badge className="bg-green-600 text-white mb-1">
                          <Tag className="h-3 w-3 mr-1" />
                          For Sale
                        </Badge>
                        <div className="text-sm font-medium text-[#FDFDFD]">
                          {unit.marketplace.price}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Badge variant="outline" className="border-[#FDFDFD]/20 text-[#FDFDFD]/70 mb-1">
                          Not Listed
                        </Badge>
                        <div className="text-sm text-[#FDFDFD]/50">
                          Available
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions - Layout Profissional */}
                  <div className="flex-shrink-0 min-w-[160px] max-w-[200px]">
                    {renderActionButtons(unit)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais de Trading (MESMA LÓGICA DO BACKUP) */}
      {showCreateListing && (
        <CreateListingModal
          isOpen={true}
          onOpenChange={(open) => !open && setShowCreateListing(null)}
          nft={(() => {
            const unit = getUnitForModal(showCreateListing);
            if (!unit) {
              // Fallback NFT para evitar null
              return {
                assetContractAddress: '',
                tokenId: '',
                name: 'Unknown NFT',
                imageUrl: ''
              };
            }
            return {
              assetContractAddress: unit.contractAddress,
              tokenId: unit.tokenId,
              name: unit.name,
              imageUrl: unit.imageUrl
            };
          })()}
        />
      )}

      {showUpdateListing && (() => {
        const unit = getUnitForModal(showUpdateListing);
        if (!unit) return null;
        
        return (
          <UpdateListingModal
            isOpen={true}
            onOpenChange={(open) => !open && setShowUpdateListing(null)}
            listingId={unit.marketplace?.listingId || ''}
            currentPrice={unit.marketplace?.price || '0'}
            nftName={unit.name}
            tokenId={unit.tokenId}
          />
        );
      })()}

      {showCreateAuction && (
        <CreateAuctionModal
          isOpen={true}
          onOpenChange={(open) => !open && setShowCreateAuction(null)}
          nft={(() => {
            const unit = getUnitForModal(showCreateAuction);
            if (!unit) {
              // Fallback NFT para evitar null
              return {
                assetContractAddress: '',
                tokenId: '',
                name: 'Unknown NFT',
                imageUrl: ''
              };
            }
            return {
              assetContractAddress: unit.contractAddress,
              tokenId: unit.tokenId,
              name: unit.name,
              imageUrl: unit.imageUrl
            };
          })()}
          onSuccess={() => {
            setShowCreateAuction(null);
            refreshUnits();
          }}
        />
      )}
    </div>
  );
}