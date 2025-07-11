'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { 
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  Heart,
  Share2,
  MoreHorizontal,
  ImageIcon,
  Trophy,
  Shield,
  ChevronDown,
  Zap,
  Clock,
  Star
} from 'lucide-react'
import { NFTDetailsModal } from '@/components/profile/NFTDetailsModal'
import { convertIpfsToHttp } from '@/lib/utils'

interface CollectionNFT {
  tokenId: string
  name: string
  imageUrl: string
  price?: string
  status: 'available' | 'listed' | 'sold' | 'auction'
  owner: string
  attributes: Array<{ trait_type: string; value: string }>
  rarity?: number
  collection: 'jerseys' | 'stadiums' | 'badges'
  createdAt: string
  lastSale?: string
}

interface CollectionStats {
  totalItems: number
  owners: number
  floorPrice: string
  volumeTraded: string
  listed: number
  sold: number
  averagePrice: string
}

const COLLECTION_INFO = {
  jerseys: {
    name: 'CHZ Jerseys',
    description: 'Exclusive football jerseys collection featuring legendary teams and players',
    icon: <ImageIcon className="h-6 w-6" />,
    banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop',
    color: 'from-blue-600 to-purple-600'
  },
  stadiums: {
    name: 'CHZ Stadiums', 
    description: 'Iconic football stadiums from around the world in NFT form',
    icon: <Trophy className="h-6 w-6" />,
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
    color: 'from-green-600 to-blue-600'
  },
  badges: {
    name: 'CHZ Badges',
    description: 'Achievement badges and commemorative collectibles',
    icon: <Shield className="h-6 w-6" />,
    banner: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=1200&h=400&fit=crop',
    color: 'from-yellow-600 to-red-600'
  }
}

export default function CollectionPage() {
  const params = useParams()
  const router = useRouter()
  const contractAddress = params.address as string
  
  // Determine collection type from URL or contract
  const [collectionType, setCollectionType] = useState<'jerseys' | 'stadiums' | 'badges'>('jerseys')
  const [nfts, setNfts] = useState<CollectionNFT[]>([])
  const [filteredNfts, setFilteredNfts] = useState<CollectionNFT[]>([])
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // NFT Modal
  const [selectedNFT, setSelectedNFT] = useState<CollectionNFT | null>(null)
  const [showNFTModal, setShowNFTModal] = useState(false)

  // Load collection data
  useEffect(() => {
    loadCollectionData()
  }, [contractAddress])

  // Apply filters
  useEffect(() => {
    applyFilters()
  }, [nfts, searchQuery, statusFilter, priceRange, sortBy])

  const loadCollectionData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Loading collection data for:', contractAddress)

      // Load NFTs from our marketplace API
      const nftsResponse = await fetch(`/api/marketplace/nft-collection?contract=${contractAddress}`)
      const nftsResult = await nftsResponse.json()

      if (!nftsResult.success) {
        throw new Error(nftsResult.error || 'Failed to load collection NFTs')
      }

      const nftsData = nftsResult.data.nfts || []
      setNfts(nftsData)

      // Determine collection type from first NFT
      if (nftsData.length > 0) {
        setCollectionType(nftsData[0].collection || 'jerseys')
      }

      // Calculate stats
      const collectionStats: CollectionStats = {
        totalItems: nftsData.length,
        owners: new Set(nftsData.map((nft: CollectionNFT) => nft.owner)).size,
        floorPrice: calculateFloorPrice(nftsData),
        volumeTraded: '1,234.56 MATIC', // TODO: Calculate from actual sales
        listed: nftsData.filter((nft: CollectionNFT) => nft.status === 'listed').length,
        sold: nftsData.filter((nft: CollectionNFT) => nft.status === 'sold').length,
        averagePrice: calculateAveragePrice(nftsData)
      }
      setStats(collectionStats)

      console.log(`✅ Loaded ${nftsData.length} NFTs for collection`)

    } catch (error: any) {
      console.error('❌ Error loading collection:', error)
      setError(error.message || 'Failed to load collection')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateFloorPrice = (nfts: CollectionNFT[]): string => {
    const listedNfts = nfts.filter(nft => nft.price && nft.status === 'listed')
    if (listedNfts.length === 0) return '—'
    
    const prices = listedNfts.map(nft => parseFloat(nft.price?.replace(/[^0-9.]/g, '') || '0'))
    const minPrice = Math.min(...prices)
    return `${minPrice.toFixed(2)} MATIC`
  }

  const calculateAveragePrice = (nfts: CollectionNFT[]): string => {
    const listedNfts = nfts.filter(nft => nft.price && nft.status === 'listed')
    if (listedNfts.length === 0) return '—'
    
    const prices = listedNfts.map(nft => parseFloat(nft.price?.replace(/[^0-9.]/g, '') || '0'))
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    return `${avgPrice.toFixed(2)} MATIC`
  }

  const applyFilters = () => {
    let filtered = [...nfts]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.attributes.some(attr => 
          attr.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(nft => nft.status === statusFilter)
    }

    // Price filter
    if (priceRange[0] > 0 || priceRange[1] < 1000) {
      filtered = filtered.filter(nft => {
        if (!nft.price) return priceRange[0] === 0
        const price = parseFloat(nft.price.replace(/[^0-9.]/g, ''))
        return price >= priceRange[0] && price <= priceRange[1]
      })
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0')
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0')
          return priceA - priceB
        })
        break
      case 'price_high':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0')
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0')
          return priceB - priceA
        })
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'rarity':
        filtered.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
        break
    }

    setFilteredNfts(filtered)
  }

  const handleNFTClick = (nft: CollectionNFT) => {
    setSelectedNFT(nft)
    setShowNFTModal(true)
  }

  const collectionInfo = COLLECTION_INFO[collectionType]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A20131] mx-auto mb-4"></div>
            <p className="text-white">Loading collection...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadCollectionData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <Header />
      
      {/* Collection Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-64 relative overflow-hidden">
          <Image
            src={collectionInfo.banner}
            alt={collectionInfo.name}
            fill
            className="object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${collectionInfo.color} opacity-80`} />
        </div>

        {/* Collection Info */}
        <div className="relative -mt-16 mx-4 max-w-7xl mx-auto">
          <div className="bg-[#14101e] rounded-lg border border-[#FDFDFD]/20 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-[#A20131] p-4 rounded-lg">
                  {collectionInfo.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{collectionInfo.name}</h1>
                  <p className="text-[#FDFDFD]/70 max-w-2xl">{collectionInfo.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-[#FDFDFD]/60">
                    <span>Created by CHZ Studio</span>
                    <span>•</span>
                    <span>ERC-721</span>
                    <span>•</span>
                    <span>Polygon</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mx-4 max-w-7xl mx-auto mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
                <p className="text-sm text-[#FDFDFD]/60">Items</p>
              </CardContent>
            </Card>
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.owners}</p>
                <p className="text-sm text-[#FDFDFD]/60">Owners</p>
              </CardContent>
            </Card>
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#A20131]">{stats.floorPrice}</p>
                <p className="text-sm text-[#FDFDFD]/60">Floor Price</p>
              </CardContent>
            </Card>
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.volumeTraded}</p>
                <p className="text-sm text-[#FDFDFD]/60">Volume</p>
              </CardContent>
            </Card>
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.listed}</p>
                <p className="text-sm text-[#FDFDFD]/60">Listed</p>
              </CardContent>
            </Card>
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.sold}</p>
                <p className="text-sm text-[#FDFDFD]/60">Sold</p>
              </CardContent>
            </Card>
            <Card className="bg-[#14101e] border-[#FDFDFD]/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.averagePrice}</p>
                <p className="text-sm text-[#FDFDFD]/60">Avg Price</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="mx-4 max-w-7xl mx-auto mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FDFDFD]/40 h-4 w-4" />
              <Input
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#14101e] border-[#FDFDFD]/20 text-white w-64"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-[#FDFDFD]/20 text-white"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-[#14101e] border-[#FDFDFD]/20 text-white w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#14101e] border-[#FDFDFD]/20">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#FDFDFD]/60 text-sm">
              {filteredNfts.length} of {nfts.length} items
            </span>
            <div className="flex border border-[#FDFDFD]/20 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="bg-[#14101e] border-[#FDFDFD]/20 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-[#0b0518] border-[#FDFDFD]/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#14101e] border-[#FDFDFD]/20">
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                      <SelectItem value="auction">On Auction</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Price Range (MATIC)
                  </label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-[#FDFDFD]/60 mt-1">
                      <span>{priceRange[0]} MATIC</span>
                      <span>{priceRange[1]} MATIC</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setPriceRange([0, 1000])
                    }}
                    className="border-[#FDFDFD]/20 text-white"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NFT Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <NFTCard key={nft.tokenId} nft={nft} onClick={() => handleNFTClick(nft)} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNfts.map((nft) => (
              <NFTListItem key={nft.tokenId} nft={nft} onClick={() => handleNFTClick(nft)} />
            ))}
          </div>
        )}

        {filteredNfts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#FDFDFD]/60 text-lg">No NFTs found matching your criteria</p>
          </div>
        )}
      </div>

      {/* NFT Details Modal */}
      <NFTDetailsModal
        isOpen={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        tokenId={selectedNFT?.tokenId || ''}
        nft={selectedNFT ? {
          id: selectedNFT.tokenId,
          name: selectedNFT.name,
          imageUrl: selectedNFT.imageUrl,
          price: selectedNFT.price,
          status: selectedNFT.status as any,
          createdAt: selectedNFT.createdAt,
          collection: selectedNFT.collection
        } : undefined}
      />
    </div>
  )
}

interface NFTCardProps {
  nft: CollectionNFT
  onClick: () => void
}

function NFTCard({ nft, onClick }: NFTCardProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      available: { color: 'bg-green-500/20 text-green-400', label: 'Available' },
      listed: { color: 'bg-blue-500/20 text-blue-400', label: 'Listed' },
      sold: { color: 'bg-gray-500/20 text-gray-400', label: 'Sold' },
      auction: { color: 'bg-purple-500/20 text-purple-400', label: 'Auction' }
    }
    const config = variants[status as keyof typeof variants] || variants.available
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Card 
      className="bg-[#14101e] border-[#FDFDFD]/20 hover:border-[#A20131] transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <Image
          src={convertIpfsToHttp(nft.imageUrl)}
          alt={nft.name}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          {getStatusBadge(nft.status)}
        </div>
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-black/50 border-white/20">
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-black/50 border-white/20">
              <Heart className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-white mb-2 truncate">{nft.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-[#FDFDFD]/60 text-sm capitalize">{nft.collection}</span>
          {nft.price && (
            <span className="text-[#A20131] font-medium">{nft.price}</span>
          )}
        </div>
        {nft.rarity && (
          <div className="mt-2 flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-[#FDFDFD]/60">Rarity: {nft.rarity}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface NFTListItemProps {
  nft: CollectionNFT
  onClick: () => void
}

function NFTListItem({ nft, onClick }: NFTListItemProps) {
  return (
    <Card 
      className="bg-[#14101e] border-[#FDFDFD]/20 hover:border-[#A20131] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 relative rounded-lg overflow-hidden">
            <Image
              src={convertIpfsToHttp(nft.imageUrl)}
              alt={nft.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{nft.name}</h3>
            <p className="text-[#FDFDFD]/60 text-sm capitalize">{nft.collection}</p>
          </div>
          <div className="text-right">
            {nft.price && (
              <p className="text-[#A20131] font-medium">{nft.price}</p>
            )}
            <p className="text-[#FDFDFD]/60 text-sm">{nft.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 