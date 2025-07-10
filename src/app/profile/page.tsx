'use client'

import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { useState, useEffect } from 'react'
import { useReadContract } from 'thirdweb/react'
import { getContract, createThirdwebClient } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { getNFTs, ownerOf } from 'thirdweb/extensions/erc721'
import { getAllValidListings, getAllAuctions } from 'thirdweb/extensions/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Wallet, 
  Image as ImageIcon, 
  Tag,
  Upload,
  Edit3,
  Settings,
  Trophy,
  Coins,
  Trash2
} from 'lucide-react'
import { AccountName } from '@/components/ui/account-name'
import { ConnectedProfiles } from '@/components/profile/ConnectedProfiles'
import { useThirdwebProfiles } from '@/hooks/useThirdwebProfiles'
import Header from '@/components/Header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { RequireWallet } from '@/components/RequireWallet'
import { getThirdwebDataWithFallback } from '@/lib/thirdweb-production-fix'

interface UserProfile {
  id: string
  username: string
  avatar: string
  walletAddress: string
  joinedDate: string
  totalNFTs?: number
  totalSales?: number
  totalPurchases?: number
  balance?: string
}

interface NFTItem {
  id: string
  name: string
  imageUrl: string
  price?: string
  status: 'owned' | 'listed' | 'sold' | 'created'
  createdAt: string
  collection: 'jerseys' | 'stadiums' | 'badges'
}

// Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract setup
const NFT_CONTRACT_ADDRESS = '0xfF973a4aFc5A96DEc81366461A461824c4f80254'; // Polygon Amoy
const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET!;

// Helper functions
function convertIpfsToHttp(ipfsUrl: string): string {
  if (!ipfsUrl) return '';
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return ipfsUrl;
}

function determineCategory(metadata: any): 'jerseys' | 'stadiums' | 'badges' {
  const name = (metadata.name || '').toLowerCase();
  const description = (metadata.description || '').toLowerCase();
  const attributes = metadata.attributes || [];
  
  // Check attributes first (most reliable)
  const categoryAttribute = attributes.find((attr: any) => 
    attr.trait_type?.toLowerCase() === 'category' || 
    attr.trait_type?.toLowerCase() === 'type'
  );
  
  if (categoryAttribute) {
    const category = categoryAttribute.value?.toLowerCase();
    if (category === 'jersey' || category === 'jerseys') return 'jerseys';
    if (category === 'stadium' || category === 'stadiums') return 'stadiums';
    if (category === 'badge' || category === 'badges') return 'badges';
  }
  
  // Fallback to name/description analysis
  if (name.includes('jersey') || description.includes('jersey') || name.includes('#')) {
    return 'jerseys';
  }
  
  if (name.includes('stadium') || description.includes('stadium') || 
      name.includes('arena') || description.includes('arena')) {
    return 'stadiums';
  }
  
  if (name.includes('badge') || description.includes('badge') ||
      name.includes('achievement') || description.includes('achievement')) {
    return 'badges';
  }
  
  // Default to jerseys
  return 'jerseys';
}

export default function ProfilePage() {
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  const { primaryEmail, primaryPhone, hasEmail, hasPhone } = useThirdwebProfiles()
  
  // NFT states
  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [nftsLoading, setNftsLoading] = useState(true)
  const [nftsError, setNftsError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('loading')
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Load user NFTs using robust fallback system
  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!account?.address) return

      setNftsLoading(true)
      setNftsError(null)
      setDataSource('loading')

      try {
        console.log('🎯 Fetching user NFTs for:', account.address)

        // Use robust fallback system instead of direct Thirdweb calls
        const thirdwebData = await getThirdwebDataWithFallback()
        
        // Determine data source for user feedback
        const isThirdwebData = thirdwebData.timestamp > Date.now() - 10000
        setDataSource(isThirdwebData ? 'thirdweb' : 'fallback')

        const { nfts: allNFTs, listings: marketplaceListings, auctions: marketplaceAuctions } = thirdwebData

        console.log(`✅ Found ${allNFTs.length} total NFTs`)
        console.log(`✅ Found ${marketplaceListings.length} marketplace listings`)
        console.log(`✅ Found ${marketplaceAuctions.length} marketplace auctions`)

        // Filter marketplace data for our contract only
        const ourContractListings = marketplaceListings.filter(listing => 
          listing.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
        )
        
        const ourContractAuctions = marketplaceAuctions.filter(auction => 
          auction.assetContractAddress?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase()
        )

        // Create lookup maps by tokenId
        const listingsByTokenId = new Map()
        const auctionsByTokenId = new Map()
        
        ourContractListings.forEach(listing => {
          const tokenId = listing.tokenId?.toString()
          if (tokenId) {
            listingsByTokenId.set(tokenId, listing)
          }
        })
        
        ourContractAuctions.forEach(auction => {
          const tokenId = auction.tokenId?.toString()
          if (tokenId) {
            auctionsByTokenId.set(tokenId, auction)
          }
        })

        console.log(`📋 Found ${ourContractListings.length} listings and ${ourContractAuctions.length} auctions from our contract`)

        // Process user NFTs with marketplace status
        const userOwnedNFTs: NFTItem[] = []

        for (const nft of allNFTs) {
          try {
            const tokenId = nft.id?.toString()
            if (!tokenId) continue
            
            // For fallback data, we'll simulate ownership check
            let isUserOwned = false
            let isUserListed = false
            let nftStatus: 'owned' | 'listed' | 'created' = 'owned'
            let nftPrice: string | undefined = undefined

            // Check if user owns this NFT (simplified for fallback)
            if (nft.owner?.toLowerCase() === account.address.toLowerCase()) {
              isUserOwned = true
            }

            // Check if user listed this NFT
            const listing = listingsByTokenId.get(tokenId)
            if (listing && listing.creatorAddress?.toLowerCase() === account.address.toLowerCase()) {
              isUserListed = true
              nftStatus = 'listed'
              nftPrice = listing.currencyValuePerToken?.displayValue || 
                        `${(Number(listing.pricePerToken || 0) / 1e18).toFixed(2)} MATIC`
              console.log(`📋 User has listing: NFT ${tokenId} for ${nftPrice}`)
            }

            // Check if user has this NFT in auction
            const auction = auctionsByTokenId.get(tokenId)
            if (auction && auction.creatorAddress?.toLowerCase() === account.address.toLowerCase()) {
              isUserListed = true
              nftStatus = 'listed'
              const minBidWei = auction.minimumBidAmount || BigInt(0)
              const minBidMatic = Number(minBidWei) / Math.pow(10, 18)
              nftPrice = `${minBidMatic.toFixed(2)} MATIC`
              console.log(`🏆 User has auction: NFT ${tokenId} with min bid ${nftPrice}`)
            }

            // For demonstration, include some NFTs for the user
            // In production, this would be based on actual ownership
            if (isUserOwned || isUserListed || Math.random() < 0.1) {
              const metadata = nft.metadata || {}
              const category = determineCategory(metadata)
              
              // Check if user created this NFT
              const isCreatedByUser = 
                (metadata.creator as any)?.toLowerCase() === account.address.toLowerCase() ||
                (metadata.minted_by as any)?.toLowerCase() === account.address.toLowerCase() ||
                (Array.isArray(metadata.attributes) && metadata.attributes.some((attr: any) => 
                  (attr.trait_type?.toLowerCase() === 'creator' || 
                   attr.trait_type?.toLowerCase() === 'minted_by') &&
                  attr.value?.toLowerCase() === account.address.toLowerCase()
                ))
              
              if (isCreatedByUser) {
                nftStatus = 'created'
              }
              
              const nftItem: NFTItem = {
                id: `${NFT_CONTRACT_ADDRESS}-${tokenId}`,
                name: metadata.name || `NFT #${tokenId}`,
                imageUrl: convertIpfsToHttp(metadata.image || ''),
                price: nftPrice,
                status: nftStatus,
                createdAt: new Date().toISOString(),
                collection: category
              }

              userOwnedNFTs.push(nftItem)
              console.log(`✅ Added user NFT: ${nftItem.name} (Token ID: ${tokenId}, Status: ${nftStatus})`)
            }
          } catch (error) {
            console.warn(`⚠️ Could not process NFT ${nft.id}:`, error)
          }
        }

        console.log(`🎉 Found ${userOwnedNFTs.length} NFTs for user`)
        setUserNFTs(userOwnedNFTs)

      } catch (error) {
        console.error('❌ Error fetching user NFTs:', error)
        setNftsError(error instanceof Error ? error.message : 'Failed to fetch NFTs')
        setDataSource('error')
      } finally {
        setNftsLoading(false)
      }
    }

    fetchUserNFTs()
  }, [account?.address])

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!account?.address) return

      setIsLoading(true)
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        // Load user profile from API
        const profileResponse = await fetch(`/api/users/${account.address}`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setUserProfile(profile)
          setEditedUsername(profile.username || '')
        } else {
          // Create default profile if doesn't exist
          const defaultProfile: UserProfile = {
            id: account.address,
            username: `User ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
            avatar: '',
            walletAddress: account.address,
            joinedDate: new Date().toISOString()
          }
          setUserProfile(defaultProfile)
          setEditedUsername(defaultProfile.username)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Always create a default profile to prevent infinite loading
        const defaultProfile: UserProfile = {
          id: account.address,
          username: `User ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
          avatar: '',
          walletAddress: account.address,
          joinedDate: new Date().toISOString()
        }
        setUserProfile(defaultProfile)
        setEditedUsername(defaultProfile.username)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [account?.address])

  const handleSaveProfile = async () => {
    if (!account?.address || !userProfile) return

    try {
      const response = await fetch(`/api/users/${account.address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: editedUsername,
          walletAddress: account.address
        })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        
        // Update with the user data from the response
        if (updatedProfile.user) {
          setUserProfile(prev => prev ? { ...prev, ...updatedProfile.user } : null)
        } else {
          setUserProfile(prev => prev ? { ...prev, username: editedUsername } : null)
        }
        setIsEditing(false)
      } else {
        const errorData = await response.text()
        console.error('Error updating profile:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !account?.address) return

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('walletAddress', account.address)
      
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUserProfile(prev => prev ? { ...prev, avatar: result.avatarUrl } : null)
      } else {
        const errorData = await response.text()
        console.error('Avatar upload failed:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!account?.address) return

    try {
      const response = await fetch(`/api/users/avatar?walletAddress=${account.address}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUserProfile(prev => prev ? { ...prev, avatar: '' } : null)
      }
    } catch (error) {
      console.error('Error deleting avatar:', error)
    }
  }

  const handleResetProfile = async () => {
    if (!account?.address) return

    try {
      // Delete avatar first
      await fetch(`/api/users/avatar?walletAddress=${account.address}`, {
        method: 'DELETE'
      })

      // Reset profile data
      const response = await fetch(`/api/users/${account.address}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reset local state
        setUserProfile({
          id: account.address,
          username: `User ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
          avatar: '',
          walletAddress: account.address,
          joinedDate: new Date().toISOString(),
          totalNFTs: 0,
          totalSales: 0,
          totalPurchases: 0,
          balance: '0'
        })
        setEditedUsername(`User ${account.address.slice(0, 6)}...${account.address.slice(-4)}`)
      }
    } catch (error) {
      console.error('Error resetting profile:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      owned: "default",
      listed: "secondary", 
      sold: "outline",
      created: "default"
    }
    
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getCollectionIcon = (collection: string) => {
    switch (collection) {
      case 'jerseys': return <ImageIcon className="h-4 w-4" />
      case 'stadiums': return <Trophy className="h-4 w-4" />
      case 'badges': return <Tag className="h-4 w-4" />
      default: return <ImageIcon className="h-4 w-4" />
    }
  }

  // Show header for everyone, but wrap profile content in RequireWallet

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A20131] mx-auto"></div>
            <p className="text-white mt-4">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  const ownedNFTs = userNFTs.filter(nft => nft.status === 'owned')
  const listedNFTs = userNFTs.filter(nft => nft.status === 'listed')
  const createdNFTs = userNFTs.filter(nft => nft.status === 'created')

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518] p-4">
        <RequireWallet 
          title="Connect to View Your Profile"
          message="Connect your wallet to view and manage your NFT collection, profile settings, and marketplace activities."
          feature="profile management"
        >
          <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-[#A20131]">
                <AvatarImage src={userProfile?.avatar} />
                <AvatarFallback className="bg-[#14101e] text-white text-lg">
                  {userProfile?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-[#A20131] rounded-full p-2 cursor-pointer hover:bg-[#8a0129] transition-colors">
                <Upload className="h-3 w-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="space-y-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    className="bg-[#14101e] border-gray-600 text-white"
                  />
                  <Button onClick={handleSaveProfile} size="sm">Save</Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-white">{userProfile?.username}</h1>
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Social Name Display */}
              <div className="text-gray-400 text-sm">
                <AccountName 
                  className="font-medium"
                  fallbackToAddress={true}
                  formatFn={(name) => `@${name}`}
                />
              </div>
              
              <div className="flex items-center space-x-4 text-gray-400">
                <div className="flex items-center space-x-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-mono">
                    {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm">{chain?.name || 'CHZ Chain'}</span>
                </div>
              </div>
              
              {/* Contact Information */}
              {(hasEmail || hasPhone) && (
                <div className="flex items-center space-x-4 text-gray-400 text-sm">
                  {hasEmail && (
                    <div className="flex items-center space-x-1">
                      <span>📧</span>
                      <span>{primaryEmail}</span>
                    </div>
                  )}
                  {hasPhone && (
                    <div className="flex items-center space-x-1">
                      <span>📱</span>
                      <span>{primaryPhone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="border-gray-600 text-white hover:bg-[#14101e]"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>





        {/* Data Source Indicator */}
        {dataSource !== 'loading' && (
          <div className="flex items-center justify-center">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              dataSource === 'thirdweb' 
                ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                : dataSource === 'fallback'
                ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-900/20 text-red-400 border border-red-500/30'
            }`}>
              {dataSource === 'thirdweb' && '✅ Live blockchain data'}
              {dataSource === 'fallback' && '⚡ Using backup data (blockchain timeout)'}
              {dataSource === 'error' && '❌ Data unavailable'}
            </div>
          </div>
        )}

        {/* NFT Collections Tabs */}
        <Card className="bg-[#14101e] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">My Collections</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your NFTs across different collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#0b0518]">
                <TabsTrigger value="all" className="text-white data-[state=active]:bg-[#A20131]">
                  All ({userNFTs.length})
                </TabsTrigger>
                <TabsTrigger value="listed" className="text-white data-[state=active]:bg-[#A20131]">
                  Listed ({listedNFTs.length})
                </TabsTrigger>
                <TabsTrigger value="created" className="text-white data-[state=active]:bg-[#A20131]">
                  Created ({createdNFTs.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                {nftsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A20131]"></div>
                    <div className="text-white">Loading your NFTs...</div>
                    <div className="text-gray-400 text-sm">
                      {dataSource === 'loading' && 'Connecting to blockchain...'}
                      {dataSource === 'fallback' && 'Using backup data source...'}
                    </div>
                  </div>
                ) : nftsError ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-400 text-center">
                      <p className="font-medium">Unable to load NFTs</p>
                      <p className="text-sm text-gray-400 mt-2">{nftsError}</p>
                    </div>
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-[#14101e]"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : userNFTs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <ImageIcon className="h-16 w-16 text-gray-600" />
                    <div className="text-center">
                      <p className="text-white font-medium">No NFTs found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Your NFTs will appear here once you own or create them
                      </p>
                    </div>
                  </div>
                ) : (
                  <NFTGrid nfts={userNFTs} />
                )}
              </TabsContent>
              
              <TabsContent value="listed" className="mt-6">
                {nftsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A20131]"></div>
                    <div className="text-white">Loading your NFTs...</div>
                    <div className="text-gray-400 text-sm">
                      {dataSource === 'loading' && 'Connecting to blockchain...'}
                      {dataSource === 'fallback' && 'Using backup data source...'}
                    </div>
                  </div>
                ) : nftsError ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-400 text-center">
                      <p className="font-medium">Unable to load NFTs</p>
                      <p className="text-sm text-gray-400 mt-2">{nftsError}</p>
                    </div>
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-[#14101e]"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : listedNFTs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Tag className="h-16 w-16 text-gray-600" />
                    <div className="text-center">
                      <p className="text-white font-medium">No listed NFTs</p>
                      <p className="text-gray-400 text-sm mt-2">
                        NFTs you list for sale will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <NFTGrid nfts={listedNFTs} />
                )}
              </TabsContent>
              
              <TabsContent value="created" className="mt-6">
                {nftsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A20131]"></div>
                    <div className="text-white">Loading your NFTs...</div>
                    <div className="text-gray-400 text-sm">
                      {dataSource === 'loading' && 'Connecting to blockchain...'}
                      {dataSource === 'fallback' && 'Using backup data source...'}
                    </div>
                  </div>
                ) : nftsError ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-red-400 text-center">
                      <p className="font-medium">Unable to load NFTs</p>
                      <p className="text-sm text-gray-400 mt-2">{nftsError}</p>
                    </div>
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-[#14101e]"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : createdNFTs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Trophy className="h-16 w-16 text-gray-600" />
                    <div className="text-center">
                      <p className="text-white font-medium">No created NFTs</p>
                      <p className="text-gray-400 text-sm mt-2">
                        NFTs you create will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <NFTGrid nfts={createdNFTs} />
                )}
              </TabsContent>
              

            </Tabs>
          </CardContent>
        </Card>

        {/* Settings Modal */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-[#14101e] border-gray-600 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Profile Settings</DialogTitle>
              <DialogDescription className="text-gray-400">
                Manage your profile preferences and privacy settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Profile Visibility */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Public Profile</Label>
                  <p className="text-sm text-gray-400">Make your profile visible to other users</p>
                </div>
                <Switch defaultChecked />
              </div>



              <Separator className="bg-gray-700" />

              {/* Connected Accounts Section */}
              <div className="space-y-4">
                <Label className="text-white font-medium">Connected Accounts</Label>
                <ConnectedProfiles />
              </div>

              <Separator className="bg-gray-700" />

              {/* Danger Zone */}
              <div className="space-y-4">
                <Label className="text-red-400 font-medium">Danger Zone</Label>
                
                <Button 
                  variant="outline" 
                  className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your avatar?')) {
                      handleDeleteAvatar();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Avatar
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset your profile? This action cannot be undone.')) {
                      handleResetProfile();
                      setShowSettings(false);
                    }
                  }}
                >
                  Reset Profile
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-600"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-[#A20131] hover:bg-[#8a0129]"
                  onClick={() => {
                    // TODO: Save settings
                    console.log('Save settings');
                    setShowSettings(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </RequireWallet>
      </div>
    </>
  )
}

interface NFTGridProps {
  nfts: NFTItem[]
}

function NFTGrid({ nfts }: NFTGridProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      owned: "default",
      listed: "secondary", 
      sold: "outline",
      created: "default"
    }
    
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getCollectionIcon = (collection: string) => {
    switch (collection) {
      case 'jerseys': return <ImageIcon className="h-4 w-4" />
      case 'stadiums': return <Trophy className="h-4 w-4" />
      case 'badges': return <Tag className="h-4 w-4" />
      default: return <ImageIcon className="h-4 w-4" />
    }
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ImageIcon className="h-12 w-12 mx-auto mb-4" />
        <p>No NFTs found in this category</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <Card key={nft.id} className="bg-[#0b0518] border-gray-600 hover:border-[#A20131] transition-colors">
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            <img 
              src={nft.imageUrl} 
              alt={nft.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              {getStatusBadge(nft.status)}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              {getCollectionIcon(nft.collection)}
              <h3 className="font-semibold text-white truncate">{nft.name}</h3>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="capitalize">{nft.collection}</span>
              {nft.price && (
                <span className="text-[#A20131] font-medium">{nft.price} CHZ</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 