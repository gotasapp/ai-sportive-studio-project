'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
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
}

interface CollectionsTableProps {
  viewType: ViewType
  timeFilter: TimeFilter
  priceSort: PriceSort
  tokenType: TokenType
  activeTab: CollectionTab
  searchTerm: string
  onToggleWatchlist?: (collectionName: string) => void
}

export default function CollectionsTable({
  viewType,
  timeFilter,
  priceSort,
  tokenType,
  activeTab,
  searchTerm,
  onToggleWatchlist
}: CollectionsTableProps) {
  const [collections, setCollections] = useState<CollectionStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollectionData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Buscar dados reais das APIs
        const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
          fetch('/api/jerseys'),
          fetch('/api/stadiums'),
          fetch('/api/badges')
        ])

        if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
          throw new Error('Failed to fetch collection data')
        }

        const jerseys: NFTData[] = await jerseysResponse.json()
        const stadiums: NFTData[] = await stadiumsResponse.json()
        const badges: NFTData[] = await badgesResponse.json()

        // Gerar estatísticas realísticas baseadas nos dados reais
        const generateTrendData = () => 
          Array.from({ length: 7 }, () => Math.random() * 100)

        const collectionsData: CollectionStat[] = []

        // Jersey Collection
        if (jerseys.length > 0) {
          collectionsData.push({
            rank: 1,
            name: 'Jersey Collection',
            imageUrl: jerseys[0].imageUrl,
            floorPrice: 0.05,
            floorPriceChange: 15.2,
            volume24h: jerseys.length * 0.05 * 2.3,
            volumeChange: 8.5,
            sales24h: Math.floor(jerseys.length * 0.3),
            salesChange: 12.1,
            supply: jerseys.length,
            owners: Math.floor(jerseys.length * 0.7),
            category: 'jersey',
            trendData: generateTrendData(),
            isWatchlisted: false,
            isOwned: false
          })
        }

        // Stadium Collection
        if (stadiums.length > 0) {
          collectionsData.push({
            rank: 2,
            name: 'Stadium Collection',
            imageUrl: stadiums[0].imageUrl,
            floorPrice: 0.15,
            floorPriceChange: -5.8,
            volume24h: stadiums.length * 0.15 * 1.8,
            volumeChange: -12.3,
            sales24h: Math.floor(stadiums.length * 0.4),
            salesChange: -8.2,
            supply: stadiums.length,
            owners: Math.floor(stadiums.length * 0.6),
            category: 'stadium',
            trendData: generateTrendData(),
            isWatchlisted: true,
            isOwned: false
          })
        }

        // Badge Collection
        if (badges.length > 0) {
          collectionsData.push({
            rank: 3,
            name: 'Badge Collection',
            imageUrl: badges[0].imageUrl,
            floorPrice: 0.03,
            floorPriceChange: 25.4,
            volume24h: badges.length * 0.03 * 3.2,
            volumeChange: 18.7,
            sales24h: Math.floor(badges.length * 0.5),
            salesChange: 22.8,
            supply: badges.length,
            owners: Math.floor(badges.length * 0.8),
            category: 'badge',
            trendData: generateTrendData(),
            isWatchlisted: false,
            isOwned: true
          })
        }

        // Aplicar filtros
        let filteredCollections = collectionsData

        // Filtro por tipo de token
        if (tokenType !== 'all') {
          const categoryMap = {
            'jerseys': 'jersey',
            'stadiums': 'stadium',
            'badges': 'badge'
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

        setCollections(filteredCollections)

      } catch (error: any) {
        console.error('❌ Error fetching collection data:', error)
        setError(error.message || 'Failed to load collection data')
        setCollections([])
      } finally {
        setLoading(false)
      }
    }

    fetchCollectionData()
  }, [timeFilter, priceSort, tokenType, activeTab, searchTerm])

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

  const handleWatchlistToggle = (collectionName: string) => {
    if (onToggleWatchlist) {
      onToggleWatchlist(collectionName)
    }
    // Update local state
    setCollections(prev => prev.map(c => 
      c.name === collectionName 
        ? { ...c, isWatchlisted: !c.isWatchlisted }
        : c
    ))
  }

  if (loading) {
    return (
      <div className="bg-[#000000] rounded-lg border border-[#FDFDFD]/10 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#A20131] animate-spin mr-3" />
          <span className="text-[#FDFDFD]/70">Loading collections...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#000000] rounded-lg border border-[#FDFDFD]/10 p-6">
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

  if (collections.length === 0) {
    return (
      <div className="bg-[#000000] rounded-lg border border-[#FDFDFD]/10 p-6">
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
    <div className="bg-[#000000] rounded-lg border border-[#FDFDFD]/10 overflow-hidden">
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
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#FDFDFD]/10">
                      <Image
                        src={collection.imageUrl}
                        alt={collection.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#FDFDFD] flex items-center gap-2">
                        {collection.name}
                        {collection.category === 'jersey' && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                            Jersey
                          </Badge>
                        )}
                        {collection.category === 'stadium' && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                            Stadium
                          </Badge>
                        )}
                        {collection.category === 'badge' && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
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
                
                <td className="p-4 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4 text-[#FDFDFD]/70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="bg-[#000000] border-[#FDFDFD]/20"
                    >
                      <DropdownMenuItem className="text-[#FDFDFD] hover:bg-[#FDFDFD]/10">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Collection
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
                        onClick={() => handleWatchlistToggle(collection.name)}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {collection.isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 