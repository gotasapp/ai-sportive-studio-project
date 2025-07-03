'use client'

import React, { useState, useEffect } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check } from 'lucide-react'
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react'
import Image from 'next/image'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest } from '../types'
import { getTransactionUrl } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { isAdmin } from '../lib/admin-config'

// Importando os novos componentes reutilizáveis
import EditorLayout from '@/components/layouts/EditorLayout'
import ControlPanel from '@/components/editor/ControlPanel'
import PreviewPanel from '@/components/editor/PreviewPanel'
import ActionPanel from '@/components/editor/ActionPanel'
import MarketplaceCarousel from '@/components/editor/MarketplaceCarousel'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

// Marketplace data will be loaded from JSON
interface MarketplaceNFT {
  name: string;
  image_url: string;
  description: string;
  price: string;
}

export default function BadgeEditor() {
  // Thirdweb v5 hooks for wallet connection
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  
  // Use account data directly
  const address = account?.address
  const isConnected = !!account
  const chainId = chain?.id
  
  // Thirdweb hooks for minting  
  const { 
    mintNFTWithMetadata, 
    setClaimConditions, 
    isConnected: isThirdwebConnected 
  } = useWeb3()

  // Engine hooks for new minting system
  const { 
    mintGasless,
    createNFTMetadata,
    isLoading: isEngineLoading,
    error: engineError,
    getTransactionStatus,
  } = useEngine()

  // Component state
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [badgeName, setBadgeName] = useState<string>('CHAMPION')
  const [badgeNumber, setBadgeNumber] = useState<string>('1')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<boolean>(false)
  const [generationCost, setGenerationCost] = useState<number | null>(null)
  const [royalties, setRoyalties] = useState<number>(10)
  const [editionSize, setEditionSize] = useState<number>(100)
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null)
  
  // IPFS state
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null)
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false)
  const [ipfsError, setIpfsError] = useState<string | null>(null)

  // Minting state
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintSuccess, setMintSuccess] = useState<string | null>(null)
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Marketplace state
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  
  // Smooth Carousel state with drag & scroll (smaller dimensions for badges)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const slidesToShow = 3 // Smaller for badge marketplace
  const maxSlide = Math.max(0, marketplaceNFTs.length - slidesToShow)
  
  const nextSlide = () => {
    setCurrentSlide(prev => {
      const next = Math.min(prev + 1, maxSlide)
      console.log(`NextSlide: ${prev} → ${next} (maxSlide: ${maxSlide}, items: ${marketplaceNFTs.length})`)
      return next
    })
  }
  
  const prevSlide = () => {
    setCurrentSlide(prev => {
      const next = Math.max(prev - 1, 0)
      console.log(`PrevSlide: ${prev} → ${next}`)
      return next
    })
  }

  // Drag handlers
  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setDragStart(clientX)
    setDragOffset(0)
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    const offset = (clientX - dragStart) * 0.6 // Reduzir velocidade do drag em 40%
    setDragOffset(offset)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    // Determine if drag was significant enough to change slide (threshold maior)
    if (Math.abs(dragOffset) > 80) { // Aumentado de 50 para 80
      if (dragOffset > 0) {
        prevSlide()
      } else {
        nextSlide()
      }
    }
    setDragOffset(0)
  }

  // Scroll bar handler
  const handleScrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setCurrentSlide(value)
  }
    
  // Auto-play carousel removed - manual control only

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  const isOnChzChain = chainId === 88888 || chainId === 88882 // CHZ mainnet or testnet
  const isOnPolygonChain = chainId === 137 || chainId === 80002 // Polygon mainnet or Amoy testnet
  
  // Admin check
  const isUserAdmin = isAdmin(account)
  
  // Mint conditions
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy needs wallet
  const canMintGasless = generatedImage && selectedTeam && badgeName && badgeNumber && isUserAdmin // Gasless only for admins

  // Upload to IPFS
  const uploadToIPFS = async () => {
    if (!generatedImageBlob) {
      setIpfsError('No image to upload')
      return
    }

    if (!IPFSService.isConfigured()) {
      setIpfsError('IPFS not configured. Please add Pinata credentials.')
      return
    }

    setIsUploadingToIPFS(true)
    setIpfsError(null)

    try {
      const name = `${selectedTeam} ${badgeName} #${badgeNumber}`
      const description = `AI-generated ${selectedTeam} badge for ${badgeName} #${badgeNumber}. Style: ${selectedStyle}.`

      const result = await IPFSService.uploadComplete(
        generatedImageBlob,
        name,
        description,
        selectedTeam,
        selectedStyle,
        badgeName,
        badgeNumber
      )

      setIpfsUrl(result.imageUrl)
      console.log('🎉 Upload completo:', result)
      
    } catch (error: any) {
      console.error('❌ IPFS upload failed:', error)
      setIpfsError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploadingToIPFS(false)
    }
  }

  // Set claim conditions for minting
  const handleSetClaimConditions = async () => {
    if (!isConnected || !isOnSupportedChain) {
      setError('Please connect to a supported network')
      return
    }

    try {
      await setClaimConditions({
        price: generationCost || 0,
        maxMintSupply: editionSize,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
      })
      console.log('✅ Claim conditions set')
    } catch (error: any) {
      console.error('❌ Failed to set claim conditions:', error)
      setError(error instanceof Error ? error.message : 'Failed to set claim conditions')
    }
  }

  // Mint badge using Engine
  const handleEngineNormalMint = async () => {
    if (!canMintGasless) {
      setError('Cannot mint. Please check all conditions.')
      return
    }

    setIsMinting(true)
    setMintError(null)

    try {
      const metadata = createNFTMetadata({
        name: `${selectedTeam} ${badgeName} #${badgeNumber}`,
        description: `AI-generated ${selectedTeam} badge for ${badgeName} #${badgeNumber}. Style: ${selectedStyle}.`,
        image: generatedImage,
        attributes: [
          { trait_type: 'Team', value: selectedTeam },
          { trait_type: 'Style', value: selectedStyle },
          { trait_type: 'Name', value: badgeName },
          { trait_type: 'Number', value: badgeNumber },
        ],
      })

      const result = await mintGasless(metadata)
      setMintSuccess('Mint successful!')
      setMintedTokenId(result.tokenId)
      setTransactionHash(result.transactionHash)
      console.log('🎉 Mint successful:', result)
    } catch (error: any) {
      console.error('❌ Mint failed:', error)
      setMintError(error instanceof Error ? error.message : 'Mint failed')
    } finally {
      setIsMinting(false)
    }
  }

  // Mint badge using legacy method
  const handleMintNFT = async () => {
    if (!canMintLegacy) {
      setError('Cannot mint. Please check all conditions.')
      return
    }

    setIsMinting(true)
    setMintError(null)

    try {
      const metadata = createNFTMetadata({
        name: `${selectedTeam} ${badgeName} #${badgeNumber}`,
        description: `AI-generated ${selectedTeam} badge for ${badgeName} #${badgeNumber}. Style: ${selectedStyle}.`,
        image: generatedImage,
        attributes: [
          { trait_type: 'Team', value: selectedTeam },
          { trait_type: 'Style', value: selectedStyle },
          { trait_type: 'Name', value: badgeName },
          { trait_type: 'Number', value: badgeNumber },
        ],
      })

      const result = await mintNFTWithMetadata(metadata)
      setMintSuccess('Mint successful!')
      setMintedTokenId(result.tokenId)
      setTransactionHash(result.transactionHash)
      console.log('🎉 Mint successful:', result)
    } catch (error: any) {
      console.error('❌ Mint failed:', error)
      setMintError(error instanceof Error ? error.message : 'Mint failed')
    } finally {
      setIsMinting(false)
    }
  }

  // Generate badge content
  const generateContent = async () => {
    if (!selectedTeam || !badgeName || !badgeNumber) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const request: ImageGenerationRequest = {
        prompt: `${selectedTeam} badge for ${badgeName} #${badgeNumber} in ${selectedStyle} style`,
        quality,
      }

      const result = await Dalle3Service.generateImage(request)
      setGeneratedImage(result.imageUrl)
      setGeneratedImageBlob(result.imageBlob)
      setGenerationCost(result.cost)
      console.log('🎉 Image generated:', result)
    } catch (error: any) {
      console.error('❌ Image generation failed:', error)
      setError(error instanceof Error ? error.message : 'Image generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedTeam('')
    setBadgeName('CHAMPION')
    setBadgeNumber('1')
    setQuality('standard')
    setSelectedStyle('modern')
    setGeneratedImage(null)
    setGeneratedImageBlob(null)
    setIsLoading(false)
    setError(null)
    setApiStatus(false)
    setGenerationCost(null)
    setRoyalties(10)
    setEditionSize(100)
    setIpfsUrl(null)
    setIsUploadingToIPFS(false)
    setIpfsError(null)
    setIsMinting(false)
    setMintError(null)
    setMintSuccess(null)
    setMintedTokenId(null)
    setMintStatus('idle')
    setTransactionHash(null)
    setMarketplaceNFTs([])
    setMarketplaceLoading(true)
    setCurrentSlide(0)
    setIsDragging(false)
    setDragStart(0)
    setDragOffset(0)
  }

  // Load available teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/teams')
        const data = await response.json()
        setAvailableTeams(data.teams)
      } catch (error) {
        console.error('❌ Failed to load teams:', error)
      }
    }

    loadTeams()
  }, [])

  // Check API status
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/status')
        const data = await response.json()
        setApiStatus(data.status === 'ok')
      } catch (error) {
        console.error('❌ Failed to check API status:', error)
      }
    }

    checkApiStatus()
  }, [])

  // Load marketplace data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        const response = await fetch('/public/marketplace-images.json')
        const data = await response.json()
        setMarketplaceNFTs(data.badges || [])
        setMarketplaceLoading(false)
      } catch (error) {
        console.error('❌ Failed to load marketplace data:', error)
        setMarketplaceLoading(false)
      }
    }

    loadMarketplaceData()
  }, [])

  // Verificar se availableTeams é um array antes de usar map
  const teams = Array.isArray(availableTeams) ? availableTeams : [];

  // --- RENDERIZAÇÃO COM COMPONENTES REUTILIZÁVEIS ---
  return (
    <EditorLayout
      controls={
        <ControlPanel title="Create Your Badge">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Team</label>
            <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full bg-gray-800/60 border-secondary/20 rounded-lg p-3 text-secondary focus:ring-accent focus:border-accent">
              <option value="">Select Team</option>
              {teams.map((team) => (<option key={team} value={team}>{team}</option>))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-400">Badge Name</label>
              <input type="text" value={badgeName} onChange={(e) => setBadgeName(e.target.value)} className="w-full bg-gray-800/60 border-secondary/20 rounded-lg p-3 text-secondary focus:ring-accent focus:border-accent" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-gray-400">Number</label>
              <input type="text" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} className="w-full bg-gray-800/60 border-secondary/20 rounded-lg p-3 text-secondary focus:ring-accent focus:border-accent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_FILTERS.map((filter) => (
                <button key={filter.id} onClick={() => setSelectedStyle(filter.id)} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${selectedStyle === filter.id ? 'border-accent bg-accent/20' : 'border-transparent bg-gray-800/60 hover:bg-gray-700/80'}`}>
                  <filter.icon className="w-6 h-6 mb-1 text-secondary" />
                  <span className="text-xs text-secondary">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={generateContent} disabled={isLoading || !selectedTeam} className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-4 rounded-lg text-lg transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed">
            {isLoading ? 'Generating...' : 'Generate Badge'}
          </Button>
        </ControlPanel>
      }
      preview={
        <PreviewPanel
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
        />
      }
      actions={
        <ActionPanel
          title="Mint Your NFT"
          isMinting={isMinting}
          isUploading={isUploadingToIPFS}
          canMint={!!canMintGasless}
          canUpload={!!generatedImageBlob}
          isUserAdmin={isUserAdmin}
          mintSuccess={mintSuccess}
          mintError={mintError}
          uploadSuccess={ipfsUrl}
          uploadError={ipfsError}
          onMint={handleEngineNormalMint}
          onUpload={uploadToIPFS}
        />
      }
      marketplace={
        <MarketplaceCarousel
          title="Marketplace Inspiration"
          items={marketplaceNFTs}
        />
      }
    />
  )
} 