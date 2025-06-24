'use client'

import React, { useState, useEffect } from 'react'
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
  const [analysisPrompt, setAnalysisPrompt] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-4o-mini')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageBase64, setImageBase64] = useState<string>('')
  
  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<VisionResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<boolean>(false)
  const [analysisCost, setAnalysisCost] = useState<number | null>(null)

  // Generation state (igual Jersey)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPrompt, setGenerationPrompt] = useState<string>('')
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
  
  // Smooth Carousel state with drag & scroll
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const slidesToShow = 3 // Smaller for vision test
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

  // Scroll bar handler
  const handleScrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setCurrentSlide(value)
  }

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  const isOnChzChain = chainId === 88888 || chainId === 88882
  const isOnPolygonChain = chainId === 137 || chainId === 80002
  
  // Admin check
  const isUserAdmin = isAdmin(account)
  
  // Conditions for vision test
  const canAnalyze = uploadedFile && imageBase64 && analysisPrompt.trim()
  const canGenerate = analysisResult?.success && generationPrompt.trim()
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage
  const canMintGasless = generatedImage && analysisResult && isUserAdmin

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

  // Analyze image with Vision API
  const analyzeImage = async () => {
    if (!canAnalyze) {
      setError('Please upload an image and add analysis prompt')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const request: VisionAnalysisRequest = {
        image_base64: imageBase64,
        analysis_prompt: analysisPrompt,
        model: selectedModel
      }

      const result = await VisionTestService.analyzeImage(request)
      setAnalysisResult(result)
      
      if (result.success && result.cost_estimate) {
        setAnalysisCost(result.cost_estimate)
      }

      if (!result.success) {
        setError(result.error || 'Analysis failed')
      } else {
        // Auto-generate prompt for DALL-E based on analysis
        const autoPrompt = `Create an improved version based on this analysis: ${result.analysis?.substring(0, 300)}...`
        setGenerationPrompt(autoPrompt)
      }
    } catch (error) {
      console.error('❌ Analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate improved image with DALL-E 3
  const generateImprovedImage = async () => {
    if (!canGenerate) {
      setError('Please complete analysis first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log('🎨 Generating improved image with DALL-E 3...')
      
      // Use DALL-E 3 directly via OpenAI
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generationPrompt,
          quality: quality,
          type: 'vision-improvement'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.image_base64) {
        const imageUrl = Dalle3Service.base64ToImageUrl(result.image_base64)
        setGeneratedImage(imageUrl)
        setGenerationCost(result.cost_usd || null)
        
        // Convert to blob for IPFS
        const base64Data = result.image_base64.replace(/^data:image\/[a-z]+;base64,/, '')
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        setGeneratedImageBlob(blob)
      } else {
        setError(result.error || 'Generation failed')
      }
    } catch (error) {
      console.error('❌ Generation error:', error)
      setError(error instanceof Error ? error.message : 'Generation failed')
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
      const name = `Vision Test - ${analysisPrompt}`
      const description = `AI Vision Analysis + Generated Improvement: ${analysisResult?.analysis?.substring(0, 200)}...`

      const result = await IPFSService.uploadComplete(
        generatedImageBlob,
        name,
        description,
        'vision-test',
        analysisPrompt,
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

      const name = `Vision Test - ${analysisPrompt}`
      const description = `AI Vision Analysis + Generated Improvement`

      const result = await mintGasless(
        address!,
        name,
        description,
        ipfsUrl!
      )

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

  // Reset form
  const resetForm = () => {
    setUploadedFile(null)
    setImagePreview('')
    setImageBase64('')
    setAnalysisResult(null)
    setGeneratedImage(null)
    setGeneratedImageBlob(null)
    setError(null)
    setAnalysisPrompt('')
    setGenerationPrompt('')
    setAnalysisCost(null)
    setGenerationCost(null)
    setIpfsUrl(null)
    setIpfsError(null)
    setMintError(null)
    setMintSuccess(null)
    setMintedTokenId(null)
    setTransactionHash(null)
    setMintStatus('idle')
  }

  // Load marketplace data and check API status
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await VisionTestService.checkHealth()
        setApiStatus(status)
      } catch (error) {
        console.error('API status check failed:', error)
        setApiStatus(false)
      }
    }

    const loadMarketplaceData = async () => {
      try {
        setMarketplaceLoading(true)
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          🔍 Vision Test Lab
        </h1>
        <p className="text-gray-400">
          Analise qualquer imagem com GPT-4 Vision e recrie versões personalizadas com DALL-E 3
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">
            Vision API: {apiStatus ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Image Upload */}
          <div className="cyber-card border-secondary/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Imagem
            </h3>
            
            {/* Upload Area - Visível para Vision Test */}
            <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-8 mb-6 text-center cyber-card">
              <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">Upload image for Vision analysis</p>
              <input 
                type="file" 
                className="hidden" 
                id="file-upload"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <label 
                htmlFor="file-upload" 
                className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
              >
                Choose file
              </label>
            </div>
            
            {imagePreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-secondary/30 mb-4">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="cyber-card border-secondary/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Prompt para Análise
            </h3>
            
            <div className="space-y-4">
              <textarea
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                placeholder="Descreva como você quer que a IA analise sua imagem... (Ex: 'Descreva esta imagem em detalhes' ou 'Analise as cores e formas desta maçã')"
                className="w-full p-4 rounded-lg bg-primary/20 border border-secondary/30 text-secondary resize-none h-32 text-sm"
              />
              <p className="text-xs text-gray-400">
                💡 Dica: Seja específico sobre o que você quer analisar na imagem
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <div className="cyber-card border-secondary/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Modelo Vision</h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-3 rounded-lg bg-primary/20 border border-secondary/30 text-secondary"
            >
              <option value="openai/gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
              <option value="openai/gpt-4o">GPT-4o (Premium)</option>
              <option value="meta-llama/llama-3.2-11b-vision-instruct">Llama 3.2 Vision</option>
              <option value="qwen/qwen-2-vl-72b-instruct">Qwen 2 VL</option>
            </select>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeImage}
            disabled={!canAnalyze || isAnalyzing}
            className={`w-full cyber-button p-4 flex items-center justify-center gap-3 text-lg font-semibold transition-all ${
              canAnalyze && !isAnalyzing
                ? 'bg-accent text-white border-accent hover:bg-accent/80'
                : 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analisando com {selectedModel.split('/')[1]}...
              </>
            ) : !uploadedFile ? (
              <>
                <Upload className="w-5 h-5" />
                Faça upload de uma imagem primeiro
              </>
            ) : !analysisPrompt.trim() ? (
              <>
                <Brain className="w-5 h-5" />
                Adicione um prompt de análise
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Analisar Imagem com IA
              </>
            )}
          </button>
          
          {uploadedFile && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Imagem carregada: {uploadedFile.name}
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
                Resultado da Análise
              </h3>
              
              {analysisResult.success ? (
                <div className="space-y-4">
                  <div className="bg-primary/10 p-4 rounded-lg border border-secondary/20 max-h-64 overflow-y-auto">
                    <p className="text-secondary whitespace-pre-wrap text-sm leading-relaxed">
                      {analysisResult.analysis}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Modelo: {analysisResult.model_used}</span>
                    {analysisResult.cost_estimate && (
                      <span>Custo: ${analysisResult.cost_estimate.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                  <p className="text-red-400">
                    Erro: {analysisResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Generation Prompt */}
          {analysisResult?.success && (
            <div className="cyber-card border-secondary/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Prompt para Geração
              </h3>
              
              <div className="space-y-4">
                <div className="bg-primary/10 p-3 rounded-lg border border-secondary/20">
                  <p className="text-xs text-gray-400 mb-2">📝 Análise completa:</p>
                  <p className="text-secondary text-xs leading-relaxed max-h-20 overflow-y-auto">
                    {analysisResult.analysis?.substring(0, 200)}...
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-secondary mb-2 block">
                    Prompt para DALL-E 3 (edite conforme necessário):
                  </label>
                  <textarea
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    placeholder="Descreva como você quer que a DALL-E 3 recrie/modifique sua imagem... (Ex: 'Uma maçã azul com as mesmas características')"
                    className="w-full p-4 rounded-lg bg-primary/20 border border-secondary/30 text-secondary resize-none h-32 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Dica: Use palavras como "alta qualidade", "detalhado", "profissional", "4K"
                  </p>
                </div>
                
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                  className="w-full p-3 rounded-lg bg-primary/20 border border-secondary/30 text-secondary"
                >
                  <option value="standard">Standard Quality ($0.04)</option>
                  <option value="hd">HD Quality ($0.08)</option>
                </select>

                <button
                  onClick={generateImprovedImage}
                  disabled={!canGenerate || isGenerating}
                  className={`w-full cyber-button p-4 flex items-center justify-center gap-3 text-lg font-semibold transition-all ${
                    canGenerate && !isGenerating
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gerando com DALL-E 3...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Gerar Imagem Personalizada
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview & Mint */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Original Image Preview */}
          {imagePreview && (
            <div className="cyber-card border-secondary/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Imagem Original
              </h3>
              
              <div className="space-y-4">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-secondary/30">
                  <Image
                    src={imagePreview}
                    alt="Original"
                    fill
                    className="object-cover"
                  />
                </div>
                
                {uploadedFile && (
                  <p className="text-sm text-gray-400 text-center">
                    {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="cyber-card border-secondary/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Imagem Gerada
              </h3>
              
              <div className="space-y-4">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-secondary/30">
                  <Image
                    src={generatedImage}
                    alt="Generated"
                    fill
                    className="object-cover"
                  />
                </div>
                
                {generationCost && (
                  <p className="text-sm text-gray-400 text-center">
                    Custo: ${generationCost.toFixed(3)}
                  </p>
                )}
              </div>
            </div>
          )}

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
                        Ver Transação
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || mintError || ipfsError) && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error || mintError || ipfsError}
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
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{nft.description}</p>
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
