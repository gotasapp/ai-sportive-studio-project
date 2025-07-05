'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Eye, Brain, Zap, Camera, Globe, Crown, Palette, Wallet, AlertTriangle, Check, FileImage } from 'lucide-react'
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react'
import Image from 'next/image'

import { VisionTestService, VisionAnalysisRequest, VisionResponse } from '../lib/services/vision-test-service'
import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { getTransactionUrl } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { isAdmin } from '../lib/admin-config'

// Marketplace data will be loaded from JSON
interface MarketplaceNFT {
  name: string;
  image_url: string;
  description: string;
  price: string;
}

// Vision Test options
const sportsOptions = [
  { id: 'soccer', name: 'Soccer/Football', description: 'Professional soccer jersey' },
  { id: 'basketball', name: 'Basketball', description: 'NBA/Basketball jersey' },
  { id: 'nfl', name: 'American Football', description: 'NFL jersey' }
]

const viewOptions = [
  { id: 'back', name: 'Back View', description: 'Jersey back with player name/number' },
  { id: 'front', name: 'Front View', description: 'Jersey front with logo/badge' }
]

const styleOptions = [
  { id: 'classic', name: 'Classic', description: 'Traditional professional sports design' },
  { id: 'modern', name: 'Modern', description: 'Contemporary athletic design with clean lines' },
  { id: 'retro', name: 'Retro', description: 'Vintage retro sports aesthetic' },
  { id: 'urban', name: 'Urban', description: 'Urban street sports style' },
  { id: 'premium', name: 'Premium', description: 'Luxury premium sports merchandise' },
  { id: 'vintage', name: 'Vintage', description: 'Classic vintage sports uniform style' }
]

const visionModels = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4O Mini', cost: '~$0.01' },
  { id: 'openai/gpt-4o', name: 'GPT-4O', cost: '~$0.03' },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 Vision', cost: '~$0.02' },
  { id: 'qwen/qwen-2-vl-72b-instruct', name: 'Qwen 2 VL', cost: '~$0.025' },
  { id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision', cost: '~$0.02' }
]

export default function VisionTestEditor() {
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

  // Vision Test specific state
  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-4o-mini')
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [selectedView, setSelectedView] = useState('back')
  const [selectedStyle, setSelectedStyle] = useState('classic')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string>('')
  const [playerName, setPlayerName] = useState('')
  const [playerNumber, setPlayerNumber] = useState('')
  
  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<VisionResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<boolean>(false)
  const [analysisCost, setAnalysisCost] = useState<number | null>(null)

  // Generation state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null)
  const [generationCost, setGenerationCost] = useState<number | null>(null)
  
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
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const slidesToShow = 3
  const maxSlide = Math.max(0, marketplaceNFTs.length - slidesToShow)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Network validation
  const supportedChainIds = [88888, 88882, 137, 80002]
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  
  // Admin check
  const isUserAdmin = isAdmin(account)
  
  // Reset player data when switching away from back view
  useEffect(() => {
    if (selectedView !== 'back') {
      setPlayerName('')
      setPlayerNumber('')
    }
  }, [selectedView])
  
  // Conditions for vision test
  const canAnalyze = uploadedFile && imageBase64
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage
  const canMintGasless = generatedImage && analysisResult && isUserAdmin

  // Carousel functions
  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, maxSlide))
  }
  
  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0))
  }

  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setDragStart(clientX)
    setDragOffset(0)
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    const offset = (clientX - dragStart) * 0.6
    setDragOffset(offset)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (Math.abs(dragOffset) > 80) {
      if (dragOffset > 0) {
        prevSlide()
      } else {
        nextSlide()
      }
    }
    setDragOffset(0)
  }

  const handleScrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setCurrentSlide(value)
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      setUploadedFile(file)
      
      const processed = await VisionTestService.processImageUpload(file)
      setImageBase64(processed.base64)
      setImagePreview(processed.preview)
      
      console.log('✅ File uploaded and processed')
    } catch (error) {
      console.error('❌ File upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  // Generate image with automatic analysis
  const generateImageWithAnalysis = async () => {
    if (!uploadedFile) {
      setError('Upload an image first')
      return
    }

    // Validate player details for back view
    if (selectedView === 'back' && (!playerName.trim() || !playerNumber.trim())) {
      setError('Player name and number are required for back view jerseys')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Step 1: Auto-analyze the uploaded image with sport-specific prompt
      console.log(`🔍 Auto-analyzing ${selectedSport} jersey (${selectedView} view) with Vision AI...`)
      setAnalysisResult({ success: false, analysis: 'Analyzing...', cost_estimate: 0, model_used: selectedModel })
      
      // Get the specific structured analysis prompt for this sport and view
      console.log('📋 [VISION TEST] Requesting structured analysis prompt:', {
        sport: selectedSport,
        view: selectedView,
        timestamp: new Date().toISOString()
      })
      
      const analysisPromptResponse = await fetch('/api/vision-prompts/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          view: selectedView
        }),
      })

      let specificAnalysisPrompt = `Analyze this ${selectedSport} jersey image and return a JSON object with colors, pattern, fabric, style, and design details.`
      
      if (analysisPromptResponse.ok) {
        const promptData = await analysisPromptResponse.json()
        console.log('📊 [VISION TEST] Analysis prompt response:', {
          success: promptData.success,
          type: promptData.metadata?.type,
          promptLength: promptData.metadata?.prompt_length,
          sport: promptData.metadata?.sport,
          view: promptData.metadata?.view
        })
        
        if (promptData.success && promptData.analysis_prompt) {
          specificAnalysisPrompt = promptData.analysis_prompt
          console.log('✅ [VISION TEST] Using structured JSON analysis prompt')
          console.log('📝 [VISION TEST] Prompt preview:', specificAnalysisPrompt.substring(0, 200) + '...')
        }
      } else {
        console.log('⚠️ [VISION TEST] Failed to get structured prompt, using fallback')
        console.log('❌ [VISION TEST] Prompt response error:', analysisPromptResponse.status)
      }
      
      // Validate base64 before sending
      if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
        throw new Error('Invalid image data. Please upload a valid image file.')
      }
      
      console.log('📤 [VISION TEST] Sending to Vision API:', {
        model: selectedModel,
        promptLength: specificAnalysisPrompt.length,
        imageFormat: imageBase64.substring(0, 30) + '...',
        imageSize: imageBase64.length,
        isStructuredPrompt: specificAnalysisPrompt.includes('return ONLY a valid JSON object'),
        sport: selectedSport,
        view: selectedView
      })

      const analysisResponse = await fetch('/api/vision-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          prompt: specificAnalysisPrompt,
          model: selectedModel
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed! Status: ${analysisResponse.status}`)
      }

      const analysisResult = await analysisResponse.json()
      if (!analysisResult.success) {
        throw new Error(`Analysis error: ${analysisResult.error}`)
      }

      console.log('✅ Vision analysis completed!')
      setAnalysisResult(analysisResult)

      // Step 2: Get structured prompt based on selects
      console.log('🎨 Getting structured prompt for', selectedSport, selectedView, selectedStyle)
      const promptResponse = await fetch('/api/vision-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          view: selectedView,
          playerName: playerName || '',
          playerNumber: playerNumber || '',
          style: selectedStyle
        }),
      })

      if (!promptResponse.ok) {
        throw new Error('Failed to get structured prompt')
      }

      const promptData = await promptResponse.json()
      if (!promptData.success) {
        throw new Error(promptData.error || 'Prompt generation failed')
      }

      // Step 3: Combine analysis + structured prompt + quality settings
      const finalPrompt = `
        ${promptData.prompt}
        
        ORIGINAL DESIGN ANALYSIS: ${analysisResult.analysis}
        
        QUALITY REQUIREMENTS: Premium sports jersey, professional athletic design, studio lighting, 4K quality, no mannequin or human model, clean background, hyper-realistic fabric texture.
      `.trim()

      console.log('📋 Player details:', playerName ? `${playerName} #${playerNumber}` : 'No player data')
      console.log('🎯 Final combined prompt ready')

      // Step 4: Generate new image using backend API with OPENAI_API_KEY
      console.log('🎨 [VISION TEST] Generating via backend API...')
      
      const result = await VisionTestService.generateImage(finalPrompt)

      console.log('✅ [VISION TEST] Backend API generation completed!')

      setGeneratedImage(`data:image/png;base64,${result.image_base64}`)
      setGenerationCost((analysisResult.cost_estimate || 0) + (result.cost_usd || 0))
      console.log('✅ Complete Vision Test flow completed successfully!')
      
      // Convert to blob for minting
      const base64Data = result.image_base64
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      setGeneratedImageBlob(blob)
    } catch (error: any) {
      console.error('❌ Vision Test flow error:', error)
      setError(error instanceof Error ? error.message : 'Process failed')
    } finally {
      setIsGenerating(false)
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
      const name = `Vision Test - ${selectedSport} ${selectedView}`
      const description = `AI Vision Analysis + Generated Improvement: ${analysisResult?.analysis?.substring(0, 200)}...`

      const result = await IPFSService.uploadComplete(
        generatedImageBlob,
        name,
        description,
        'vision-test',
        `${selectedSport}_${selectedView}_analysis`,
        'analysis',
        selectedModel
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

  // Mint NFT (gasless)
  const handleEngineNormalMint = async () => {
    if (!canMintGasless) {
      setMintError('Requirements not met for gasless minting')
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintStatus('pending')

    try {
      if (!ipfsUrl) {
        await uploadToIPFS()
        if (!ipfsUrl) {
          throw new Error('IPFS upload required for minting')
        }
      }

      const name = `Vision Test - ${selectedSport} ${selectedView}`
      const description = `AI Vision Analysis + Generated Improvement`

      const result = await mintGasless({
        to: address!,
        metadataUri: ipfsUrl!
      })

      if (result.success) {
        setMintSuccess('NFT minted successfully!')
        setMintedTokenId(result.tokenId || null)
        setMintStatus('success')
        if (result.transactionHash) {
          setTransactionHash(result.transactionHash)
        }
      } else {
        throw new Error(result.error || 'Minting failed')
      }
    } catch (error: any) {
      console.error('❌ Minting error:', error)
      setMintError(error.message || 'Minting failed')
      setMintStatus('error')
    } finally {
      setIsMinting(false)
    }
  }

  const resetForm = () => {
    setUploadedFile(null)
    setImagePreview(null)
    setImageBase64('')
    setAnalysisResult(null)
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
    setPlayerName('')
    setPlayerNumber('')
  }

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/vision-test')
        setApiStatus(response.ok)
      } catch {
        setApiStatus(false)
      }
    }

    const loadMarketplaceData = async () => {
      try {
        const response = await fetch('/marketplace-images.json')
        if (response.ok) {
          const data = await response.json()
          setMarketplaceNFTs(data.nfts || [])
        }
      } catch (error) {
        console.error('Failed to load marketplace data:', error)
      } finally {
        setMarketplaceLoading(false)
      }
    }

    checkApiStatus()
    loadMarketplaceData()
  }, [])

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload({ target: { files } } as any)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          🔍 Vision Test Lab
        </h1>
        <p className="text-white">
          Analise qualquer imagem com GPT-4 Vision e recrie versões personalizadas com DALL-E 3
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-white">
            Vision API: {apiStatus ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Upload Section */}
          <div className="cyber-card border-secondary/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Image
            </h3>
            
            <div 
              className="border-2 border-dashed border-secondary/30 rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-secondary/50 mx-auto mb-4" />
              <p className="text-white mb-2">
                {uploadedFile ? uploadedFile.name : "Drop your image here or click to browse"}
              </p>
              <p className="text-white text-sm">
                Supports JPG, PNG, WebP (max 10MB)
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Sport Selection */}
          <div className="cyber-card border-secondary/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Jersey Configuration
            </h3>
            
            <div className="space-y-4">
              {/* Sport Type */}
              <div>
                <label className="text-sm text-white mb-2 block">
                  Sport Type:
                </label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full p-3 rounded-lg bg-primary/20 border border-secondary/30 text-white"
                >
                  {sportsOptions.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Type */}
              <div>
                <label className="text-sm text-white mb-2 block">
                  Jersey View:
                </label>
                <select
                  value={selectedView}
                  onChange={(e) => setSelectedView(e.target.value)}
                  className="w-full p-3 rounded-lg bg-primary/20 border border-secondary/30 text-white"
                >
                  {viewOptions.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name} - {view.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Theme */}
              <div>
                <label className="text-sm text-white mb-2 block">
                  Style Theme:
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full p-3 rounded-lg bg-primary/20 border border-secondary/30 text-white"
                >
                  {styleOptions.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name} - {style.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Details - Only show for back view */}
              {selectedView === 'back' && (
                <>
                  <div className="border-t border-secondary/20 pt-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Player Details (Back View)</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white mb-2 block">
                          Player Name: {selectedView === 'back' && <span className="text-accent">*</span>}
                        </label>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder={
                            selectedSport === 'soccer' ? 'MESSI' :
                            selectedSport === 'basketball' ? 'JORDAN' :
                            selectedSport === 'nfl' ? 'BRADY' : 'PLAYER'
                          }
                          className={`w-full p-3 rounded-lg bg-primary/20 border text-white placeholder:text-gray-500 ${
                            selectedView === 'back' && !playerName.trim() 
                              ? 'border-accent/50' 
                              : 'border-secondary/30'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-white mb-2 block">
                          Number: {selectedView === 'back' && <span className="text-accent">*</span>}
                        </label>
                        <input
                          type="text"
                          value={playerNumber}
                          onChange={(e) => setPlayerNumber(e.target.value)}
                          placeholder={
                            selectedSport === 'soccer' ? '10' :
                            selectedSport === 'basketball' ? '23' :
                            selectedSport === 'nfl' ? '12' : '00'
                          }
                          className={`w-full p-3 rounded-lg bg-primary/20 border text-white placeholder:text-gray-500 ${
                            selectedView === 'back' && !playerNumber.trim() 
                              ? 'border-accent/50' 
                              : 'border-secondary/30'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-white mt-2">
                      {selectedView === 'back' 
                        ? '⚡ Required fields for back view jersey generation'
                        : '💡 These will be added to the generated jersey back'
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImageWithAnalysis}
            disabled={!canAnalyze || isGenerating || (selectedView === 'back' && (!playerName.trim() || !playerNumber.trim()))}
            className={`w-full cyber-button p-4 flex items-center justify-center gap-3 text-lg font-semibold transition-all ${
              canAnalyze && !isGenerating && (selectedView !== 'back' || (playerName.trim() && playerNumber.trim()))
                ? 'bg-accent text-white border-accent hover:bg-accent/80'
                : 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Vision Test...
              </>
            ) : !uploadedFile ? (
              <>
                <Upload className="w-5 h-5" />
                Upload an image first
              </>
            ) : selectedView === 'back' && (!playerName.trim() || !playerNumber.trim()) ? (
              <>
                <Zap className="w-5 h-5" />
                Add Player Details First
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Custom Jersey
              </>
            )}
          </button>
          
          {uploadedFile && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Image loaded: {uploadedFile.name}
              </p>
            </div>
          )}
        </div>

        {/* Middle Panel - Analysis & Generation */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Analysis Results */}
          {analysisResult && (
            <div className="cyber-card border-secondary/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Analysis Results
              </h3>
              
              {analysisResult.success ? (
                <div className="space-y-4">
                  <div className="bg-primary/10 p-4 rounded-lg border border-secondary/20 max-h-64 overflow-y-auto">
                    <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {analysisResult.analysis}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-white">
                    <span>Model: {analysisResult.model_used}</span>
                    {analysisResult.cost_estimate && (
                      <span>Cost: ${analysisResult.cost_estimate.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                  <p className="text-red-400">
                    Error: {analysisResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quality Settings */}
          <div className="cyber-card border-secondary/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Generation Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white mb-2 block">
                  Image Quality:
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                  className="w-full p-3 rounded-lg bg-primary/20 border border-secondary/30 text-white"
                >
                  <option value="standard">Standard Quality ($0.04)</option>
                  <option value="hd">HD Quality ($0.08)</option>
                </select>
                <p className="text-xs text-white mt-2">
                  💡 HD quality provides better detail and resolution
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview & Mint */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Vision Test Preview Card */}
          <div>
            <div className="p-8 lg:p-4">
              <div className="flex justify-center h-[80vh]">
                <div className="relative w-[60vh] h-[75vh] rounded-2xl overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #050505 0%, #0E0D0D 50%, #191919 100%)',
                  border: '2px solid rgba(156, 163, 175, 0.3)'
                }}>
                  
                  {/* Loading state for analysis */}
                  {isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-24 h-24 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-8"></div>
                      <p className="text-cyan-400 text-2xl font-semibold">Generating with DALL-E 3...</p>
                      <div className="mt-6 w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error state */}
                  {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8">
                          <span className="text-red-400 text-4xl">⚠</span>
                        </div>
                        <p className="text-red-400 mb-8 text-center text-xl">{error}</p>
                        <button 
                          onClick={() => setError(null)}
                          className="px-8 py-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-lg"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Generated image display */}
                  {generatedImage && !isGenerating && !error && (
                    <div className="absolute inset-0 p-6 lg:p-3">
                      <Image src={generatedImage} alt="Generated Vision Test" width={384} height={576} className="w-full h-full object-contain rounded-lg" />
                      <div className="absolute inset-0 lg:inset-3 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
                      <div className="absolute -top-3 lg:top-1 -right-3 lg:right-1 w-8 lg:w-6 h-8 lg:h-6 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                      
                      <div className="absolute bottom-0 lg:bottom-3 left-0 lg:left-3 right-0 lg:right-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 lg:p-3 rounded-b-lg">
                        <div className="text-white">
                          <p className="font-bold text-2xl lg:text-lg">Vision AI Generated</p>
                          <p className="text-cyan-400 text-lg lg:text-sm">DALL-E 3 + GPT-4 Vision</p>
                          <div className="flex items-center mt-2 lg:mt-1 space-x-4 lg:space-x-3">
                            <span className="text-sm lg:text-xs text-white">Model: {selectedModel.split('/')[1]}</span>
                            {generationCost && (
                              <span className="text-sm lg:text-xs text-white">Cost: ${generationCost.toFixed(3)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Original image preview */}
                  {imagePreview && !generatedImage && !isGenerating && !error && (
                    <div className="absolute inset-0 p-6 lg:p-3">
                      <Image src={imagePreview} alt="Original Uploaded" width={384} height={576} className="w-full h-full object-contain rounded-lg" />
                      <div className="absolute inset-0 lg:inset-3 rounded-lg border-2 border-gray-400/30 pointer-events-none"></div>
                      
                      <div className="absolute bottom-0 lg:bottom-3 left-0 lg:left-3 right-0 lg:right-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 lg:p-3 rounded-b-lg">
                        <div className="text-white">
                          <p className="font-bold text-2xl lg:text-lg">Original Image</p>
                          <p className="text-white text-lg lg:text-sm">{uploadedFile?.name}</p>
                          <div className="flex items-center mt-2 lg:mt-1 space-x-4 lg:space-x-3">
                            <span className="text-sm lg:text-xs text-white">Ready for analysis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {!imagePreview && !generatedImage && !isGenerating && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-4">
                      <div className="text-center">
                        <div className="w-40 lg:w-32 h-48 lg:h-40 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 lg:mb-4 mx-auto">
                          <div className="text-center">
                            <Eye className="w-12 lg:w-8 h-12 lg:h-8 text-cyan-400/50 mx-auto mb-3 lg:mb-2" />
                            <p className="text-sm lg:text-xs text-white">Vision Test</p>
                          </div>
                        </div>
                        <p className="text-white text-lg lg:text-sm">Your vision test results will appear here</p>
                        <p className="text-cyan-400/70 text-sm lg:text-xs mt-3 lg:mt-2">Upload → Analyze → Generate</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mint Actions */}
          {generatedImage && (
            <div className="cyber-card border-secondary/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Mint NFT
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={uploadToIPFS}
                  disabled={isUploadingToIPFS}
                  className="w-full cyber-button bg-blue-600 text-white border-blue-600 hover:bg-blue-700 p-3 flex items-center justify-center gap-2"
                >
                  {isUploadingToIPFS ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload to IPFS
                    </>
                  )}
                </button>

                {isUserAdmin && (
                  <button
                    onClick={handleEngineNormalMint}
                    disabled={!canMintGasless || isMinting}
                    className="w-full cyber-button bg-accent text-white border-accent hover:bg-accent/80 p-3 flex items-center justify-center gap-2"
                  >
                    {isMinting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Minting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Mint NFT (Gasless)
                      </>
                    )}
                  </button>
                )}

                {mintSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                    <p className="text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {mintSuccess}
                    </p>
                    {transactionHash && (
                      <a
                        href={getTransactionUrl(transactionHash, chainId || 137)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        View Transaction
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {(mintError || ipfsError) && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {mintError || ipfsError}
              </p>
            </div>
          )}

          {/* Reset Button */}
          {(analysisResult || generatedImage || error) && (
            <button
              onClick={resetForm}
              className="w-full cyber-button bg-gray-600 text-white border-gray-600 hover:bg-gray-700 p-3"
            >
              Reset Form
            </button>
          )}
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="cyber-card border-secondary/30 p-6">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6" />
          Vision Test Gallery
        </h3>
        
        {marketplaceLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="relative">
            <div 
              className="flex gap-4 transition-transform duration-300 ease-out overflow-hidden"
              style={{ 
                transform: `translateX(-${currentSlide * (100 / slidesToShow)}%) translateX(${dragOffset}px)` 
              }}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseMove={(e) => handleDragMove(e.clientX)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
              onTouchEnd={handleDragEnd}
            >
              {marketplaceNFTs.map((nft, index) => (
                <div
                  key={index}
                  className="min-w-[280px] cyber-card border-secondary/20 p-4 cursor-pointer hover:border-accent/50 transition-all select-none"
                  style={{ flex: `0 0 ${100 / slidesToShow}%` }}
                >
                  <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={nft.image_url}
                      alt={nft.name}
                      fill
                      className="object-cover"
                      draggable={false}
                    />
                  </div>
                  
                  <h4 className="text-white font-semibold mb-1">{nft.name}</h4>
                  <p className="text-white text-sm mb-2 line-clamp-2">{nft.description}</p>
                  <p className="text-accent font-bold">{nft.price}</p>
                </div>
              ))}
            </div>

            {marketplaceNFTs.length > slidesToShow && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 cyber-button bg-primary/80 backdrop-blur-sm p-2 rounded-full"
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cyber-button bg-primary/80 backdrop-blur-sm p-2 rounded-full"
                  disabled={currentSlide >= maxSlide}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="flex justify-center mt-4">
                  <input
                    type="range"
                    min="0"
                    max={maxSlide}
                    value={currentSlide}
                    onChange={handleScrollChange}
                    className="w-64 h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
