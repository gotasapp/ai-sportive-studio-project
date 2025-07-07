'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  TrendingUp, ExternalLink, Heart, Eye, ChevronUp, ChevronDown,
  Coins, Clock, Users, Star, Filter, Search, Grid, List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MarketplaceItem {
  name: string
  imageUrl: string
  price: string
  description?: string
  category?: string
  createdAt?: string
  likes?: number
  views?: number
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

interface ProfessionalMarketplaceProps {
  items: MarketplaceItem[]
  isLoading: boolean
  onItemClick?: (item: MarketplaceItem) => void
  onViewAll?: () => void
  title?: string
  showSearch?: boolean
  showFilters?: boolean
  maxItems?: number
}

export default function ProfessionalMarketplace({
  items,
  isLoading,
  onItemClick,
  onViewAll,
  title = "Trending NFTs",
  showSearch = false,
  showFilters = false,
  maxItems = 6
}: ProfessionalMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  }).slice(0, maxItems)

  // Get unique categories
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))

  const handleScroll = (direction: 'up' | 'down') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const itemHeight = 120 // Approximate height of each item
    const scrollAmount = itemHeight * 2

    if (direction === 'up') {
      container.scrollBy({ top: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    }
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatPrice = (price: string) => {
    return price.includes('CHZ') ? price : `${price} CHZ`
  }

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-[#333333]/20 rounded-lg animate-pulse">
          <div className="w-16 h-16 bg-[#333333]/50 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#333333]/50 rounded w-3/4"></div>
            <div className="h-3 bg-[#333333]/50 rounded w-1/2"></div>
            <div className="h-3 bg-[#333333]/50 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGridItem = (item: MarketplaceItem, index: number) => (
    <Card 
      key={index}
      className="bg-[#333333]/20 border-[#333333] hover:border-[#A20131]/50 transition-all duration-200 cursor-pointer group"
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-3">
        <div className="relative mb-3">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-24 object-cover rounded-lg bg-[#333333]/30"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {item.rarity && (
              <Badge className={cn("text-xs", getRarityColor(item.rarity))}>
                {item.rarity}
              </Badge>
            )}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#FDFDFD] truncate">{item.name}</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A20131] font-medium">{formatPrice(item.price)}</span>
            <div className="flex items-center gap-2 text-xs text-[#ADADAD]">
              {item.likes && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{item.likes}</span>
                </div>
              )}
              {item.views && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{item.views}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderListItem = (item: MarketplaceItem, index: number) => (
    <div 
      key={index}
      className="flex items-center gap-3 p-3 bg-[#333333]/20 hover:bg-[#333333]/30 rounded-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onItemClick?.(item)}
    >
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg bg-[#333333]/30"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <ExternalLink className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm font-medium text-[#FDFDFD] truncate">{item.name}</h4>
          {item.rarity && (
            <Badge className={cn("text-xs ml-2", getRarityColor(item.rarity))}>
              {item.rarity}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A20131] font-medium">{formatPrice(item.price)}</span>
          <div className="flex items-center gap-2 text-xs text-[#ADADAD]">
            {item.likes && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{item.likes}</span>
              </div>
            )}
          </div>
        </div>
        
        {item.description && (
          <p className="text-xs text-[#ADADAD] truncate mt-1">{item.description}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#A20131]" />
          <h3 className="text-sm font-semibold text-[#FDFDFD]">{title}</h3>
          <Badge variant="secondary" className="text-xs bg-transparent text-[#ADADAD] border-[#333333]" style={{ borderWidth: '0.5px', borderColor: '#333333' }}>
            {filteredItems.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                >
                  {viewMode === 'grid' ? <List className="h-3 w-3" /> : <Grid className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle view mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#ADADAD]" />
              <Input
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 bg-[#111011] border-[#333333] text-[#FDFDFD] text-xs"
              />
            </div>
          )}
          
          {showFilters && categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-xs h-6 px-2"
              >
                All
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category || null)}
                  className="text-xs h-6 px-2"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {/* Scroll Controls */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleScroll('up')}
            className="w-6 h-6 p-0 bg-[#333333]/50 hover:bg-[#333333]/70 text-[#ADADAD] hover:text-[#FDFDFD]"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleScroll('down')}
            className="w-6 h-6 p-0 bg-[#333333]/50 hover:bg-[#333333]/70 text-[#ADADAD] hover:text-[#FDFDFD]"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Items Container */}
        <div
          ref={scrollContainerRef}
          className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-[#333333]/20 scrollbar-thumb-[#A20131]/50 hover:scrollbar-thumb-[#A20131]/70"
        >
          {isLoading ? (
            renderLoadingSkeleton()
          ) : filteredItems.length > 0 ? (
            <div className={cn(
              "space-y-3",
              viewMode === 'grid' && "grid grid-cols-1 gap-3"
            )}>
              {filteredItems.map((item, index) => 
                viewMode === 'grid' ? renderGridItem(item, index) : renderListItem(item, index)
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#333333]/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-[#ADADAD]" />
              </div>
              <p className="text-sm text-[#ADADAD] mb-2">No NFTs found</p>
              <p className="text-xs text-[#ADADAD]">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {onViewAll && filteredItems.length > 0 && (
        <div className="pt-3 border-t border-[#333333]">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="w-full text-xs bg-[#333333]/20 border-[#333333] text-[#FDFDFD] hover:bg-[#333333]/40"
          >
            View All in Marketplace
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
} 