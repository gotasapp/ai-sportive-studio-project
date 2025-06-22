'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check, Building, Shirt, Eye, Wand2, Camera, Sunset, Cloud, Users } from 'lucide-react'
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { StadiumService } from '../lib/services/stadium-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest, StadiumGenerationRequest, StadiumResponse } from '../types'

// Filtros para jerseys
const JERSEY_STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

// Filtros para estádios
const STADIUM_STYLE_FILTERS = [
  { id: 'realistic', label: 'Realistic', icon: Eye },
  { id: 'cinematic', label: 'Cinematic', icon: Camera },
  { id: 'dramatic', label: 'Dramatic', icon: Zap }
]

const STADIUM_ATMOSPHERE_FILTERS = [
  { id: 'packed', label: 'Packed', icon: Users },
  { id: 'half_full', label: 'Half Full', icon: Users },
  { id: 'empty', label: 'Empty', icon: Building }
]

const STADIUM_TIME_FILTERS = [
  { id: 'day', label: 'Day', icon: Zap },
  { id: 'night', label: 'Night', icon: Crown },
  { id: 'sunset', label: 'Sunset', icon: Sunset }
]

const STADIUM_WEATHER_FILTERS = [
  { id: 'clear', label: 'Clear', icon: Zap },
  { id: 'dramatic', label: 'Dramatic', icon: Cloud },
  { id: 'cloudy', label: 'Cloudy', icon: Cloud }
]

export default function ContentGenerator() {
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

  // Content type selection
  const [contentType, setContentType] = useState<'jersey' | 'stadium'>('jersey')

  // Jersey state
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('JEFF')
  const [playerNumber, setPlayerNumber] = useState<string>('10')
  const [selectedJerseyStyle, setSelectedJerseyStyle] = useState<string>('modern')

  // Stadium state
  const [stadiumPrompt, setStadiumPrompt] = useState<string>('')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>('')
  const [selectedStadiumStyle, setSelectedStadiumStyle] = useState<'realistic' | 'cinematic' | 'dramatic'>('realistic')
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<'packed' | 'half_full' | 'empty'>('packed')
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'day' | 'night' | 'sunset'>('day')
  const [selectedWeather, setSelectedWeather] = useState<'clear' | 'dramatic' | 'cloudy'>('clear')

  // Common state
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<boolean>(false)
  const [generationCost, setGenerationCost] = useState<number | null>(null)
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

  // File input ref for stadium reference images
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Network validation
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  
  // Mint conditions
  const canMintGasless = generatedImage && (
    contentType === 'jersey' ? (selectedTeam && playerName && playerNumber) : stadiumPrompt
  )

  // Handle reference image upload for stadiums
  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setReferenceImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Generate content based on type
  const generateContent = async () => {
    if (contentType === 'jersey') {
      return generateJersey()
    } else {
      return generateStadium()
    }
  }

  // Generate jersey (existing logic)
  const generateJersey = async () => {
    if (!selectedTeam || !playerName || !playerNumber) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError(null)
    setGeneratedImage(null)
    setGeneratedImageBlob(null)

    try {
      const request: ImageGenerationRequest = {
        model_id: `${selectedTeam}_${selectedJerseyStyle}`.toLowerCase(),
        team: selectedTeam,
        player_name: playerName,
        player_number: playerNumber,
        quality: quality
      }

      console.log('🎯 Generating jersey with request:', request)

      const result = await Dalle3Service.generateImage(request)
      
      if (result.success && result.image_base64) {
        console.log('✅ Jersey generation successful!')
        setGeneratedImage(result.image_base64)
        
        // Convert to blob for IPFS upload
        const response = await fetch(`data:image/png;base64,${result.image_base64}`)
        const blob = await response.blob()
        setGeneratedImageBlob(blob)
        
        setGenerationCost(result.cost_usd || 0)
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error: any) {
      console.error('❌ Jersey generation failed:', error)
      setError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate stadium
  const generateStadium = async () => {
    if (!stadiumPrompt && !referenceImage) {
      setError('Please provide either a prompt or reference image')
      return
    }

    setIsLoading(true)
    setError(null)
    setGeneratedImage(null)
    setGeneratedImageBlob(null)

    try {
      let request: StadiumGenerationRequest

      if (referenceImage) {
        // Use reference image
        const processed = await StadiumService.processImageUpload(referenceImage)
        request = {
          reference_image_base64: processed.base64,
          generation_style: selectedStadiumStyle,
          atmosphere: selectedAtmosphere,
          time_of_day: selectedTimeOfDay,
          weather: selectedWeather,
          quality
        }
      } else {
        // Use prompt only
        request = {
          prompt: stadiumPrompt,
          generation_style: selectedStadiumStyle,
          atmosphere: selectedAtmosphere,
          time_of_day: selectedTimeOfDay,
          weather: selectedWeather,
          quality
        }
      }

      console.log('🏟️ Generating stadium with request:', request)

      const result = await StadiumService.generateStadium(request)
      
      if (result.success && result.generated_image_base64) {
        console.log('✅ Stadium generation successful!')
        setGeneratedImage(result.generated_image_base64)
        
        // Convert to blob for IPFS upload
        const response = await fetch(`data:image/png;base64,${result.generated_image_base64}`)
        const blob = await response.blob()
        setGeneratedImageBlob(blob)
        
        setGenerationCost(result.cost_usd || 0)
      } else {
        throw new Error(result.error || 'Stadium generation failed')
      }
    } catch (error: any) {
      console.error('❌ Stadium generation failed:', error)
      setError(error instanceof Error ? error.message : 'Stadium generation failed')
    } finally {
      setIsLoading(false)
    }
  }

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
      let name: string
      let description: string

      if (contentType === 'jersey') {
        name = `${selectedTeam} ${playerName} #${playerNumber}`
        description = `AI-generated ${selectedTeam} jersey for ${playerName} #${playerNumber}. Style: ${selectedJerseyStyle}.`
      } else {
        name = `AI Stadium - ${selectedStadiumStyle} ${selectedAtmosphere}`
        description = `AI-generated stadium. Style: ${selectedStadiumStyle}, Atmosphere: ${selectedAtmosphere}, Time: ${selectedTimeOfDay}, Weather: ${selectedWeather}.`
      }

      const result = await IPFSService.uploadComplete(
        generatedImageBlob,
        name,
        description,
        contentType === 'jersey' ? selectedTeam : 'Stadium',
        contentType === 'jersey' ? selectedJerseyStyle : selectedStadiumStyle,
        contentType === 'jersey' ? playerName : '',
        contentType === 'jersey' ? playerNumber : ''
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

  // Engine normal mint
  const handleEngineNormalMint = async () => {
    if (!generatedImageBlob) {
      setMintError('Missing generated image for minting')
      return
    }

    if (!address) {
      setMintError('Connect wallet first to receive NFT')
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintSuccess(null)

    try {
      let nftName: string
      let nftDescription: string
      let attributes: any[]

      if (contentType === 'jersey') {
        if (!selectedTeam || !playerName || !playerNumber) {
          throw new Error('Missing jersey data for minting')
        }
        
        nftName = `${selectedTeam} ${playerName} #${playerNumber}`
        nftDescription = `AI-generated ${selectedTeam} jersey for ${playerName} #${playerNumber}. Style: ${selectedJerseyStyle}. Generated by AI Sports NFT Generator.`
        
        attributes = [
          { trait_type: 'Team', value: selectedTeam },
          { trait_type: 'Player Name', value: playerName },
          { trait_type: 'Player Number', value: playerNumber },
          { trait_type: 'Style', value: selectedJerseyStyle },
          { trait_type: 'Quality', value: quality },
          { trait_type: 'Type', value: 'Jersey' },
          { trait_type: 'Generator', value: 'AI Sports NFT' }
        ]
      } else {
        nftName = `AI Stadium - ${selectedStadiumStyle} ${selectedAtmosphere}`
        nftDescription = `AI-generated stadium. Style: ${selectedStadiumStyle}, Atmosphere: ${selectedAtmosphere}, Time: ${selectedTimeOfDay}, Weather: ${selectedWeather}. Generated by AI Sports NFT Generator.`
        
        attributes = [
          { trait_type: 'Style', value: selectedStadiumStyle },
          { trait_type: 'Atmosphere', value: selectedAtmosphere },
          { trait_type: 'Time of Day', value: selectedTimeOfDay },
          { trait_type: 'Weather', value: selectedWeather },
          { trait_type: 'Quality', value: quality },
          { trait_type: 'Type', value: 'Stadium' },
          { trait_type: 'Generator', value: 'AI Sports NFT' }
        ]
      }

      console.log('⚡ ENGINE NORMAL: Starting normal mint process...')
      console.log('📦 Name:', nftName)
      console.log('📝 Description:', nftDescription)
      console.log('🎯 Recipient:', address)

      // Upload image and metadata to IPFS first
      const ipfsResult = await IPFSService.uploadComplete(
        generatedImageBlob,
        nftName,
        nftDescription,
        contentType === 'jersey' ? selectedTeam : 'Stadium',
        contentType === 'jersey' ? selectedJerseyStyle : selectedStadiumStyle,
        contentType === 'jersey' ? playerName : '',
        contentType === 'jersey' ? playerNumber : ''
      )

      console.log('📤 IPFS Upload successful:', ipfsResult.imageUrl)

      // Create metadata for Engine
      const metadata = {
        name: nftName,
        description: nftDescription,
        image: ipfsResult.imageUrl,
        attributes
      }

      console.log('🚀 Calling Engine mint...')
      
      const result = await mintGasless({
        to: address,
        metadataUri: ipfsResult.metadataUrl
      })
      
      if (result.success) {
        console.log('✅ ENGINE NORMAL: Mint successful!', result)
        setMintSuccess(`NFT minted successfully! Transaction: ${result.transactionHash}`)
        setTransactionHash(result.transactionHash)
        setMintedTokenId(result.tokenId)
        setMintStatus('success')
      } else {
        throw new Error(result.error || 'Mint failed')
      }
      
    } catch (error: any) {
      console.error('❌ ENGINE NORMAL: Mint failed:', error)
      setMintError(error instanceof Error ? error.message : 'Mint failed')
      setMintStatus('error')
    } finally {
      setIsMinting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setGeneratedImage(null)
    setGeneratedImageBlob(null)
    setError(null)
    setIpfsUrl(null)
    setIpfsError(null)
    setMintError(null)
    setMintSuccess(null)
    setMintedTokenId(null)
    setTransactionHash(null)
    setMintStatus('idle')
    setGenerationCost(null)
    
    if (contentType === 'jersey') {
      setPlayerName('JEFF')
      setPlayerNumber('10')
      setSelectedTeam('')
    } else {
      setStadiumPrompt('')
      setReferenceImage(null)
      setReferenceImagePreview('')
    }
  }

  // Load teams for jerseys
  useEffect(() => {
    if (contentType === 'jersey') {
      const loadTeams = async () => {
        try {
          const teams = await Dalle3Service.getAvailableTeams()
          setAvailableTeams(teams)
          if (teams.length > 0 && !selectedTeam) {
            setSelectedTeam(teams[0])
          }
        } catch (error) {
          console.error('Failed to load teams:', error)
        }
      }
      loadTeams()
    }
  }, [contentType])

  // Check API status
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        if (contentType === 'jersey') {
          const status = await Dalle3Service.checkHealth()
          setApiStatus(status)
        } else {
          const status = await StadiumService.checkHealth()
          setApiStatus(status)
        }
      } catch (error) {
        setApiStatus(false)
      }
    }
    checkApiStatus()
  }, [contentType])

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Content Type Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Sports NFT Generator</h1>
          <p className="text-gray-400 mt-1">Create unique jerseys and stadiums with AI</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs value={contentType} onValueChange={(value) => setContentType(value as 'jersey' | 'stadium')}>
            <TabsList>
              <TabsTrigger value="jersey" className="flex items-center gap-2">
                <Shirt className="w-4 h-4" />
                Jerseys
              </TabsTrigger>
              <TabsTrigger value="stadium" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Stadiums
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Badge variant={apiStatus ? "default" : "destructive"}>
              {apiStatus ? "API Online" : "API Offline"}
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Wallet className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content Generation Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {contentType === 'jersey' ? (
              <>
                <Shirt className="w-5 h-5" />
                Jersey Generator
              </>
            ) : (
              <>
                <Building className="w-5 h-5" />
                Stadium Generator
              </>
            )}
          </CardTitle>
          <CardDescription>
            {contentType === 'jersey' 
              ? 'Customize your AI-generated jersey with team, player details, and style'
              : 'Generate stunning stadium images with AI using prompts or reference images'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {contentType === 'jersey' ? (
            // Jersey Form
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team" className="text-white">Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {availableTeams.map((team) => (
                        <SelectItem key={team} value={team} className="text-white">
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="playerName" className="text-white">Player Name</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter player name"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="playerNumber" className="text-white">Number</Label>
                    <Input
                      id="playerNumber"
                      value={playerNumber}
                      onChange={(e) => setPlayerNumber(e.target.value)}
                      placeholder="10"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white">Style</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {JERSEY_STYLE_FILTERS.map((style) => (
                      <Button
                        key={style.id}
                        variant={selectedJerseyStyle === style.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedJerseyStyle(style.id)}
                        className="flex items-center gap-2"
                      >
                        <style.icon className="w-4 h-4" />
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white">Quality</Label>
                  <Select value={quality} onValueChange={(value) => setQuality(value as 'standard' | 'hd')}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="standard" className="text-white">Standard ($0.04)</SelectItem>
                      <SelectItem value="hd" className="text-white">HD ($0.08)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            // Stadium Form
            <div className="space-y-6">
              {/* Prompt or Reference Image */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stadiumPrompt" className="text-white">Stadium Prompt</Label>
                  <Textarea
                    id="stadiumPrompt"
                    value={stadiumPrompt}
                    onChange={(e) => setStadiumPrompt(e.target.value)}
                    placeholder="Describe the stadium you want to generate... (e.g., 'Modern football stadium with red seats and dramatic lighting')"
                    className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  />
                </div>

                <div className="text-center text-gray-400">
                  <span>OR</span>
                </div>

                <div>
                  <Label className="text-white">Reference Image</Label>
                  <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {referenceImagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={referenceImagePreview} 
                          alt="Reference" 
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                        />
                        <p className="text-sm text-gray-400">
                          {referenceImage?.name} ({((referenceImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-lg font-medium text-white">Upload reference stadium image</p>
                        <p className="text-sm text-gray-400">
                          Supports PNG, JPG, WEBP (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Stadium Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Generation Style</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {STADIUM_STYLE_FILTERS.map((style) => (
                        <Button
                          key={style.id}
                          variant={selectedStadiumStyle === style.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedStadiumStyle(style.id as any)}
                          className="flex items-center gap-2"
                        >
                          <style.icon className="w-4 h-4" />
                          {style.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Atmosphere</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {STADIUM_ATMOSPHERE_FILTERS.map((atmosphere) => (
                        <Button
                          key={atmosphere.id}
                          variant={selectedAtmosphere === atmosphere.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAtmosphere(atmosphere.id as any)}
                          className="flex items-center gap-2"
                        >
                          <atmosphere.icon className="w-4 h-4" />
                          {atmosphere.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Time of Day</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {STADIUM_TIME_FILTERS.map((time) => (
                        <Button
                          key={time.id}
                          variant={selectedTimeOfDay === time.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTimeOfDay(time.id as any)}
                          className="flex items-center gap-2"
                        >
                          <time.icon className="w-4 h-4" />
                          {time.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Weather</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {STADIUM_WEATHER_FILTERS.map((weather) => (
                        <Button
                          key={weather.id}
                          variant={selectedWeather === weather.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedWeather(weather.id as any)}
                          className="flex items-center gap-2"
                        >
                          <weather.icon className="w-4 h-4" />
                          {weather.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Quality</Label>
                    <Select value={quality} onValueChange={(value) => setQuality(value as 'standard' | 'hd')}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="standard" className="text-white">Standard ($0.04)</SelectItem>
                        <SelectItem value="hd" className="text-white">HD ($0.08)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-4">
            <Button
              onClick={generateContent}
              disabled={isLoading || !apiStatus}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate {contentType === 'jersey' ? 'Jersey' : 'Stadium'}
                </>
              )}
            </Button>
            
            {generatedImage && (
              <Button onClick={resetForm} variant="outline">
                Reset
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Image Display */}
      {generatedImage && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Generated {contentType === 'jersey' ? 'Jersey' : 'Stadium'}</CardTitle>
            {generationCost && (
              <CardDescription>
                Generation cost: ${generationCost.toFixed(4)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${generatedImage}`}
                  alt={`Generated ${contentType}`}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={uploadToIPFS}
                  disabled={isUploadingToIPFS}
                  variant="outline"
                  className="flex-1"
                >
                  {isUploadingToIPFS ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading to IPFS...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to IPFS
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleEngineNormalMint}
                  disabled={isMinting || !canMintGasless}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isMinting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Mint NFT (Gasless)
                    </>
                  )}
                </Button>
              </div>

              {/* IPFS Status */}
              {ipfsUrl && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Successfully uploaded to IPFS: <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{ipfsUrl}</a>
                  </AlertDescription>
                </Alert>
              )}

              {ipfsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{ipfsError}</AlertDescription>
                </Alert>
              )}

              {/* Mint Status */}
              {mintSuccess && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>{mintSuccess}</AlertDescription>
                </Alert>
              )}

              {mintError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{mintError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 