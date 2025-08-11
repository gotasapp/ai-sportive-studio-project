'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  Table, 

  ChevronDown,
  Star,
  Wallet,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ViewType = 'grid' | 'table'
export type TimeFilter = '24h' | '7d' | '30d' | 'all'
export type PriceSort = 'low-to-high' | 'high-to-low' | 'volume-desc' | 'volume-asc'
export type TokenType = 'all' | 'jerseys' | 'stadiums' | 'badges' | 'launchpad'
export type CollectionTab = 'all' | 'watchlist' | 'owned'

interface MarketplaceFiltersProps {
  // Tab States
  activeTab: CollectionTab
  onTabChange: (tab: CollectionTab) => void
  
  // Time Filter
  timeFilter: TimeFilter
  onTimeFilterChange: (time: TimeFilter) => void
  
  // Sort & Type
  priceSort: PriceSort
  onPriceSortChange: (sort: PriceSort) => void
  tokenType: TokenType
  onTokenTypeChange: (type: TokenType) => void
  
  // View
  viewType: ViewType
  onViewChange: (view: ViewType) => void
  
  // Search
  searchTerm: string
  onSearchChange: (term: string) => void
  
  // Counters
  totalCollections: number
  watchlistCount: number
  ownedCount: number
  

}

export default function MarketplaceFilters({
  activeTab,
  onTabChange,
  timeFilter,
  onTimeFilterChange,
  priceSort,
  onPriceSortChange,
  tokenType,
  onTokenTypeChange,
  viewType,
  onViewChange,
  searchTerm,
  onSearchChange,
  totalCollections,
  watchlistCount,
  ownedCount
}: MarketplaceFiltersProps) {
  
  const timeFilterOptions = [
    { value: '24h', label: '24H', icon: Calendar },
    { value: '7d', label: '7D', icon: Calendar },
    { value: '30d', label: '30D', icon: Calendar },
    { value: 'all', label: 'All', icon: Calendar }
  ]
  
  const viewOptions = [
    { value: 'table', icon: Table, label: 'Table' },
    { value: 'grid', icon: Grid3X3, label: 'Grid' }
  ]

  return (
    <div className="bg-transparent border-b border-[#FDFDFD]/10">
      <div className="w-full py-4 space-y-4">
              {/* Header */}
        <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold text-[#FDFDFD]">Collections</h1>
      </div>

      {/* Tabs moved to replace Last Updated Info */}
      <div className="flex items-center justify-between w-full">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as CollectionTab)}>
          <TabsList className="bg-[#000000] border-[#FDFDFD]/10">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-[#A20131] data-[state=active]:text-[#FDFDFD]"
          >
            All collections
          </TabsTrigger>
          <TabsTrigger 
            value="watchlist" 
            className="data-[state=active]:bg-[#A20131] data-[state=active]:text-[#FDFDFD]"
          >
            <Star className="w-4 h-4 mr-2" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger 
            value="owned" 
            className="data-[state=active]:bg-[#A20131] data-[state=active]:text-[#FDFDFD]"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Owned collections
          </TabsTrigger>
        </TabsList>
      </Tabs>
        
        <div className="flex items-center gap-2">
          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#000000] border border-[#FDFDFD]/20 rounded-lg p-1">
            {timeFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeFilter === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onTimeFilterChange(option.value as TimeFilter)}
                className={`h-8 px-3 text-xs ${
                  timeFilter === option.value 
                    ? 'bg-[#A20131] text-[#FDFDFD]' 
                    : 'text-[#FDFDFD]/70 hover:text-[#FDFDFD] hover:bg-[#FDFDFD]/10'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Token Type Dropdown */}
          <Select value={tokenType} onValueChange={(value) => onTokenTypeChange(value as TokenType)}>
            <SelectTrigger className="w-40 bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] justify-between">
              <div className="flex-1 text-center">
                <SelectValue placeholder="Token type" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#000000] border-[#FDFDFD]/20">
              <SelectItem value="all" className="text-center">All</SelectItem>
              <SelectItem value="jerseys" className="text-center">Jerseys</SelectItem>
              <SelectItem value="stadiums" className="text-center">Stadiums</SelectItem>
              <SelectItem value="badges" className="text-center">Badges</SelectItem>
              <SelectItem value="launchpad" className="text-center">Launchpad</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Sort Dropdown */}
          <Select value={priceSort} onValueChange={(value) => onPriceSortChange(value as PriceSort)}>
            <SelectTrigger className="w-48 bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] justify-between">
              <div className="flex-1 text-center">
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#000000] border-[#FDFDFD]/20">
              <SelectItem value="low-to-high" className="text-center">Price low to high</SelectItem>
              <SelectItem value="high-to-low" className="text-center">Price high to low</SelectItem>
              <SelectItem value="volume-desc" className="text-center">Volume high to low</SelectItem>
              <SelectItem value="volume-asc" className="text-center">Volume low to high</SelectItem>
            </SelectContent>
          </Select>

          {/* View Type Buttons */}
          <div className="flex items-center gap-1 bg-[#000000] border border-[#FDFDFD]/20 rounded-lg p-1">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={viewType === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(option.value as ViewType)}
                className={`h-8 w-8 p-0 ${
                  viewType === option.value 
                    ? 'bg-[#A20131] text-[#FDFDFD]' 
                    : 'text-[#FDFDFD]/70 hover:text-[#FDFDFD] hover:bg-[#FDFDFD]/10'
                }`}
              >
                <option.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          {/* Search Bar - Moved to end of filters line */}
          <div className="relative w-64">
            {!searchTerm && (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FDFDFD]/50 pointer-events-none" />
            )}
            <Input
              placeholder=""
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                border: '1px solid rgba(253, 253, 253, 0.2)',
                borderRadius: '8px',
                color: '#FDFDFD',
                backgroundColor: 'transparent'
              }}
              className={`text-sm placeholder:text-[#FDFDFD]/50 transition-all duration-200 focus:border-[#A20131] hover:border-[#FDFDFD]/30 ${
                searchTerm ? 'pl-3' : 'pl-10'
              }`}
            />
          </div>
        </div>
        {/* Search Badge mantido caso exista busca */}
        {searchTerm && (
          <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] text-xs">
            Search: &quot;{searchTerm}&quot;
          </Badge>
        )}
      </div>
      </div>
    </div>
  )
} 