'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Table, 
  BarChart3,
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

export type ViewType = 'grid' | 'list' | 'table'
export type TimeFilter = '24h' | '7d' | '30d' | 'all'
export type PriceSort = 'low-to-high' | 'high-to-low' | 'volume-desc' | 'volume-asc'
export type TokenType = 'all' | 'jerseys' | 'stadiums' | 'badges'
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
  
  // Additional actions
  onShowInsights?: () => void
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
  ownedCount,
  onShowInsights
}: MarketplaceFiltersProps) {
  
  const timeFilterOptions = [
    { value: '24h', label: '24H', icon: Calendar },
    { value: '7d', label: '7D', icon: Calendar },
    { value: '30d', label: '30D', icon: Calendar },
    { value: 'all', label: 'All', icon: Calendar }
  ]
  
  const viewOptions = [
    { value: 'grid', icon: Grid3X3, label: 'Grid' },
    { value: 'list', icon: List, label: 'List' },
    { value: 'table', icon: Table, label: 'Table' }
  ]

  return (
    <div className="bg-[#000000] border-b border-[#FDFDFD]/10">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-4 space-y-4">
              {/* Header */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="section-title">Collections</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FDFDFD]/50" />
            <Input
              placeholder="Search by item or trait"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 ui-input bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] placeholder:text-[#FDFDFD]/50"
            />
          </div>
          
          {/* Insights Button */}
          {onShowInsights && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowInsights}
              className="ui-button bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Insights
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
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
      </div>

      {/* Last Updated Info */}
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <p className="body-small">
          Last updated 3 hours ago.
        </p>
        
        <div className="flex items-center gap-2">
          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#000000] border border-[#FDFDFD]/20 rounded-lg p-1">
            {timeFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeFilter === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onTimeFilterChange(option.value as TimeFilter)}
                className={`h-8 px-3 body-caption ${
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
            <SelectTrigger className="w-40 bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD]">
              <SelectValue placeholder="Token type" />
            </SelectTrigger>
            <SelectContent className="bg-[#000000] border-[#FDFDFD]/20">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="jerseys">Jerseys</SelectItem>
              <SelectItem value="stadiums">Stadiums</SelectItem>
              <SelectItem value="badges">Badges</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Sort Dropdown */}
          <Select value={priceSort} onValueChange={(value) => onPriceSortChange(value as PriceSort)}>
            <SelectTrigger className="w-48 bg-[#000000] border-[#FDFDFD]/20 text-[#FDFDFD]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#000000] border-[#FDFDFD]/20">
              <SelectItem value="low-to-high">Price low to high</SelectItem>
              <SelectItem value="high-to-low">Price high to low</SelectItem>
              <SelectItem value="volume-desc">Volume high to low</SelectItem>
              <SelectItem value="volume-asc">Volume low to high</SelectItem>
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
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-4 body-small max-w-7xl mx-auto">
        <span>
          {activeTab === 'all' ? totalCollections : 
           activeTab === 'watchlist' ? watchlistCount : 
           ownedCount} collections
        </span>
        {searchTerm && (
          <Badge variant="secondary" className="bg-[#FDFDFD]/10 text-[#FDFDFD] body-caption">
            Search: "{searchTerm}"
          </Badge>
        )}
      </div>
      </div>
    </div>
  )
} 