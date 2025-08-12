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
import { ViewType, TimeFilter, PriceSort, TokenType, CollectionTab } from './MarketplaceFilters'


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
}

interface CollectionsTableProps {
  viewType: ViewType
  timeFilter: TimeFilter
  priceSort: PriceSort
  tokenType: TokenType
  activeTab: CollectionTab
  searchTerm: string
  onToggleWatchlist?: (collectionName: string) => void
  marketplaceData?: any[]
}

export default function CollectionsTable({
  viewType,
  timeFilter,
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
  const account = useActiveAccount()
  const router = useRouter()

  const navigateToCollection = (c: CollectionStat) => {
    try {
      // Regras:
      // - Launchpad e Custom (coleções novas) 
      //   → página de coleção com id: /marketplace/collection/jersey/{collectionId}
      // - Contrato antigo (coleções base por tipo)
      //   → página agregada por tipo: /marketplace/collection/{category}
      if ((c.isCustomCollection || c.category === 'launchpad') && c.collectionId) {
        router.push(`/marketplace/collection/jersey/${c.collectionId}`)
        return
      }
      const cat = (c.category === 'custom') ? 'jersey' : c.category
      router.push(`/marketplace/collection/${cat}`)
    } catch (e) {
      console.warn('Failed to navigate to collection', e)
    }
  }

  useEffect(() => {
    const processCollectionData = () => {
      console.log('🚀 processCollectionData CALLED!');
      console.log('📥 marketplaceData received:', marketplaceData);
      console.log('📏 marketplaceData.length:', marketplaceData?.length);
      
      setLoading(true)
      setError(null)
      
      try {
        // Usar dados do marketplace que já funcionam
        console.log('🎯 Processing collection data from marketplace:', marketplaceData.length, 'items');
        console.log('🔍 Marketplace data sample:', marketplaceData[0]);
        console.log('🔍 Sample categories found:', marketplaceData.slice(0, 5).map(item => ({ name: item.name, category: item.category })));
        
        // Separar NFTs por categoria (com fallback baseado no nome se category não estiver definida)
        const jerseys = marketplaceData.filter(item => {
          if (item.category === 'jersey') return true;
          // Fallback: detectar jersey pelo nome/descrição
          const name = (item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          return name.includes('jersey') || description.includes('jersey') || 
                 name.includes('#') || description.includes('ai-generated') ||
                 (name.includes(' ') && name.match(/\b\w+\s+\w+\s+#\d+/)); // Pattern: "Team Player #Number"
        });
        
        const stadiums = marketplaceData.filter(item => {
          if (item.category === 'stadium') return true;
          const name = (item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          return name.includes('stadium') || description.includes('stadium') ||
                 name.includes('arena') || description.includes('arena');
        });
        
        const badges = marketplaceData.filter(item => {
          if (item.category === 'badge') return true;
          const name = (item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          return name.includes('badge') || description.includes('badge') ||
                 name.includes('achievement') || description.includes('achievement');
        });
        
        // Launchpad Collections
        const launchpadCollections = marketplaceData.filter(item => {
          return item.type === 'launchpad_collection' || item.category === 'launchpad_collection';
        });
        
        console.log('📊 Categories breakdown:', {
          total: marketplaceData.length,
          jerseys: jerseys.length,
          stadiums: stadiums.length,
          badges: badges.length,
          launchpadCollections: launchpadCollections.length
        });
        
        // 🔍 DEBUG: Verificar imagens das coleções
        console.log('🖼️ Launchpad Collections Image Debug:', launchpadCollections.map(item => ({
          name: item.name,
          hasImage: !!item.image,
          hasImageUrl: !!item.imageUrl,
          hasMetadataImage: !!item.metadata?.image,
          imageValue: item.image || item.imageUrl || item.metadata?.image,
          imageType: typeof (item.image || item.imageUrl || item.metadata?.image)
        })));

        // Gerar estatísticas realísticas baseadas nos dados reais
        const generateTrendData = () => 
          Array.from({ length: 7 }, () => Math.random() * 100)

        console.log('🎲 About to create collections array');
        const collectionsData: CollectionStat[] = []
        console.log('✅ Collections array created:', collectionsData);

        // ESTRATÉGIA SIMPLIFICADA: 
        // - Jersey, Stadium, Badge = IMAGENS FIXAS
        // - Launchpad Collections = IMAGENS ORIGINAIS

        // Função para calcular estatísticas reais
        const calculateRealStats = (categoryItems: any[], categoryName: string) => {
          const listedItems = categoryItems.filter(item => item.isListed || item.isAuction);
          const prices = listedItems.map(item => {
            const price = parseFloat(item.price?.replace(' MATIC', '') || '0');
            return isNaN(price) ? 0 : price;
          }).filter(price => price > 0);
          
          const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const totalVolume = prices.reduce((sum, price) => sum + price, 0);
          const avgPrice = prices.length > 0 ? totalVolume / prices.length : 0;
          
          return {
            floorPrice,
            volume24h: totalVolume,
            sales24h: listedItems.length,
            supply: categoryItems.length,
            owners: Array.from(new Set(categoryItems.map(item => item.owner || item.creator?.wallet || 'unknown').filter(owner => owner !== 'unknown'))).length || 1
          };
        };

        // Jersey Collection - IMAGEM FIXA GARANTIDA
        console.log('👕 Creating Jersey Collection with FIXED IMAGE...');
        const jerseyImage = getCollectionImage('Jersey Collection');
        
        const jerseyStats = jerseys.length > 0 ? calculateRealStats(jerseys, 'jersey') : {
          floorPrice: 0, volume24h: 0, sales24h: 0, supply: 0, owners: 1
        };
        
        collectionsData.push({
          rank: 1,
          name: 'Jersey Collection',
          imageUrl: jerseyImage,
          floorPrice: jerseyStats.floorPrice,
            floorPriceChange: 0, // Sem dados históricos, mantém neutro
            volume24h: jerseyStats.volume24h,
            volumeChange: 0, // Sem dados históricos, mantém neutro
            sales24h: jerseyStats.sales24h,
            salesChange: 0, // Sem dados históricos, mantém neutro
            supply: jerseyStats.supply,
            owners: jerseyStats.owners,
            category: 'jersey',
            trendData: generateTrendData(),
            isWatchlisted: false,
            isOwned: false
          });

        // Stadium Collection - IMAGEM FIXA GARANTIDA
        console.log('🏟️ Creating Stadium Collection with FIXED IMAGE...');
        const stadiumImage = getCollectionImage('Stadium Collection');
        
        const stadiumStats = stadiums.length > 0 ? calculateRealStats(stadiums, 'stadium') : {
          floorPrice: 0, volume24h: 0, sales24h: 0, supply: 0, owners: 1
        };
        
        collectionsData.push({
          rank: 2,
          name: 'Stadium Collection',
          imageUrl: stadiumImage,
          floorPrice: stadiumStats.floorPrice,
            floorPriceChange: 0, // Sem dados históricos, mantém neutro
            volume24h: stadiumStats.volume24h,
            volumeChange: 0, // Sem dados históricos, mantém neutro
            sales24h: stadiumStats.sales24h,
            salesChange: 0, // Sem dados históricos, mantém neutro
            supply: stadiumStats.supply,
            owners: stadiumStats.owners,
            category: 'stadium',
            trendData: generateTrendData(),
            isWatchlisted: true,
            isOwned: false
          });

        // Badge Collection - IMAGEM FIXA GARANTIDA
        console.log('🏆 Creating Badge Collection with FIXED IMAGE...');
        const badgeImage = getCollectionImage('Badge Collection');
        
        const badgeStats = badges.length > 0 ? calculateRealStats(badges, 'badge') : {
          floorPrice: 0, volume24h: 0, sales24h: 0, supply: 0, owners: 1
        };
        
        collectionsData.push({
          rank: 3,
          name: 'Badge Collection',
          imageUrl: badgeImage,
          floorPrice: badgeStats.floorPrice,
            floorPriceChange: 0, // Sem dados históricos, mantém neutro
            volume24h: badgeStats.volume24h,
            volumeChange: 0, // Sem dados históricos, mantém neutro
            sales24h: badgeStats.sales24h,
            salesChange: 0, // Sem dados históricos, mantém neutro
            supply: badgeStats.supply,
            owners: badgeStats.owners,
            category: 'badge',
            trendData: generateTrendData(),
            isWatchlisted: false,
            isOwned: true
          });

        // Launchpad Collections - USAR IMAGEM DIRETA DO BANCO
        launchpadCollections.forEach((collection, index) => {
          // SOLUÇÃO DIRETA: usar imageUrl diretamente do banco, com validação e normalização
          let dbImageUrl = collection.image || collection.imageUrl || collection.metadata?.image || collection.collectionData?.image || collection.collectionData?.imageUrl;
          
          // Validar e normalizar imagem
          if (dbImageUrl && !dbImageUrl.includes('undefined') && !dbImageUrl.includes('null') && dbImageUrl.trim() !== '') {
            // Normalizar IPFS URLs se necessário
            if (dbImageUrl.startsWith('ipfs://') || dbImageUrl.startsWith('Qm') || dbImageUrl.startsWith('bafy')) {
              dbImageUrl = normalizeIpfsUri(dbImageUrl);
            }
          } else {
            // Fallback para imagem padrão se não houver imagem válida
            dbImageUrl = getCollectionImage('default');
          }
          
          // Calcular estatísticas específicas para launchpad
          const calculateLaunchpadStats = (collection: any) => {
            const totalSupply = collection.marketplace?.totalUnits || collection.collectionData?.totalSupply || 100;
            const mintedUnits = collection.marketplace?.mintedUnits || collection.collectionData?.minted || 0;
            const availableUnits = collection.marketplace?.availableUnits || (totalSupply - mintedUnits);
            const price = parseFloat(collection.collectionData?.price || '0');
            
            return {
              floorPrice: price,
              volume24h: mintedUnits * price, // Volume baseado no mintado
              sales24h: mintedUnits,
              supply: totalSupply,
              owners: collection.stats?.uniqueOwners || 1
            };
          };

          const stats = calculateLaunchpadStats(collection);
          collectionsData.push({
            rank: collectionsData.length + 1,
            name: collection.metadata?.name || collection.name || 'Launchpad Collection',
            imageUrl: dbImageUrl, // USAR DIRETAMENTE DO BANCO SEM FILTROS
            floorPrice: stats.floorPrice,
            floorPriceChange: 0,
            volume24h: stats.volume24h,
            volumeChange: 0,
            sales24h: stats.sales24h,
            salesChange: 0,
            supply: stats.supply,
            owners: stats.owners,
            category: 'launchpad',
            trendData: generateTrendData(),
            isWatchlisted: false,
            isOwned: false,
            collectionId: collection.collectionData?._id || collection.customCollectionId || collection._id,
            isCustomCollection: true
          });
        });

        // Custom Collections - USAR IMAGEM DIRETA DO BANCO
        const customCollections = marketplaceData.filter(item => {
          return item.type === 'custom_collection' || item.category === 'custom_collection';
        });
        
        customCollections.forEach((collection, index) => {
          // SOLUÇÃO DIRETA: usar imageUrl diretamente do banco, com validação e normalização
          let dbImageUrl = collection.image || collection.imageUrl || collection.metadata?.image || collection.collectionData?.image || collection.collectionData?.imageUrl;
          
          // Validar e normalizar imagem
          if (dbImageUrl && !dbImageUrl.includes('undefined') && !dbImageUrl.includes('null') && dbImageUrl.trim() !== '') {
            // Normalizar IPFS URLs se necessário
            if (dbImageUrl.startsWith('ipfs://') || dbImageUrl.startsWith('Qm') || dbImageUrl.startsWith('bafy')) {
              dbImageUrl = normalizeIpfsUri(dbImageUrl);
            }
          } else {
            // Fallback para imagem padrão se não houver imagem válida
            dbImageUrl = getCollectionImage('default');
          }
          
          // Calcular estatísticas específicas para custom collections
          const calculateCustomStats = (collection: any) => {
            const totalSupply = collection.marketplace?.totalUnits || collection.collectionData?.totalSupply || 100;
            const mintedUnits = collection.marketplace?.mintedUnits || collection.collectionData?.minted || 0;
            const availableUnits = collection.marketplace?.availableUnits || (totalSupply - mintedUnits);
            const price = parseFloat(collection.collectionData?.price || '0');
            
            return {
              floorPrice: price,
              volume24h: mintedUnits * price, // Volume baseado no mintado
              sales24h: mintedUnits,
              supply: totalSupply,
              owners: collection.stats?.uniqueOwners || 1
            };
          };

          const stats = calculateCustomStats(collection);
          collectionsData.push({
            rank: collectionsData.length + 1,
            name: collection.metadata?.name || collection.name || 'Custom Collection',
            imageUrl: dbImageUrl, // USAR DIRETAMENTE DO BANCO
            floorPrice: stats.floorPrice,
            floorPriceChange: 0,
            volume24h: stats.volume24h,
            volumeChange: 0,
            sales24h: stats.sales24h,
            salesChange: 0,
            supply: stats.supply,
            owners: stats.owners,
            category: 'custom',
            trendData: generateTrendData(),
            isWatchlisted: false,
            isOwned: false,
            collectionId: collection.customCollectionId || collection._id,
            isCustomCollection: true
          });
        });

        // Aplicar filtros
        let filteredCollections = collectionsData

        // Filtro por tipo de token
        if (tokenType !== 'all') {
          const categoryMap = {
            'jerseys': 'jersey',
            'stadiums': 'stadium',
            'badges': 'badge',
            'launchpad': 'launchpad',
            'custom': 'custom'
          }
          filteredCollections = filteredCollections.filter(c => 
            c.category === categoryMap[tokenType as keyof typeof categoryMap]
          )
        }

        // Filtro por tab
        if (activeTab === 'watchlist') {
          filteredCollections = filteredCollections.filter(c => c.isWatchlisted)
        } else if (activeTab === 'owned') {
          filteredCollections = filteredCollections.filter(c => c.isOwned)
        }

        // Filtro por busca
        if (searchTerm.trim()) {
          filteredCollections = filteredCollections.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Ordenação
        switch (priceSort) {
          case 'low-to-high':
            filteredCollections.sort((a, b) => a.floorPrice - b.floorPrice)
            break
          case 'high-to-low':
            filteredCollections.sort((a, b) => b.floorPrice - a.floorPrice)
            break
          case 'volume-desc':
            filteredCollections.sort((a, b) => b.volume24h - a.volume24h)
            break
          case 'volume-asc':
            filteredCollections.sort((a, b) => a.volume24h - b.volume24h)
            break
        }

        // Reordenar ranks
        filteredCollections.forEach((collection, index) => {
          collection.rank = index + 1
        })

        console.log('✅ Final collections to display:', filteredCollections.length);
        console.log('📋 Collections data:', filteredCollections);
        setCollections(filteredCollections)

      } catch (error: any) {
        console.error('❌ Error processing collection data:', error)
        setError(error.message || 'Failed to process collection data')
        setCollections([])
      } finally {
        setLoading(false)
      }
    }

    processCollectionData()
  }, [timeFilter, priceSort, tokenType, activeTab, searchTerm, marketplaceData])

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
            {collections.map((collection) => (
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
                    {/* Collection Image with Navigation */}
                    <div 
                      onClick={() => navigateToCollection(collection)}
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
                            target.src = '/api/placeholder/400/400';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-xs bg-gray-900 rounded">
                          {collection.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[#FDFDFD] flex items-center gap-2">
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
    </div>
  )
} 