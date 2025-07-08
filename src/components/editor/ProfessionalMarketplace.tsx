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
          <div className="w-16 h-16 bg-[#333333]/50 rounded-lg lg:w-16 lg:h-16 max-lg:w-12 max-lg:h-12"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#333333]/50 rounded w-3/4 max-lg:h-3"></div>
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
      className="bg-[#333333]/20 border-[#333333] hover:border-[#A20131]/50 transition-all duration-200 cursor-pointer group marketplace-card"
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-3 max-lg:p-2">
        <div className="relative mb-3 max-lg:mb-2">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-24 object-cover rounded-lg bg-[#333333]/30 lg:h-24 max-lg:h-16"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 max-lg:top-1 max-lg:right-1">
            {item.rarity && (
              <Badge className={cn("text-xs max-lg:text-[10px] max-lg:px-1 max-lg:py-0", getRarityColor(item.rarity))}>
                {item.rarity}
              </Badge>
            )}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-lg:w-3 max-lg:h-3" />
          </div>
        </div>
        
        <div className="space-y-2 max-lg:space-y-1">
          <h4 className="text-sm font-medium text-[#FDFDFD] truncate max-lg:text-xs">{item.name}</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A20131] font-medium max-lg:text-[10px]">{formatPrice(item.price)}</span>
            <div className="flex items-center gap-2 text-xs text-[#ADADAD] max-lg:text-[10px] max-lg:gap-1">
              {item.likes && (
                <div className="flex items-center gap-1 max-lg:gap-0.5">
                  <Heart className="w-3 h-3 max-lg:w-2 max-lg:h-2" />
                  <span>{item.likes}</span>
                </div>
              )}
              {item.views && (
                <div className="flex items-center gap-1 max-lg:gap-0.5">
                  <Eye className="w-3 h-3 max-lg:w-2 max-lg:h-2" />
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
      className="flex items-center gap-3 p-3 bg-[#333333]/20 hover:bg-[#333333]/30 rounded-lg transition-all duration-200 cursor-pointer group max-lg:gap-2 max-lg:p-2"
      onClick={() => onItemClick?.(item)}
    >
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg bg-[#333333]/30 lg:w-16 lg:h-16 max-lg:w-12 max-lg:h-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <ExternalLink className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-lg:w-2 max-lg:h-2" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm font-medium text-[#FDFDFD] truncate max-lg:text-xs">{item.name}</h4>
          {item.rarity && (
            <Badge className={cn("text-xs ml-2 max-lg:text-[10px] max-lg:ml-1 max-lg:px-1 max-lg:py-0", getRarityColor(item.rarity))}>
              {item.rarity}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A20131] font-medium max-lg:text-[10px]">{formatPrice(item.price)}</span>
          <div className="flex items-center gap-2 text-xs text-[#ADADAD] max-lg:text-[10px] max-lg:gap-1">
            {item.likes && (
              <div className="flex items-center gap-1 max-lg:gap-0.5">
                <Heart className="w-3 h-3 max-lg:w-2 max-lg:h-2" />
                <span>{item.likes}</span>
              </div>
            )}
            {item.views && (
              <div className="flex items-center gap-1 max-lg:gap-0.5">
                <Eye className="w-3 h-3 max-lg:w-2 max-lg:h-2" />
                <span>{item.views}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 max-lg:mb-2">
        <div className="flex items-center justify-between mb-3 max-lg:mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#A20131] max-lg:w-3 max-lg:h-3" />
            <h3 className="font-semibold text-[#FDFDFD] text-sm max-lg:text-xs">{title}</h3>
          </div>
          <div className="flex items-center gap-2 max-lg:gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] p-1 h-auto responsive-hide-mobile"
                  >
                    {viewMode === 'grid' ? <List className="w-3 h-3" /> : <Grid className="w-3 h-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Switch to {viewMode === 'grid' ? 'list' : 'grid'} view
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {onViewAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-[#A20131] hover:text-[#FDFDFD] text-xs px-2 py-1 h-auto max-lg:text-[10px] max-lg:px-1"
              >
                View All
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters - Desktop only */}
        {(showSearch || showFilters) && (
          <div className="space-y-2 mb-3 responsive-hide-mobile">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[#ADADAD]" />
                <Input
                  placeholder="Search NFTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-[#333333]/20 border-[#333333] text-xs text-[#FDFDFD] placeholder-[#ADADAD]"
                />
              </div>
            )}
            
            {showFilters && categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs px-2 py-1 h-auto"
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {isLoading ? (
          renderLoadingSkeleton()
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 max-lg:h-24">
            <p className="text-[#ADADAD] text-sm max-lg:text-xs">No NFTs found</p>
          </div>
        ) : (
          <>
            {/* Desktop: Scrollable container */}
            <div 
              ref={scrollContainerRef}
              className="h-full overflow-y-auto overflow-x-hidden space-y-3 pr-2 scrollbar-hide lg:block hidden"
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map(renderGridItem)}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map(renderListItem)}
                </div>
              )}
            </div>

            {/* Mobile: Horizontal scroll carousel */}
            <div className="lg:hidden block">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filteredItems.map((item, index) => (
                  <div key={index} className="flex-shrink-0 w-32 marketplace-card-mobile">
                    <Card 
                      className="bg-[#333333]/20 border-[#333333] hover:border-[#A20131]/50 transition-all duration-200 cursor-pointer group h-full"
                      onClick={() => onItemClick?.(item)}
                    >
                      <CardContent className="p-2">
                        <div className="relative mb-1">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-16 object-cover rounded bg-[#333333]/30"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded flex items-center justify-center">
                            <ExternalLink className="w-2 h-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-medium text-[#FDFDFD] truncate">{item.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-[#A20131] font-medium">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Controls - Desktop only */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col gap-1 responsive-hide-mobile">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleScroll('up')}
                className="w-6 h-6 p-0 bg-[#333333]/50 hover:bg-[#A20131]/50 text-[#ADADAD] hover:text-[#FDFDFD]"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleScroll('down')}
                className="w-6 h-6 p-0 bg-[#333333]/50 hover:bg-[#A20131]/50 text-[#ADADAD] hover:text-[#FDFDFD]"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 