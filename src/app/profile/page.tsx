'use client'

import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { useState, useEffect } from 'react'
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
  TrendingUp, 
  ShoppingCart,
  Tag,
  Upload,
  Edit3,
  Settings,
  Activity,
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

interface UserProfile {
  id: string
  username: string
  avatar: string
  walletAddress: string
  joinedDate: string
  totalNFTs: number
  totalSales: number
  totalPurchases: number
  balance: string
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

export default function ProfilePage() {
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  const { primaryEmail, primaryPhone, hasEmail, hasPhone } = useThirdwebProfiles()
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Redirect to login if not connected
  useEffect(() => {
    if (!account?.address) {
      window.location.href = '/login'
      return
    }
  }, [account])

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!account?.address) return

      setIsLoading(true)
      try {
        // Load user profile from API
        const profileResponse = await fetch(`/api/users/${account.address}`)
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
            joinedDate: new Date().toISOString(),
            totalNFTs: 0,
            totalSales: 0,
            totalPurchases: 0,
            balance: '0'
          }
          setUserProfile(defaultProfile)
          setEditedUsername(defaultProfile.username)
        }

        // Load user NFTs from multiple collections
        const [jerseysRes, stadiumsRes, badgesRes] = await Promise.all([
          fetch(`/api/jerseys?owner=${account.address}`),
          fetch(`/api/stadiums?owner=${account.address}`),
          fetch(`/api/badges?owner=${account.address}`)
        ])

        const nfts: NFTItem[] = []
        
        if (jerseysRes.ok) {
          const jerseys = await jerseysRes.json()
          nfts.push(...jerseys.map((jersey: any) => ({
            id: jersey._id,
            name: jersey.name,
            imageUrl: jersey.imageUrl,
            price: jersey.price,
            status: jersey.isListed ? 'listed' : 'owned',
            createdAt: jersey.createdAt,
            collection: 'jerseys'
          })))
        }

        if (stadiumsRes.ok) {
          const stadiums = await stadiumsRes.json()
          nfts.push(...stadiums.map((stadium: any) => ({
            id: stadium._id,
            name: stadium.name,
            imageUrl: stadium.imageUrl,
            price: stadium.price,
            status: stadium.isListed ? 'listed' : 'owned',
            createdAt: stadium.createdAt,
            collection: 'stadiums'
          })))
        }

        if (badgesRes.ok) {
          const badges = await badgesRes.json()
          nfts.push(...badges.map((badge: any) => ({
            id: badge._id,
            name: badge.name,
            imageUrl: badge.imageUrl,
            price: badge.price,
            status: badge.isListed ? 'listed' : 'owned',
            createdAt: badge.createdAt,
            collection: 'badges'
          })))
        }

        setUserNFTs(nfts)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [account?.address])

  const handleSaveProfile = async () => {
    console.log('🔄 handleSaveProfile called')
    console.log('Account address:', account?.address)
    console.log('Current username:', userProfile?.username)
    console.log('New username:', editedUsername)
    
    if (!account?.address || !userProfile) {
      console.log('❌ Missing account or userProfile')
      return
    }

    try {
      console.log('📤 Sending PUT request to API...')
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

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)

      if (response.ok) {
        const updatedProfile = await response.json()
        console.log('✅ Updated profile received:', updatedProfile)
        
        // Update with the user data from the response
        if (updatedProfile.user) {
          setUserProfile(prev => prev ? { ...prev, ...updatedProfile.user } : null)
        } else {
          setUserProfile(prev => prev ? { ...prev, username: editedUsername } : null)
        }
        setIsEditing(false)
        console.log('✅ Profile updated successfully')
      } else {
        const errorData = await response.text()
        console.error('❌ API Error:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ handleAvatarUpload called')
    
    const file = event.target.files?.[0]
    console.log('📁 Selected file:', file?.name, file?.size, file?.type)
    console.log('🔑 Account address:', account?.address)
    
    if (!file || !account?.address) {
      console.log('❌ Missing file or account address')
      return
    }

    try {
      console.log('📦 Creating FormData...')
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('walletAddress', account.address)
      
      console.log('📤 Sending POST request to /api/users/avatar...')
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Avatar upload result:', result)
        
        setUserProfile(prev => prev ? { ...prev, avatar: result.avatarUrl } : null)
        console.log('✅ Profile state updated with new avatar')
      } else {
        const errorData = await response.text()
        console.error('❌ Avatar upload failed:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ Error uploading avatar:', error)
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

  if (!account?.address) {
    return <div>Redirecting to login...</div>
  }

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
                  <Button 
                    onClick={() => {
                      console.log('💾 Save button clicked!')
                      handleSaveProfile()
                    }} 
                    size="sm"
                  >
                    Save
                  </Button>
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
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#14101e] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userNFTs.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#14101e] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Listed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{listedNFTs.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#14101e] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{createdNFTs.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#14101e] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userProfile?.balance || '0'} CHZ</div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Profiles Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ConnectedProfiles />
          </div>
          
          <div className="lg:col-span-2">
            <Card className="bg-[#14101e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Account Security</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your wallet connections and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg cyber-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <Wallet className="h-4 w-4 text-[#A20131]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Primary Wallet</p>
                      <p className="text-gray-400 text-xs">
                        {account.address.slice(0, 8)}...{account.address.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    Connected
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg cyber-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <Settings className="h-4 w-4 text-[#A20131]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Two-Factor Auth</p>
                      <p className="text-gray-400 text-xs">Enhanced security for your account</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="cyber-button">
                    Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
              <TabsList className="grid w-full grid-cols-5 bg-[#0b0518]">
                <TabsTrigger value="all" className="text-white data-[state=active]:bg-[#A20131]">
                  All ({userNFTs.length})
                </TabsTrigger>
                <TabsTrigger value="owned" className="text-white data-[state=active]:bg-[#A20131]">
                  Owned ({ownedNFTs.length})
                </TabsTrigger>
                <TabsTrigger value="listed" className="text-white data-[state=active]:bg-[#A20131]">
                  Listed ({listedNFTs.length})
                </TabsTrigger>
                <TabsTrigger value="created" className="text-white data-[state=active]:bg-[#A20131]">
                  Created ({createdNFTs.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-white data-[state=active]:bg-[#A20131]">
                  Activity
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <NFTGrid nfts={userNFTs} />
              </TabsContent>
              
              <TabsContent value="owned" className="mt-6">
                <NFTGrid nfts={ownedNFTs} />
              </TabsContent>
              
              <TabsContent value="listed" className="mt-6">
                <NFTGrid nfts={listedNFTs} />
              </TabsContent>
              
              <TabsContent value="created" className="mt-6">
                <NFTGrid nfts={createdNFTs} />
              </TabsContent>
              
              <TabsContent value="activity" className="mt-6">
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>Activity history coming soon...</p>
                </div>
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

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-gray-400">Receive updates about your NFTs</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Activity Tracking */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Activity Tracking</Label>
                  <p className="text-sm text-gray-400">Track your marketplace activity</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Two-Factor Auth</Label>
                  <p className="text-sm text-gray-400">Enable 2FA for enhanced security</p>
                </div>
                <Switch />
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