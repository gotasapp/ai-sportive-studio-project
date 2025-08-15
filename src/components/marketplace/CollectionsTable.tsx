'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCollectionImage } from './FixedCollectionImages'
import { normalizeIpfsUri } from '@/lib/utils'
import { 
  Star, 
  TrendingUp, 
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useActiveAccount } from 'thirdweb/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewType, PriceSort, TokenType, CollectionTab } from './MarketplaceFilters'


interface NFTData {
  _id: string
  name: string
  imageUrl: string
  creator?: {
    wallet: string
    name: string
  }
  createdAt: string
  status: 'Approved'
  category: 'jersey' | 'stadium' | 'badge'
}

interface CollectionStat {
  rank: number
  name: string
  imageUrl: string
  floorPrice: number
  floorPriceChange: number
  volume24h: number
  volumeChange: number
  sales24h: number
  salesChange: number
  supply: number
  owners: number
  category: string
  trendData: number[] // 7-day trend data for sparkline
  isWatchlisted?: boolean
  isOwned?: boolean
  // Navegação correta
  collectionId?: string
  isCustomCollection?: boolean
  tokenId?: string | number
  contractAddress?: string
  contractType?: 'legacy' | 'launchpad' | 'custom'
  // 🎯 HÍBRIDO: Item original do marketplace para navegação NFTGrid-style
  originalItem?: any
}

interface CollectionsTableProps {
  viewType: ViewType
  priceSort: PriceSort
  tokenType: TokenType
  activeTab: CollectionTab
  searchTerm: string
  onToggleWatchlist?: (collectionName: string) => void
  marketplaceData?: any[]
}

export default function CollectionsTable({
  viewType,
  priceSort,
  tokenType,
  activeTab,
  searchTerm,
  onToggleWatchlist,
  marketplaceData = []
}: CollectionsTableProps) {
  const [collections, setCollections] = useState<CollectionStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12 // 🎯 HÍBRIDO: 12 itens por página como solicitado
  const account = useActiveAccount()
  const router = useRouter()

  // 🎯 HÍBRIDO: Função de navegação copiada do NFTGrid (que funciona 100%)
  const navigateToItem = (item: any) => {
    try {
      console.log('🚀 NFTGrid-style Navigation:', { item });

      // 🎯 LÓGICA COPIADA DO NFTGRID: Detectar se é coleção ou NFT individual
      const isLaunchpadCollection =
        (item.type === 'launchpad' && item.status === 'active') ||
        item.type === 'launchpad_collection' ||
        item.collectionType === 'launchpad' ||
        item.marketplace?.isLaunchpadCollection;
      
      const isCollection = item.isCollection || item.marketplace?.isCollection || isLaunchpadCollection || false;
      
      if (isCollection) {
        const computedCollectionId =
          item.collectionId || item.customCollectionId || item.collectionData?._id || item._id;
        const computedIsCustom = !!(item.isCustomCollection || item.marketplace?.isCustomCollection || isLaunchpadCollection);
        
        // Para launchpad ativos, enviar para a página de mint dedicada
        const hrefOverride = isLaunchpadCollection && item.status === 'active' && computedCollectionId
          ? `/launchpad/${computedCollectionId}`
          : undefined;
        
        if (hrefOverride) {
          console.log('✅ Launchpad navigation:', hrefOverride);
          router.push(hrefOverride);
          return;
        }
        
        // Custom collections
        if (computedIsCustom && computedCollectionId) {
          const route = `/marketplace/collection/jersey/${computedCollectionId}`;
          console.log('✅ Custom collection navigation:', route);
          router.push(route);
          return;
        }
      }
      
      // 🎯 NFTs individuais - mesma lógica do MarketplaceCard
      const category = item.category || 'jersey';
      if (item.tokenId !== undefined && item.tokenId !== null) {
        const route = `/marketplace/collection/${category}/${category}/${item.tokenId}`;
        console.log('✅ Individual NFT navigation:', route);
        router.push(route);
        return;
      }
      
      // Fallback: página da categoria
      const fallbackRoute = `/marketplace/collection/${category}`;
      console.log('⚠️ Fallback navigation:', fallbackRoute);
      router.push(fallbackRoute);
      
    } catch (e) {
      console.error('❌ Navigation failed:', e);
    }
  }

  useEffect(() => {
    const processCollectionData = () => {
      console.log('🚀 HÍBRIDO: Usando dados direto do NFTGrid!');
      console.log('📥 marketplaceData received:', marketplaceData?.length, 'items');
      
      setLoading(true)
      setError(null)
      
      try {
        // 🎯 HÍBRIDO: Processar TODOS os items do marketplace como no NFTGrid
        // Não separar por categoria, usar todos os 54 itens!
        
        const generateTrendData = (floorPrice: number) => {
          const baseValue = Math.max(floorPrice * 100, 50);
          const variation = baseValue * 0.2;
          return Array.from({ length: 7 }, (_, index) => {
            const trendFactor = 1 + (index - 3) * 0.02;
            const randomFactor = 0.9 + Math.random() * 0.2;
            return Math.max(10, baseValue * trendFactor * randomFactor);
          });
        }

        // 🎯 ESTRATÉGIA NOVA: Transformar cada item do marketplace em uma linha da tabela
        const tableData: CollectionStat[] = marketplaceData.map((item, index) => {
          
          // Calcular estatísticas baseadas no item
          const price = item.price ? parseFloat(item.price.toString().replace(/[^\d.-]/g, '')) || 0 : 0;
          const floorPrice = price;
          
          // Supply baseado no tipo do item
          let supply = 1; // Default para NFT individual
          if (item.marketplace?.totalUnits) {
            supply = item.marketplace.totalUnits;
          } else if (item.type === 'launchpad' || item.collectionType === 'launchpad') {
            supply = 100; // Default para coleções Launchpad
          }
          
          // Owners baseado no tipo
          let owners = 1;
          if (item.marketplace?.uniqueOwners) {
            owners = item.marketplace.uniqueOwners;
          } else if (item.type === 'launchpad') {
            owners = Math.max(1, Math.floor(supply * 0.7)); // Estimativa
          }
          
          // Sales baseadas em listagens
          const sales24h = item.marketplace?.mintedUnits || (item.isListed ? 1 : 0);
          
          return {
            rank: index + 1,
            name: item.name || `Item #${index + 1}`,
            imageUrl: item.imageUrl || item.image || '/fallback.svg',
            floorPrice,
            floorPriceChange: 0, // Mockado
            volume24h: floorPrice * sales24h,
            volumeChange: 0, // Mockado
            sales24h,
            salesChange: 0, // Mockado
            supply,
            owners,
            category: item.category || 'jersey',
            trendData: generateTrendData(floorPrice),
            isWatchlisted: false,
            isOwned: false,
            
            // 🎯 CRÍTICO: Preservar dados originais para navegação NFTGrid-style
            originalItem: item,
            collectionId: item.collectionId || item.customCollectionId || item._id,
            isCustomCollection: !!(item.isCustomCollection || item.marketplace?.isCustomCollection),
            tokenId: item.tokenId,
            contractAddress: item.contractAddress,
            contractType: item.type === 'launchpad' ? 'launchpad' as const : 'legacy' as const
          };
        });

        console.log('✅ HÍBRIDO: Transformou', marketplaceData.length, 'items em', tableData.length, 'linhas de tabela');

        // 🎯 HÍBRIDO: Aplicar filtros na tabela de dados
        let filteredData = tableData;

        // Filtro por tipo de token
        if (tokenType !== 'all') {
          const categoryMap = {
            'jerseys': 'jersey',
            'stadiums': 'stadium', 
            'badges': 'badge',
            'launchpad': 'launchpad',
            'custom': 'custom'
          }
          filteredData = filteredData.filter(item => 
            item.category === categoryMap[tokenType as keyof typeof categoryMap]
          )
        }

        // Filtro por tab
        if (activeTab === 'watchlist') {
          filteredData = filteredData.filter(item => item.isWatchlisted)
        } else if (activeTab === 'owned') {
          filteredData = filteredData.filter(item => item.isOwned)
        }

        // Filtro por busca
        if (searchTerm.trim()) {
          filteredData = filteredData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Ordenação
        switch (priceSort) {
          case 'low-to-high':
            filteredData.sort((a, b) => a.floorPrice - b.floorPrice)
            break
          case 'high-to-low':
            filteredData.sort((a, b) => b.floorPrice - a.floorPrice)
            break
          case 'volume-desc':
            filteredData.sort((a, b) => b.volume24h - a.volume24h)
            break
          case 'volume-asc':
            filteredData.sort((a, b) => a.volume24h - b.volume24h)
            break
        }

        // Reordenar ranks
        filteredData.forEach((item, index) => {
          item.rank = index + 1
        })

        console.log('✅ HÍBRIDO: Final table data:', filteredData.length, 'items');
        console.log('📋 Sample items:', filteredData.slice(0, 3));
        setCollections(filteredData)

      } catch (error: any) {
        console.error('❌ Error processing collection data:', error)
        setError(error.message || 'Failed to process collection data')
        setCollections([])
      } finally {
        setLoading(false)
      }
    }

    processCollectionData()
  }, [priceSort, tokenType, activeTab, searchTerm, marketplaceData])

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [priceSort, tokenType, activeTab, searchTerm])

  // Calcular paginação
  const totalPages = Math.ceil(collections.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCollections = collections.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderChange = (change: number, showIcon = true) => {
    const isPositive = change > 0
    const isNeutral = change === 0
    
    if (isNeutral) {
      return (
        <span className="flex items-center text-[#FDFDFD]/50">
          <Minus className="w-3 h-3 mr-1" />
          --
        </span>
      )
    }
    
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {showIcon && (isPositive ? 
          <ArrowUpRight className="w-3 h-3 mr-1" /> : 
          <ArrowDownRight className="w-3 h-3 mr-1" />
        )}
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    )
  }

  const renderTrendChart = (data: number[]) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60
      const y = 20 - ((value - min) / (max - min)) * 15
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width="60" height="20" className="text-green-400">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  const handleWatchlistToggle = async (collectionName: string) => {
    try {
      const target = collections.find(c => c.name === collectionName);
      const nextStarred = !target?.isWatchlisted;
      const action = nextStarred ? 'upvote' : 'remove';

      // Persistir voto no backend (mesma lógica do like, aplicada à coleção)
      const resp = await fetch('/api/collections/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName, action, walletAddress: account?.address || 'guest' })
      });
      // Não bloqueia UI se API falhar, mas loga para debug
      if (!resp.ok) {
        console.warn('Collections vote API failed', resp.status, await resp.text());
      }

      if (onToggleWatchlist) {
        onToggleWatchlist(collectionName)
      }
      // Update local state visual (estrela ligada/desligada)
      setCollections(prev => prev.map(c => 
        c.name === collectionName 
          ? { ...c, isWatchlisted: nextStarred }
          : c
      ))
    } catch (e) {
      console.error('Failed to toggle collection vote:', e);
    }
  }

  // Sincroniza estado da estrela por usuário (wallet) ao carregar/alterar carteira
  useEffect(() => {
    const syncUserVotes = async () => {
      if (!account?.address || collections.length === 0) return;
      try {
        const updated = await Promise.all(collections.map(async (c) => {
          const res = await fetch(`/api/collections/vote/status?collectionName=${encodeURIComponent(c.name)}&walletAddress=${account.address}`);
          if (!res.ok) return c;
          const data = await res.json();
          return { ...c, isWatchlisted: !!data.userVoted };
        }));
        setCollections(updated);
      } catch (e) {
        console.warn('Failed to sync user vote status', e);
      }
    };
    syncUserVotes();
  }, [account?.address]);

  if (loading) {
    return (
      <div className="rounded-lg border border-[#FDFDFD]/10 p-6" style={{ backgroundColor: '#14101e' }}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#A20131] animate-spin mr-3" />
          <span className="text-[#FDFDFD]/70">Loading collections...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#FDFDFD]/10 p-6" style={{ backgroundColor: '#14101e' }}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">Failed to Load Collections</h3>
          <p className="text-[#FDFDFD]/70 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#A20131] hover:bg-[#A20131]/90"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  console.log('🎭 RENDER STATE:', { loading, error, collectionsLength: collections.length, collections });

  if (collections.length === 0) {
    console.log('❌ Showing "No Collections Found" because collections.length === 0');
    return (
      <div className="rounded-lg border border-[#FDFDFD]/10 p-6" style={{ backgroundColor: '#14101e' }}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-[#FDFDFD]/10 rounded-full flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-[#FDFDFD]/50" />
          </div>
          <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">No Collections Found</h3>
          <p className="text-[#FDFDFD]/70">
            {searchTerm ? `No results for "${searchTerm}"` : 
             activeTab === 'watchlist' ? 'No collections in your watchlist' :
             activeTab === 'owned' ? 'No owned collections' :
             'No collections available'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#FDFDFD]/10 overflow-hidden" style={{ backgroundColor: '#14101e' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#FDFDFD]/10">
              <th className="text-left p-4 text-sm font-medium text-[#FDFDFD]/70">#</th>
              <th className="text-left p-4 text-sm font-medium text-[#FDFDFD]/70">COLLECTION</th>
              <th className="text-right p-4 text-sm font-medium text-[#FDFDFD]/70">FLOOR PRICE</th>
              <th className="text-right p-4 text-sm font-medium text-[#FDFDFD]/70">VOLUME</th>
              <th className="text-right p-4 text-sm font-medium text-[#FDFDFD]/70">SALES</th>
              <th className="text-center p-4 text-sm font-medium text-[#FDFDFD]/70">7D TREND</th>
              <th className="text-right p-4 text-sm font-medium text-[#FDFDFD]/70">SUPPLY</th>
              <th className="text-right p-4 text-sm font-medium text-[#FDFDFD]/70">OWNERS</th>
              <th className="text-center p-4 text-sm font-medium text-[#FDFDFD]/70">
                <MoreHorizontal className="w-4 h-4" />
              </th>
            </tr>
          </thead>
          <tbody>
            {currentCollections.map((collection) => (
              <tr 
                key={collection.name} 
                className="border-b border-[#FDFDFD]/5 hover:bg-[#FDFDFD]/5 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWatchlistToggle(collection.name)}
                      className="p-0 h-6 w-6 hover:bg-[#FDFDFD]/10"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          collection.isWatchlisted 
                            ? 'text-[#A20131] fill-[#A20131]' 
                            : 'text-[#FDFDFD]/50'
                        }`} 
                      />
                    </Button>
                    <span className="text-[#FDFDFD] font-medium">{collection.rank}</span>
                  </div>
                </td>
                
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Collection Image with Navigation - HÍBRIDO */}
                    <div 
                      onClick={() => navigateToItem(collection.originalItem || collection)}
                      className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#FDFDFD]/10 hover:ring-2 hover:ring-[#A20131]/50 transition-all cursor-pointer"
                    >
                      {collection.imageUrl && 
                       collection.imageUrl !== '' && 
                       !collection.imageUrl.includes('undefined') && 
                       !collection.imageUrl.includes('null') ? (
                        <img
                          src={collection.imageUrl}
                          alt={collection.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/fallback.svg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-xs bg-gray-900 rounded">
                          {collection.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div
                        className="font-semibold text-[#FDFDFD] flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={() => navigateToItem(collection.originalItem || collection)}
                      >
                        {collection.name}
                        {collection.category === 'jersey' && (
                          <Badge variant="secondary" className="bg-[#A20131]/20 text-[#A20131] text-xs">
                            Jersey
                          </Badge>
                        )}
                        {collection.category === 'stadium' && (
                          <Badge variant="secondary" className="bg-[#FDFDFD]/20 text-[#FDFDFD] text-xs">
                            Stadium
                          </Badge>
                        )}
                        {collection.category === 'badge' && (
                          <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD]/70 text-xs">
                            Badge
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#FDFDFD]/50">
                        CHZ Fan Tokens
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="p-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[#FDFDFD] font-medium">
                      Ⓒ {collection.floorPrice.toFixed(2)}
                    </span>
                    {renderChange(collection.floorPriceChange, false)}
                  </div>
                </td>
                
                <td className="p-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[#FDFDFD] font-medium">
                      Ⓒ {collection.volume24h.toFixed(2)}K
                    </span>
                    {renderChange(collection.volumeChange, false)}
                  </div>
                </td>
                
                <td className="p-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[#FDFDFD] font-medium">
                      {collection.sales24h.toLocaleString()}
                    </span>
                    {renderChange(collection.salesChange, false)}
                  </div>
                </td>
                
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    {renderTrendChart(collection.trendData)}
                  </div>
                </td>
                
                <td className="p-4 text-right">
                  <span className="text-[#FDFDFD] font-medium">
                    {collection.supply.toLocaleString()}
                  </span>
                </td>
                
                <td className="p-4 text-right">
                  <span className="text-[#FDFDFD] font-medium">
                    {collection.owners.toLocaleString()}
                  </span>
                </td>
                
                {/* Ações removidas (toggle não utilizado) */}
                <td className="p-4 text-center"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#FDFDFD]/10">
          <div className="text-sm text-[#FDFDFD]/70">
            Showing {startIndex + 1} to {Math.min(endIndex, collections.length)} of {collections.length} collections
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-transparent border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 p-0 ${
                    currentPage === page
                      ? 'bg-[#A20131] text-[#FDFDFD]'
                      : 'bg-transparent border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10'
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-transparent border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 