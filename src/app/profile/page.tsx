'use client'

import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { NFTGridImage } from '@/components/utils/ImageWithFallback'
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
import { NFTDetailsModal } from '@/components/profile/NFTDetailsModal'
import { useThirdwebProfiles } from '@/hooks/useThirdwebProfiles'
import Header from '@/components/Header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { RequireWallet } from '@/components/RequireWallet'
import { convertIpfsToHttp, normalizeIpfsUri } from '@/lib/utils';

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
  tokenId?: string
  name: string
  imageUrl: string
  price?: string
  status: 'owned' | 'listed' | 'sold' | 'created'
  createdAt: string
  collection: 'jerseys' | 'stadiums' | 'badges'
  metadata?: {
    image: string;
    name: string;
    description: string;
    attributes: any[];
  };
}

// Helper functions
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

// Hook para detectar mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function ProfilePage() {
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  const { primaryEmail, primaryPhone, hasEmail, hasPhone } = useThirdwebProfiles()
  
  // NFT states - TEMPORARIAMENTE DESABILITADOS
  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [nftsLoading, setNftsLoading] = useState(false) // Mudado para false
  const [nftsError, setNftsError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('static')
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Mudado para false
  const [isEditing, setIsEditing] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // NFT Modal states
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [showNFTModal, setShowNFTModal] = useState(false)

  // Adicionar estados de paginação
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isMobile ? 5 : userNFTs.length || 1; // 5 para mobile, tudo para desktop

  // Adicionar estado para tab ativa
  const [activeTab, setActiveTab] = useState<'all' | 'listed' | 'created'>('all');

  // Resetar currentPage ao trocar de tab
  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  // Função para obter NFTs paginados por tab
  const getPaginatedNFTs = (nfts: NFTItem[]) => {
    const totalPages = isMobile ? Math.ceil(nfts.length / itemsPerPage) || 1 : 1;
    const paginatedNFTs = isMobile
      ? nfts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : nfts;
    return { paginatedNFTs, totalPages };
  };

  // REATIVANDO - Load user profile data com timeout
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!account?.address) return

      setIsLoading(true)
      try {
        console.log('🔄 Loading user profile for:', account.address)

        // Usar API otimizada com timeout
        const profileResponse = await fetch(`/api/users/${account.address}`)
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          console.log('✅ Profile loaded successfully:', profileData)
          setUserProfile(profileData)
          setEditedUsername(profileData.username || '')
        } else {
          console.warn('⚠️ Profile API returned error, using default')
          // Usar perfil padrão se API falhar
          const defaultProfile: UserProfile = {
            id: account.address,
            username: account.address.slice(0, 6) + '...' + account.address.slice(-4),
            avatar: '',
            walletAddress: account.address,
            joinedDate: new Date().toISOString(),
            totalNFTs: 0,
            totalSales: 0,
            totalPurchases: 0,
            balance: '0'
          }
          setUserProfile(defaultProfile)
          setEditedUsername(defaultProfile.username)
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error)
        // Sempre usar perfil padrão em caso de erro
        const defaultProfile: UserProfile = {
          id: account.address,
          username: account.address.slice(0, 6) + '...' + account.address.slice(-4),
          avatar: '',
          walletAddress: account.address,
          joinedDate: new Date().toISOString(),
          totalNFTs: 0,
          totalSales: 0,
          totalPurchases: 0,
          balance: '0'
        }
        setUserProfile(defaultProfile)
        setEditedUsername(defaultProfile.username)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [account?.address])

  // REATIVANDO - Load user NFTs com cache otimizado
  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!account?.address) return
      setNftsLoading(true)
      setNftsError(null)
      setDataSource('loading')
      try {
        console.log('🔄 Fetching user NFTs for:', account.address)
        // Usar API otimizada com cache
        const response = await fetch(`/api/profile/user-nfts?address=${account.address}`)
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user NFTs')
        }
        const { data, source } = result
        setDataSource(source || 'api')
        console.log(`✅ NFTs loaded: ${data.totalNFTs} total (Source: ${source})`)
        console.log(`📊 Breakdown: ${data.owned} owned, ${data.listed} listed, ${data.created} created`)
        const DISABLE_HIDDEN = process.env.NEXT_PUBLIC_DISABLE_HIDDEN_NFTS === 'true';
        // === BUSCAR BLACKLIST DO BACKEND (somente se habilitado) ===
        let hiddenIds: string[] = [];
        // Blacklist local de segurança (aplicada somente se habilitado)
        const HARDCODED_BLACKLIST = new Set(
          DISABLE_HIDDEN
            ? []
            : [
                '6870f6b15bdc094f3de4c18b',
                'Vasco DINAMITE #24',
                'Vasco DINAMITE #23',
                'Vasco DINAMITE #29',
                'Vasco DINAMITE #36',
                'Vasco DINAMITE #35',
                'Vasco DINAMITE #33',
              ]
        );
        if (!DISABLE_HIDDEN) {
          try {
            const res = await fetch('/api/marketplace/hidden-nfts');
            if (res.ok) {
              const data = await res.json();
              hiddenIds = data.hiddenIds || [];
            }
          } catch (err) {
            console.warn('Não foi possível buscar a blacklist de NFTs ocultas:', err);
          }
        }
        // Converter API response para NFTItem format
        const userNFTs: NFTItem[] = data.nfts
          .filter((nft: any) => {
            if (DISABLE_HIDDEN) return true;
            const idStr = nft.id?.toString?.() || '';
            const tokenStr = nft.tokenId?.toString?.() || '';
            const nameStr = (nft.name || nft.metadata?.name || '').trim();
            if (hiddenIds.includes(idStr) || (tokenStr && hiddenIds.includes(tokenStr))) return false;
            if (HARDCODED_BLACKLIST.has(idStr) || HARDCODED_BLACKLIST.has(tokenStr) || HARDCODED_BLACKLIST.has(nameStr)) return false;
            return true;
          })
          .map((nft: any) => ({
            id: nft.id,
            tokenId: nft.tokenId?.toString?.(),
            name: nft.name,
            imageUrl: nft.imageUrl,
            price: nft.price,
            status: nft.status,
            createdAt: nft.createdAt,
            collection: nft.collection,
            metadata: nft.metadata
          }))
        setUserNFTs(userNFTs)
      } catch (error) {
        console.error('❌ Error fetching user NFTs:', error)
        setNftsError(error instanceof Error ? error.message : 'Failed to fetch NFTs')
        setDataSource('error')
        // Não quebrar a página - manter NFTs vazios
        setUserNFTs([])
      } finally {
        setNftsLoading(false)
      }
    }
    fetchUserNFTs()
  }, [account?.address])

  // REMOVER - Dados estáticos temporários (não precisamos mais)
  /*
  useEffect(() => {
    if (account?.address) {
          const defaultProfile: UserProfile = {
            id: account.address,
        username: account.address.slice(0, 6) + '...' + account.address.slice(-4),
            avatar: '',
            walletAddress: account.address,
        joinedDate: new Date().toISOString(),
        totalNFTs: 0,
        totalSales: 0,
        totalPurchases: 0,
        balance: '0'
          }
          setUserProfile(defaultProfile)
          setEditedUsername(defaultProfile.username)
        }
  }, [account?.address])
  */

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

  // NFT Modal handlers
  const handleNFTClick = (nft: NFTItem) => {
    console.log('🎯 NFT clicked:', nft.name, 'Token ID:', nft.id)
    setSelectedNFT(nft)
    setShowNFTModal(true)
  }

  // Extract tokenId from the composite ID (contractAddress-tokenId)
  const getTokenIdFromCompositeId = (compositeId: string): string => {
    const parts = compositeId.split('-')
    return parts[parts.length - 1] // Get the last part (tokenId)
  }

  const handleCloseNFTModal = () => {
    setShowNFTModal(false)
    setSelectedNFT(null)
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
          <div className="max-w-7xl mx-auto space-y-6 relative">
            {/* Botão Settings - mobile, canto superior direito, só ícone, dentro do container */}
            {/* <button
              type="button"
              className="absolute top-4 right-4 z-30 md:hidden bg-[#14101e] border border-gray-700 rounded-full p-2 shadow-lg hover:bg-[#222] transition-colors"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
            >
              <Settings className="h-6 w-6 text-white" />
            </button> */}
        
        {/* Header Section - MOBILE FRIENDLY */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-4 md:gap-0">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-[#A20131]">
                <AvatarImage src={userProfile?.avatar} />
                <AvatarFallback className="bg-[#14101e] text-white text-lg">
                  {userProfile?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Botão Settings - mobile, canto superior direito do avatar */}
              <button
                type="button"
                className="absolute top-0 right-0 z-30 md:hidden bg-[#14101e] border border-gray-700 rounded-full p-2 shadow-lg hover:bg-[#222] transition-colors"
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
              >
                <Settings className="h-6 w-6 text-white" />
              </button>
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
            <div className="flex flex-col items-center md:items-start gap-1">
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
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white text-center md:text-left">{userProfile?.username}</h1>
                  {/* Botão de editar nome (desktop e mobile) */}
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
              {/* Botão Settings - mobile: logo abaixo do nome, com ícone e texto */}
              <div className="flex md:hidden w-full mb-2">
                <Button
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-[#14101e] w-full"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
              {/* Remover endereço da wallet duplicado */}
              {/* <div className="text-gray-400 text-sm text-center md:text-left">
                <AccountName 
                  className="font-medium"
                  fallbackToAddress={true}
                  formatFn={(name) => `@${name}`}
                />
              </div> */}
              <div className="flex flex-col md:flex-row items-center gap-2 text-gray-400 mt-1">
                <div className="hidden md:flex items-center space-x-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-mono">{account?.address.slice(0, 6)}...{account?.address.slice(-4)}</span>
                </div>
                <div className="hidden md:flex items-center space-x-1">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm">{chain?.name || 'CHZ Chain'}</span>
                </div>
              </div>
              {/* Stats chips removidos: NFTs, Sales, Purchases, Balance */}
              {/* Contact Information */}
              {(hasEmail || hasPhone) && (
                <div className="flex items-center space-x-4 text-gray-400 text-sm mt-2">
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
          {/* Settings button para desktop */}
          <div className="hidden md:flex">
            <Button 
              variant="outline" 
              className="border-gray-600 text-white hover:bg-[#14101e] mt-4 md:mt-0"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
          {/* Botão Settings - mobile: abaixo do nome, acima dos cards de stats */}
          {/* <div className="flex md:hidden w-full">
            <Button
              variant="outline"
              className="border-gray-600 text-white hover:bg-[#14101e] mt-2 mb-1 w-full"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div> */}
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

        {/* NFT Collections Tabs - MOBILE FRIENDLY */}
        <Card className="bg-[#14101e] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">My Collections</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your NFTs across different collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#0b0518] rounded-lg overflow-hidden">
                <TabsTrigger value="all" className="text-white data-[state=active]:bg-[#A20131] text-base py-3 md:py-2">All ({userNFTs.length})</TabsTrigger>
                <TabsTrigger value="listed" className="text-white data-[state=active]:bg-[#A20131] text-base py-3 md:py-2">Listed ({listedNFTs.length})</TabsTrigger>
                <TabsTrigger value="created" className="text-white data-[state=active]:bg-[#A20131] text-base py-3 md:py-2">Created ({createdNFTs.length})</TabsTrigger>
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
                ) : (() => {
                  const { paginatedNFTs, totalPages } = getPaginatedNFTs(userNFTs);
                  return (
                    <>
                      <NFTGrid nfts={paginatedNFTs} onNFTClick={handleNFTClick} />
                      {isMobile && totalPages > 1 && (
                        <div className="flex justify-center gap-3 mt-4">
                          {currentPage > 1 && (
                            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage - 1)}>
                              Previous
                            </Button>
                          )}
                          <span className="text-white/70 text-sm flex items-center">Page {currentPage} of {totalPages}</span>
                          {currentPage < totalPages && (
                            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage + 1)}>
                              Next
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
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
                ) : (() => {
                  const { paginatedNFTs, totalPages } = getPaginatedNFTs(listedNFTs);
                  return (
                    <>
                      <NFTGrid nfts={paginatedNFTs} onNFTClick={handleNFTClick} />
                      {isMobile && totalPages > 1 && (
                        <div className="flex justify-center gap-3 mt-4">
                          {currentPage > 1 && (
                            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage - 1)}>
                              Previous
                            </Button>
                          )}
                          <span className="text-white/70 text-sm flex items-center">Page {currentPage} of {totalPages}</span>
                          {currentPage < totalPages && (
                            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage + 1)}>
                              Next
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
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
                ) : (() => {
                  const { paginatedNFTs, totalPages } = getPaginatedNFTs(createdNFTs);
                  return (
                    <>
                      <NFTGrid nfts={paginatedNFTs} onNFTClick={handleNFTClick} />
                      {isMobile && totalPages > 1 && (
                        <div className="flex justify-center gap-3 mt-4">
                          {currentPage > 1 && (
                            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage - 1)}>
                              Previous
                            </Button>
                          )}
                          <span className="text-white/70 text-sm flex items-center">Page {currentPage} of {totalPages}</span>
                          {currentPage < totalPages && (
                            <Button variant="outline" size="sm" className="px-4 py-1" onClick={() => setCurrentPage(currentPage + 1)}>
                              Next
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
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

        {/* NFT Details Modal */}
        <NFTDetailsModal
          isOpen={showNFTModal}
          onClose={handleCloseNFTModal}
          tokenId={selectedNFT ? getTokenIdFromCompositeId(selectedNFT.id) : ''}
          nft={selectedNFT || undefined}
        />
          </div>
        </RequireWallet>
      </div>
    </>
  )
}

interface NFTGridProps {
  nfts: NFTItem[]
  onNFTClick?: (nft: NFTItem) => void
}

function NFTGrid({ nfts, onNFTClick }: NFTGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 NFTs por página (3x4 grid)
  
  // Calcular paginação
  const totalPages = Math.ceil(nfts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNFTs = nfts.slice(startIndex, endIndex);

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
    <div className="space-y-6">
      {/* Header com contagem e paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#FDFDFD]/70">
          Mostrando {startIndex + 1}-{Math.min(endIndex, nfts.length)} de {nfts.length} NFTs
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-[#14101e] border-[#FDFDFD]/10 text-[#FDFDFD] hover:bg-[#1e1a2e]"
            >
              Anterior
            </Button>
            <span className="text-sm text-[#FDFDFD]/70 px-3">
              {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-[#14101e] border-[#FDFDFD]/10 text-[#FDFDFD] hover:bg-[#1e1a2e]"
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Grid de NFTs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentNFTs.map((nft) => (
        <Card 
          key={nft.id} 
          className="bg-[#0b0518] border-gray-600 hover:border-[#A20131] transition-colors cursor-pointer"
          onClick={() => onNFTClick?.(nft)}
        >
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            {(nft.metadata?.image || nft.imageUrl) ? (
              <NFTGridImage
                key={nft.id}
                src={nft.metadata?.image || nft.imageUrl || ''}
                alt={nft.metadata?.name || nft.name}
                priority={currentPage === 1 && currentNFTs.indexOf(nft) < 4}
                onError={() => console.warn(`Failed to load NFT image: ${nft.name}`)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Loading NFT...</div>
            )}
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
      
      {/* Paginação inferior para telas mobile */}
      {totalPages > 1 && (
        <div className="flex justify-center md:hidden">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-[#14101e] border-[#FDFDFD]/10 text-[#FDFDFD] hover:bg-[#1e1a2e]"
            >
              ←
            </Button>
            <span className="text-sm text-[#FDFDFD]/70 px-3">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-[#14101e] border-[#FDFDFD]/10 text-[#FDFDFD] hover:bg-[#1e1a2e]"
            >
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 