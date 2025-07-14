'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check, Eye, FileImage, X } from 'lucide-react'
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { useRouter } from 'next/navigation'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest } from '../types'
import { getTransactionUrl } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { isAdmin } from '../lib/admin-config'

// Importando os novos componentes profissionais
import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalSidebar from '@/components/editor/ProfessionalSidebar'
import ProfessionalCanvas from '@/components/editor/ProfessionalCanvas'
import ProfessionalActionBar from '@/components/editor/ProfessionalActionBar'
import ProfessionalMarketplace from '@/components/editor/ProfessionalMarketplace'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

// Vision Analysis Options (from VisionTestEditor)
const SPORTS_OPTIONS = [
  { id: 'soccer', name: 'Soccer/Football', description: 'Professional soccer jersey' },
  { id: 'basketball', name: 'Basketball', description: 'NBA/Basketball jersey' },
  { id: 'nfl', name: 'American Football', description: 'NFL jersey' }
]

const VIEW_OPTIONS = [
  { id: 'back', name: 'Back View', description: 'Jersey back with player name/number' },
  { id: 'front', name: 'Front View', description: 'Jersey front with logo/badge' }
]

const VISION_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4O Mini', cost: '~$0.01' },
  { id: 'openai/gpt-4o', name: 'GPT-4O', cost: '~$0.03' },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 Vision', cost: '~$0.02' },
  { id: 'qwen/qwen-2-vl-72b-instruct', name: 'Qwen 2 VL', cost: '~$0.025' }
]

// Marketplace data will be loaded from JSON
interface MarketplaceNFT {
  name: string;
  imageUrl: string; // CORRIGIDO: sem underscore para ser consistente
  description: string;
  price: string;
}

export default function JerseyEditor() {
  const router = useRouter()
  
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

  // ===== EXISTING STATES =====
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('JEFF')
  const [playerNumber, setPlayerNumber] = useState<string>('10')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  
  // Debug: Log when generatedImage changes
  useEffect(() => {
    console.log('🔄 generatedImage changed:', !!generatedImage);
  }, [generatedImage]);
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
  
  // Save to DB state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Marketplace state
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)

  // ===== NEW VISION ANALYSIS STATES =====
  const [isVisionMode, setIsVisionMode] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageBlob, setReferenceImageBlob] = useState<Blob | null>(null)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  // Vision model fixed to default (admin can change in settings)
  const selectedVisionModel = 'openai/gpt-4o-mini'
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [selectedView, setSelectedView] = useState('back')
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  
  // Admin check
  const isUserAdmin = isAdmin(account)
  
  // Mint conditions
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy needs wallet
  const canMintGasless = generatedImage && selectedTeam && playerName && playerNumber && isUserAdmin // Gasless only for admins

  // ===== NEW VISION ANALYSIS FUNCTIONS =====
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG, WebP)')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Please upload an image smaller than 10MB')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Store blob for analysis
      setReferenceImageBlob(file)
      setIsVisionMode(true)
      
      console.log('📸 Reference image uploaded:', file.name, file.size)
      
    } catch (error) {
      console.error('❌ Upload error:', error)
      setError('Failed to upload image')
    }
  }

  const clearReferenceImage = () => {
    setReferenceImage(null)
    setReferenceImageBlob(null)
    setCustomPrompt('')
    setAnalysisResult(null)
    setIsVisionMode(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Get sport-specific labels
  const getSportLabel = () => {
    const sport = SPORTS_OPTIONS.find(s => s.id === selectedSport)
    return sport ? sport.name : 'Soccer'
  }

  const getViewLabel = () => {
    const view = VIEW_OPTIONS.find(v => v.id === selectedView)
    return view ? view.name : 'Back View'
  }

  const analyzeReferenceImage = async () => {
    if (!referenceImageBlob) return

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 [VISION ANALYSIS] Starting reference image analysis using original vision-test flow...')
      
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64String = result.split(',')[1]
          resolve(base64String)
        }
        reader.readAsDataURL(referenceImageBlob)
      })

      // STEP 1: Get structured ANALYSIS PROMPT from our new API
      console.log('📋 [VISION ANALYSIS] Step 1: Getting structured analysis prompt...')
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

      if (!analysisPromptResponse.ok) {
        throw new Error(`Failed to get analysis prompt: ${analysisPromptResponse.status}`)
      }

      const promptData = await analysisPromptResponse.json()
      
      if (!promptData.success) {
        throw new Error(promptData.error || 'Failed to get analysis prompt')
      }

      const structuredAnalysisPrompt = promptData.analysis_prompt
      console.log('✅ [VISION ANALYSIS] Got structured analysis prompt:', {
        sport: selectedSport,
        view: selectedView,
        promptLength: structuredAnalysisPrompt.length,
        focusAreas: promptData.metadata?.focus_areas?.length || 0
      })

      // STEP 2: Call vision API with structured prompt (with fallback)
      console.log('👁️ [VISION ANALYSIS] Step 2: Sending to Vision API for analysis...')
      
      let visionResult
      try {
        const visionResponse = await fetch('/api/vision-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: base64,
            prompt: structuredAnalysisPrompt,
            model: selectedVisionModel
          }),
        })

        if (!visionResponse.ok) {
          throw new Error(`Vision analysis failed: ${visionResponse.status}`)
        }

        visionResult = await visionResponse.json()
        
        if (!visionResult.success) {
          throw new Error(visionResult.error || 'Vision analysis failed')
        }
      } catch (fetchError: any) {
        console.log('⚠️ [VISION ANALYSIS] Vision API unavailable, using fallback mode')
        
        // Create fallback analysis
        visionResult = {
          success: true,
          analysis: `Professional ${selectedSport} jersey analysis: Style: ${selectedStyle}, Team: ${selectedTeam || 'custom'}, Player: ${playerName} #${playerNumber}. Using reference image for visual inspiration.`,
          model_used: 'fallback',
          cost_estimate: 0,
          fallback: true
        }
      }

      if (visionResult.fallback) {
        console.log('🔄 [VISION ANALYSIS] Using fallback analysis mode')
      } else {
        console.log('✅ [VISION ANALYSIS] Analysis completed successfully:', {
          model: visionResult.model_used,
          cost: visionResult.cost_estimate,
          analysisLength: visionResult.analysis?.length || 0
        })
      }

      // Use analysis result directly as text (bullet points format like vision-test)
      let finalResult = visionResult.analysis
      
      console.log('🔍 [VISION ANALYSIS] Using bullet-point analysis format:', {
        hasAnalysis: !!visionResult.analysis,
        analysisType: typeof visionResult.analysis,
        analysisLength: visionResult.analysis?.length || 0,
        analysisPreview: visionResult.analysis?.substring(0, 200) + '...',
        usingBulletPoints: true
      })

      // ===== CRITICAL: PERSISTENT STORAGE FOR ANALYSIS =====
      setAnalysisResult(finalResult)
      
      // Store in sessionStorage as backup to prevent loss
      if (finalResult) {
        try {
          sessionStorage.setItem('chz_vision_analysis', JSON.stringify({
            analysis: finalResult,
            timestamp: Date.now(),
            sport: selectedSport,
            view: selectedView
          }))
          console.log('💾 [ANALYSIS BACKUP] Stored analysis in sessionStorage as backup')
        } catch (storageError) {
          console.warn('⚠️ [ANALYSIS BACKUP] Failed to store in sessionStorage:', storageError)
        }
      }
      
      console.log('✅ [VISION ANALYSIS] Analysis completed successfully')
      console.log('🔍 [VISION ANALYSIS] Final result stored:', {
        type: typeof finalResult,
        isObject: typeof finalResult === 'object',
        hasData: !!finalResult,
        preview: typeof finalResult === 'object' ? JSON.stringify(finalResult).substring(0, 100) + '...' : String(finalResult).substring(0, 100) + '...',
        backupStored: true
      })

    } catch (error: any) {
      console.error('❌ [VISION ANALYSIS] Error:', error)
      setError(error.message || 'Failed to analyze reference image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ===== EXISTING FUNCTIONS (keeping all current logic) =====

  // Function to configure Claim Conditions (Admin)
  const handleSetClaimConditions = async () => {
    if (!isConnected) {
      setMintError('Connect wallet first')
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintSuccess(null)

    try {
      console.log('🔧 Admin setting claim conditions...')
      const result = await setClaimConditions()
      console.log('✅ Claim conditions set:', result)
      setMintSuccess('Claim conditions set! Now users can mint NFTs.')
      
      setTimeout(() => setMintSuccess(null), 8000)
    } catch (error: any) {
      console.error('❌ Set claim conditions failed:', error)
      setMintError(error instanceof Error ? error.message : 'Set claim conditions failed')
      setTimeout(() => setMintError(null), 8000)
    } finally {
      setIsMinting(false)
    }
  }

  // ⚡ ENGINE NORMAL MINT - Backend pays gas, user receives NFT
  const handleEngineNormalMint = async () => {
    if (!generatedImageBlob || !selectedTeam || !playerName || !playerNumber) {
      setMintError('Missing required data for minting')
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
      const nftName = `${selectedTeam} ${playerName} #${playerNumber}`
      const nftDescription = `AI-generated ${selectedTeam} jersey for ${playerName} #${playerNumber}. Style: ${selectedStyle}. Generated by AI Sports NFT Generator.`

      console.log('⚡ ENGINE NORMAL: Starting normal mint process...')

      // 1. Upload image and metadata to IPFS first
      const ipfsResult = await IPFSService.uploadComplete(
        generatedImageBlob,
        nftName,
        nftDescription,
        selectedTeam,
        selectedStyle,
        playerName,
        playerNumber
      );

      console.log('✅ IPFS upload completed:', ipfsResult.metadataUrl);

      // 2. Call the Engine API with the metadata URI
      const result = await mintGasless({
        to: address,
        metadataUri: ipfsResult.metadataUrl,
      });

      console.log('✅ ENGINE MINT (GASLESS): Mint started successfully:', result);
      setMintStatus('pending');
      setMintSuccess(`Transaction sent! Checking status... Queue ID: ${result.queueId || 'N/A'}`);
      setMintedTokenId(result.queueId || null);
      
    } catch (error: any) {
      console.error('❌ ENGINE MINT (GASLESS): Mint failed:', error)
      setMintError(error instanceof Error ? error.message : 'Engine Mint (Gasless) failed')
      setMintStatus('error');
      
      setTimeout(() => {
        setMintError(null);
        setMintStatus('idle');
      }, 10000)
    } finally {
      setIsMinting(false)
    }
  }

  const handleMintNFT = async () => {
    if (!generatedImageBlob || !selectedTeam || !playerName || !playerNumber) {
      setMintError('Missing required data for minting')
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintSuccess(null)
    setMintStatus('pending');

    try {
      const nftName = `${selectedTeam} ${playerName} #${playerNumber}`
      const nftDescription = `AI-generated ${selectedTeam} jersey for ${playerName} #${playerNumber}. Style: ${selectedStyle}. Generated by AI Sports NFT Generator.`
      
      const attributes = [
        { trait_type: 'Team', value: selectedTeam },
        { trait_type: 'Player Name', value: playerName },
        { trait_type: 'Player Number', value: playerNumber },
        { trait_type: 'Style', value: selectedStyle },
        { trait_type: 'Quality', value: quality },
        { trait_type: 'Generator', value: 'AI Sports NFT' }
      ]

      console.log('🎯 LEGACY: Starting NFT mint process...')

      const imageFile = new File([generatedImageBlob], `${nftName}.png`, { type: 'image/png' });
      
      const result = await mintNFTWithMetadata(
        nftName,
        nftDescription,
        imageFile,
        attributes,
        editionSize
      )

      console.log('✅ Legacy mint successful:', result)
      setMintStatus('success');
      setMintSuccess(`🎉 Legacy mint successful! Transaction: ${result.transactionHash}`)
      setTransactionHash(result.transactionHash || 'N/A')

      // ✅ CRITICAL: Atualizar MongoDB também para LEGACY MINTs
      try {
        console.log('💾 Updating MongoDB with legacy mint success...');
        const updateResponse = await fetch('/api/jerseys/update-mint-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userWallet: address,
            transactionHash: result.transactionHash,
            tokenId: null, // Legacy mint não retorna tokenId imediatamente
            status: 'minted',
            chainId: 80002, // Polygon Amoy
            blockNumber: null
          })
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('✅ MongoDB updated successfully for legacy mint:', updateResult);
          
          // Show success message with explorer link
          setMintSuccess(
            `🎉 Legacy NFT minted successfully! View on explorer: https://amoy.polygonscan.com/tx/${result.transactionHash}`
          );
        } else {
          console.error('❌ Failed to update MongoDB for legacy mint:', await updateResponse.text());
        }
      } catch (dbError) {
        console.error('❌ Error updating database for legacy mint:', dbError);
        // Don't fail the mint, just log the error
      }
      
    } catch (error: any) {
      console.error('❌ Legacy mint failed:', error)
      setMintStatus('error');
      
      if (error?.message?.includes('Please deploy a new NFT Collection contract')) {
        setMintError('❌ Current contract only supports batch URI. Please deploy a new NFT Collection contract with individual tokenURI support.')
      } else {
        setMintError(error instanceof Error ? error.message : 'Minting failed')
      }
      
    } finally {
      setIsMinting(false)
    }
  }

  // ===== MODIFIED GENERATION FUNCTION - DUAL SYSTEM =====
  const generateContent = async () => {
    // ===== ENHANCED DEBUG SYSTEM =====
    console.log('🚀 [GENERATION START] ='.repeat(20))
    console.log('🔍 [GENERATION DEBUG] Initial state check:', {
      timestamp: new Date().toISOString(),
      hasReferenceImage: !!referenceImage,
      hasReferenceImageBlob: !!referenceImageBlob,
      hasAnalysisResult: !!analysisResult,
      analysisResultType: typeof analysisResult,
      analysisResultKeys: analysisResult && typeof analysisResult === 'object' ? Object.keys(analysisResult) : 'not_object',
      selectedSport,
      selectedView,
      playerName,
      playerNumber,
      customPrompt: customPrompt?.substring(0, 100) + '...',
      quality,
      isVisionMode,
      selectedVisionModel
    })
    
    // Enhanced debug for analysis result
    if (analysisResult) {
      console.log('🔍 [ANALYSIS DEBUG] Detailed analysis inspection:', {
        isObject: typeof analysisResult === 'object',
        isString: typeof analysisResult === 'string',
        isNull: analysisResult === null,
        isUndefined: analysisResult === undefined,
        length: typeof analysisResult === 'string' ? analysisResult.length : 'not_string',
        hasColors: analysisResult && typeof analysisResult === 'object' && (analysisResult.dominantColors || analysisResult.dominant_colors),
        firstChars: typeof analysisResult === 'string' ? analysisResult.substring(0, 50) : 'not_string',
        objectKeys: typeof analysisResult === 'object' ? Object.keys(analysisResult) : [],
        stringifiedLength: JSON.stringify(analysisResult).length,
        stringifiedPreview: JSON.stringify(analysisResult).substring(0, 200) + '...'
      })
      
      // Deep analysis of color data
      if (typeof analysisResult === 'object' && analysisResult.dominantColors) {
        console.log('🎨 [COLOR DEBUG] Dominant colors found:', analysisResult.dominantColors)
      }
      if (typeof analysisResult === 'object' && analysisResult.dominant_colors) {
        console.log('🎨 [COLOR DEBUG] Alternative color format found:', analysisResult.dominant_colors)
      }
    } else {
      console.log('❌ [ANALYSIS DEBUG] No analysis result found - this will cause generation issues')
    }

    // 🔒 VALIDAÇÃO DE SEGURANÇA: Wallet obrigatória
    if (!isConnected) {
      setError('🔒 Please connect your wallet to generate jerseys')
      return
    }

    resetError()
    setIsLoading(true)
    setGeneratedImage(null)
    setGeneratedImageBlob(null)
    setIpfsUrl(null)
    setMintSuccess(null)
    setMintError(null)
    setSaveSuccess(null)
    setSaveError(null)

    if (!selectedTeam) {
      setError('Please select a team.')
      setIsLoading(false)
      return
    }

    try {
      console.log('🎯 DUAL SYSTEM: Detecting generation mode...')
      
      // ===== DUAL SYSTEM DETECTION =====
      if (isVisionMode && referenceImageBlob) {
        console.log('👁️ [VISION GENERATION] Using complete vision-test flow...')
        
        // **ANÁLISE AUTOMÁTICA TRANSPARENTE** - Sempre analisar se não há resultado
        if (!analysisResult) {
          console.log('🔍 [VISION ANALYSIS] Starting automatic reference image analysis...')
          
          // Análise automática usando a mesma função, mas sem UI separada
          try {
            setIsAnalyzing(true) // Para mostrar feedback visual
            
            // Convert blob to base64
            const reader = new FileReader()
            const imageBase64 = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(referenceImageBlob)
            }) as string

            // Get analysis prompt from API
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

            if (!analysisPromptResponse.ok) {
              throw new Error(`Failed to get analysis prompt: ${analysisPromptResponse.status}`)
            }

            const analysisPromptData = await analysisPromptResponse.json()
            if (!analysisPromptData.success) {
              throw new Error(analysisPromptData.error || 'Failed to get analysis prompt')
            }

            const structuredPrompt = analysisPromptData.prompt || analysisPromptData.analysis_prompt
            console.log('✅ [VISION ANALYSIS] Got structured analysis prompt')
            console.log('🔍 [DEBUG] Analysis prompt data:', {
              hasPrompt: !!analysisPromptData.prompt,
              hasAnalysisPrompt: !!analysisPromptData.analysis_prompt,
              promptLength: structuredPrompt?.length || 0,
              allKeys: Object.keys(analysisPromptData)
            })

            if (!structuredPrompt) {
              throw new Error('No analysis prompt received from API')
            }

            // Send to Vision API (usar endpoint interno do Next.js)
            const visionAnalysisUrl = '/api/vision-test'
            
            console.log('🌐 [VISION ANALYSIS] Making request to:', visionAnalysisUrl)
            console.log('🔑 [VISION ANALYSIS] Environment check:', {
              hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
              nodeEnv: process.env.NODE_ENV,
              model: selectedVisionModel
            })
            
            const analysisPayload = {
              image_base64: imageBase64.split(',')[1], // Remove data:image prefix
              prompt: structuredPrompt,
              model: selectedVisionModel,
              type: 'vision-analysis'
            }
            
            console.log('📤 [VISION ANALYSIS] Payload:', {
              hasImage: !!analysisPayload.image_base64,
              imageSize: analysisPayload.image_base64?.length || 0,
              promptSize: analysisPayload.prompt?.length || 0,
              model: analysisPayload.model,
              type: analysisPayload.type
            })

            const visionResponse = await fetch(visionAnalysisUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(analysisPayload),
            })

            console.log('📥 [VISION ANALYSIS] Response status:', visionResponse.status)

            if (!visionResponse.ok) {
              const errorText = await visionResponse.text()
              console.error('❌ [VISION ANALYSIS] Error response:', errorText)
              throw new Error(`Vision analysis failed: ${visionResponse.status} - ${errorText}`)
            }

            const analysisData = await visionResponse.json()
            console.log('🔍 [VISION ANALYSIS] Full result:', {
              success: analysisData.success,
              hasAnalysis: !!analysisData.analysis,
              analysisLength: analysisData.analysis?.length || 0,
              analysisPreview: analysisData.analysis?.substring(0, 100) + '...',
              modelUsed: analysisData.model_used,
              isFallback: analysisData.model_used?.includes('fallback')
            })
            
            if (!analysisData.success) {
              throw new Error(analysisData.error || 'Vision analysis failed')
            }

            // Use analysis result directly as text (bullet points format like vision-test)
            let finalResult = analysisData.analysis
            
            console.log('🔍 [VISION ANALYSIS] Using bullet-point analysis format:', {
              hasAnalysis: !!analysisData.analysis,
              analysisType: typeof analysisData.analysis,
              analysisLength: analysisData.analysis?.length || 0,
              analysisPreview: analysisData.analysis?.substring(0, 200) + '...',
              usingBulletPoints: true
            })

            setAnalysisResult(finalResult)
            
            // CRITICAL FIX: Store in sessionStorage immediately for recovery
            if (finalResult) {
              try {
                sessionStorage.setItem('chz_vision_analysis', JSON.stringify({
                  analysis: finalResult,
                  timestamp: Date.now(),
                  sport: selectedSport,
                  view: selectedView
                }))
                console.log('💾 [ANALYSIS BACKUP] Stored analysis in sessionStorage as backup')
              } catch (storageError) {
                console.warn('⚠️ [ANALYSIS BACKUP] Failed to store in sessionStorage:', storageError)
              }
            }
            
            console.log('✅ [VISION ANALYSIS] Analysis completed successfully')
            console.log('🔍 [VISION ANALYSIS] Final result stored:', {
              type: typeof finalResult,
              isObject: typeof finalResult === 'object',
              hasData: !!finalResult,
              preview: typeof finalResult === 'object' ? JSON.stringify(finalResult).substring(0, 100) + '...' : String(finalResult).substring(0, 100) + '...'
            })
            
          } catch (analysisError: any) {
            console.error('❌ [VISION ANALYSIS] Failed:', analysisError)
            throw new Error(`Failed to analyze reference image: ${analysisError.message}`)
          } finally {
            setIsAnalyzing(false)
          }
        }

        // STEP 1: Get BASE PROMPT from our new API
        console.log('📋 [VISION GENERATION] Step 1: Getting base generation prompt...')
        const basePromptResponse = await fetch('/api/vision-prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sport: selectedSport,
            view: selectedView,
            playerName: playerName || "",
            playerNumber: playerNumber || "",
            style: selectedStyle || "classic",
            qualityLevel: "advanced" // Use advanced quality for vision mode
          }),
        })

        if (!basePromptResponse.ok) {
          throw new Error(`Failed to get base prompt: ${basePromptResponse.status}`)
        }

        const basePromptData = await basePromptResponse.json()
        
        if (!basePromptData.success) {
          throw new Error(basePromptData.error || 'Failed to get base prompt')
        }

        const basePrompt = basePromptData.prompt
        console.log('✅ [VISION GENERATION] Got base prompt:', {
          sport: selectedSport,
          view: selectedView,
          style: selectedStyle,
          hasPlayerData: !!(playerName && playerNumber),
          promptLength: basePrompt.length,
          qualityEnhanced: true
        })

        // STEP 2: Combine BASE PROMPT + ANALYSIS + Quality enhancers (exactly like vision-test)
        // ===== CRITICAL: PRESERVE ANALYSIS RESULT =====
        console.log('🔍 [ANALYSIS PRESERVATION] Current analysisResult state:', {
          hasAnalysisResult: !!analysisResult,
          analysisResultType: typeof analysisResult,
          analysisResultKeys: analysisResult && typeof analysisResult === 'object' ? Object.keys(analysisResult) : 'not_object',
          analysisResultPreview: typeof analysisResult === 'object' 
            ? JSON.stringify(analysisResult).substring(0, 200) + '...'
            : String(analysisResult).substring(0, 200) + '...'
        })

        // ===== CRITICAL FIX: RECOVERY STRATEGY FOR LOST ANALYSIS =====
        let currentAnalysis = analysisResult
        
        // If analysis is lost, try to recover from sessionStorage first
        if (!currentAnalysis || currentAnalysis === null || (typeof currentAnalysis === 'object' && Object.keys(currentAnalysis).length === 0)) {
          console.log('⚠️ [ANALYSIS LOST] Analysis result was lost, attempting recovery...')
          
          // Step 1: Try to recover from sessionStorage
          try {
            const backupData = sessionStorage.getItem('chz_vision_analysis')
            if (backupData) {
              const backup = JSON.parse(backupData)
              // Check if backup is recent (within 1 hour) and matches current sport/view
              const isRecentBackup = (Date.now() - backup.timestamp) < 3600000 // 1 hour
              const isMatchingContext = backup.sport === selectedSport && backup.view === selectedView
              
              if (isRecentBackup && isMatchingContext && backup.analysis) {
                currentAnalysis = backup.analysis
                setAnalysisResult(currentAnalysis) // Restore to state
                console.log('✅ [ANALYSIS RECOVERY] Successfully recovered from sessionStorage:', {
                  analysisType: typeof currentAnalysis,
                  analysisKeys: currentAnalysis && typeof currentAnalysis === 'object' ? Object.keys(currentAnalysis) : 'not_object',
                  backupAge: Math.round((Date.now() - backup.timestamp) / 1000 / 60) + ' minutes'
                })
              } else {
                console.log('⚠️ [ANALYSIS RECOVERY] Backup found but expired or mismatched context')
              }
            }
          } catch (recoveryError) {
            console.warn('⚠️ [ANALYSIS RECOVERY] Failed to recover from sessionStorage:', recoveryError)
          }
          
          // Step 2: If still no analysis, force re-analysis
          if (!currentAnalysis || currentAnalysis === null) {
            console.log('🔄 [FORCE RE-ANALYSIS] Starting emergency analysis...')
            
            try {
              await analyzeReferenceImage()
              // CRITICAL FIX: Wait for state update and get fresh analysis
              await new Promise(resolve => setTimeout(resolve, 100)) // Allow state to update
              currentAnalysis = analysisResult // Get the fresh analysis
              console.log('✅ [FORCE RE-ANALYSIS] Emergency analysis completed:', {
                hasNewAnalysis: !!currentAnalysis,
                analysisType: typeof currentAnalysis,
                analysisKeys: currentAnalysis && typeof currentAnalysis === 'object' ? Object.keys(currentAnalysis) : 'not_object',
                analysisPreview: typeof currentAnalysis === 'string' ? currentAnalysis.substring(0, 100) + '...' : 'not_string'
              })
              
              // ADDITIONAL FIX: If still null, try sessionStorage recovery
              if (!currentAnalysis) {
                console.log('🔄 [FORCE RE-ANALYSIS] Still no analysis, trying sessionStorage again...')
                try {
                  const backupData = sessionStorage.getItem('chz_vision_analysis')
                  if (backupData) {
                    const backup = JSON.parse(backupData)
                    if (backup.analysis) {
                      currentAnalysis = backup.analysis
                      console.log('✅ [FORCE RE-ANALYSIS] Recovered from sessionStorage:', {
                        analysisType: typeof currentAnalysis,
                        analysisLength: typeof currentAnalysis === 'string' ? currentAnalysis.length : 'not_string'
                      })
                    }
                  }
                } catch (storageError) {
                  console.warn('⚠️ [FORCE RE-ANALYSIS] SessionStorage recovery failed:', storageError)
                }
              }
            } catch (reAnalysisError) {
              console.error('❌ [FORCE RE-ANALYSIS] Failed:', reAnalysisError)
              // Continue with empty analysis
              currentAnalysis = null
            }
          }
        }
        
        // Simple analysis text (same as vision-test)
        const analysisText = String(currentAnalysis || 'No analysis available')

        console.log('🔍 [VISION GENERATION] Using simple bullet-point analysis:', {
          hasAnalysis: !!currentAnalysis,
          analysisLength: analysisText.length,
          analysisPreview: analysisText.substring(0, 200) + '...',
          usingSimpleFlow: true
        })

        // Simple prompt generation (same as vision-test)
        const playerInfo = (playerName || playerNumber) 
          ? `Player name "${playerName || 'PLAYER'}" number "${playerNumber || '00'}" ` 
          : ''
        
        const simplePrompt = `A professional ${selectedSport} jersey ${selectedView} view, centered composition. ${playerInfo}Clean background, high-resolution quality, professional lighting.

Design based on analysis: ${analysisText}`

        console.log('✅ [VISION GENERATION] Simple prompt created:', {
          promptLength: simplePrompt.length,
          hasPlayerInfo: !!(playerName || playerNumber),
          sport: selectedSport,
          view: selectedView
        })

        // STEP 3: Generate image using vision-generate API (same as vision-test)
        console.log('🖼️ [VISION GENERATION] Step 3: Generating image with DALL-E 3...')
        const visionGenerateResponse = await fetch('/api/vision-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: simplePrompt,
            quality: quality
          }),
        })

        if (!visionGenerateResponse.ok) {
          throw new Error(`Vision generation failed: ${visionGenerateResponse.status}`)
        }

        const visionResult = await visionGenerateResponse.json()
        
        if (!visionResult.success) {
          throw new Error(visionResult.error || 'Vision image generation failed')
        }

        console.log('✅ [VISION GENERATION] Image generated successfully:', {
          cost: visionResult.cost_usd,
          hasImageUrl: !!visionResult.image_url,
          hasImageBase64: !!visionResult.image_base64
        })

        // Handle base64 response from vision-generate API (CORS-safe)
        let finalBlob: Blob | null = null
        
        if (visionResult.image_base64) {
          console.log('✅ [VISION GENERATION] Using base64 image from API')
          
          const imageDataUrl = `data:image/png;base64,${visionResult.image_base64}`
          setGeneratedImage(imageDataUrl)
          
          // Convert base64 to blob for saving - GARANTIR QUE FUNCIONE
          try {
            // Method 1: Try fetch conversion
            console.log('🔄 [VISION GENERATION] Converting base64 to blob...')
            const response = await fetch(imageDataUrl)
        const blob = await response.blob()
            
            // Validate blob
            if (!blob || blob.size === 0) {
              throw new Error('Blob creation failed - empty blob')
            }
            
            // Store in both local variable AND state
            finalBlob = blob
            setGeneratedImageBlob(blob)
            
            console.log('✅ [VISION GENERATION] Image blob created successfully:', {
              size: blob.size,
              type: blob.type,
              hasBlob: !!blob
            })
            
          } catch (blobError: any) {
            console.error('❌ [VISION GENERATION] Fetch method failed, trying manual conversion:', blobError)
            
            // Method 2: Manual base64 to blob conversion
            try {
              const byteCharacters = atob(visionResult.image_base64)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const manualBlob = new Blob([byteArray], { type: 'image/png' })
              
              if (!manualBlob || manualBlob.size === 0) {
                throw new Error('Manual blob creation also failed')
              }
              
              // Store in both local variable AND state
              finalBlob = manualBlob
              setGeneratedImageBlob(manualBlob)
              
              console.log('✅ [VISION GENERATION] Manual blob creation successful:', {
                size: manualBlob.size,
                type: manualBlob.type
              })
            } catch (manualError: any) {
              console.error('❌ [VISION GENERATION] Both blob creation methods failed:', manualError)
              throw new Error(`Failed to create image blob: ${blobError.message} | ${manualError.message}`)
            }
          }
          
        } else if (visionResult.image_url) {
          // Fallback: try direct URL (may have CORS issues)
          console.log('⚠️ [VISION GENERATION] Fallback to direct URL download...')
          
          try {
            const imageResponse = await fetch(visionResult.image_url)
            if (!imageResponse.ok) {
              throw new Error(`Failed to download image: ${imageResponse.status}`)
            }
            
            const blob = await imageResponse.blob()
            setGeneratedImageBlob(blob)
            
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            
            setGeneratedImage(base64)
          } catch (urlError: any) {
            throw new Error(`CORS error downloading image: ${urlError.message}`)
          }
          
        } else {
          throw new Error('No image data received from vision generation API')
        }

        // ✅ Save to DB with complete vision metadata
        console.log('🔍 [SAVE] Final blob check before saving:', {
          hasLocalBlob: !!finalBlob,
          localBlobSize: finalBlob?.size,
          localBlobType: finalBlob?.type,
          hasStateBlob: !!generatedImageBlob,
          stateBlobSize: generatedImageBlob?.size
        });
        
        if (finalBlob && finalBlob.size > 0) {
          console.log('✅ [SAVE] Proceeding with database save using local blob...')
        await saveJerseyToDB({
          name: `${selectedTeam} ${playerName} #${playerNumber} (Vision)`,
          prompt: simplePrompt,
            imageUrl: generatedImage, // Use the converted base64 or original URL
          creatorWallet: address || "N/A",
          tags: [selectedTeam, selectedStyle, 'vision-generated', selectedSport, selectedView],
          metadata: {
            generationMode: 'vision_enhanced',
            hasReferenceImage: true,
            analysisUsed: !!analysisResult,
            sport: selectedSport,
            view: selectedView,
            visionModel: selectedVisionModel,
            qualityLevel: 'advanced',
              costUsd: visionResult.cost_usd,
              dalleImageUrl: visionResult.image_url // Keep original URL for reference
            }
          }, finalBlob);
        } else {
          console.error('❌ [SAVE] Cannot save to DB: no valid blob available');
          console.log('🔍 [SAVE] Debug info:', {
            generatedImage: !!generatedImage,
            generatedImageLength: generatedImage?.length,
            visionResultHasBase64: !!visionResult.image_base64,
            visionResultBase64Length: visionResult.image_base64?.length,
            finalBlobExists: !!finalBlob,
            finalBlobSize: finalBlob?.size
          });
          throw new Error('Image generated but blob creation failed - cannot save to database');
        }

        console.log('🎉 [VISION GENERATION] Complete vision-test flow completed successfully!')
        
      } else {
        // ==================================================================
        // AQUI ESTÁ A MUDANÇA: USAR A NOVA API DE REFERÊNCIA
        // ==================================================================
        console.log('✅ [STANDARD FLOW] Starting standard generation using an existing team reference...');
        
        const requestBody = {
          teamName: selectedTeam,
          player_name: playerName,
          player_number: playerNumber,
          quality: quality,
          // Corrigido: sport deve ser 'jersey' para o backend aceitar
          sport: 'jersey',
          view: 'back'
        };

        const response = await fetch('/api/generate-from-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        // Leia o corpo da resposta APENAS UMA VEZ.
        const data = await response.json();

        // Agora verifique se a resposta está OK e se os dados são de sucesso.
        if (!response.ok || !data.success) {
          const errorMessage = data.detail || data.error || 'An unknown error occurred.';
          console.error('❌ Generation Error from backend:', errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log('[STANDARD FLOW] Base64 image data received.');
          
        // ADICIONADO: Validação robusta e limpeza do dado base64
        if (typeof data.image_base64 !== 'string' || data.image_base64.trim() === '') {
          console.error('❌ [DATA VALIDATION] `image_base64` is not a valid string or is empty.', { received: data.image_base64 });
          console.log('🔬 [DATA VALIDATION] Full response object for debugging:', data);
          throw new Error('Invalid image data received from server. Generation failed.');
        }

        // LIMPEZA: Remover qualquer prefixo de data URL que possa ter sido adicionado por engano
        const pureBase64 = data.image_base64.split(',').pop();

        if (!pureBase64) { // Checagem extra de segurança
          throw new Error('Base64 data is empty after trying to clean it.');
        }

        // Set image for display using data URL
        console.log('🖼️ Setting generatedImage with base64 data');
        setGeneratedImage(`data:image/png;base64,${pureBase64}`);

        // Convert base64 back to Blob for IPFS/saving functionality
        const byteCharacters = atob(pureBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: 'image/png' });

        setGeneratedImageBlob(imageBlob);
        setIpfsUrl(null); // Clear any old IPFS URL

      }
    } catch (err: any) {
      console.error('❌ Generation Error:', err)
      setError(err.message || 'An unknown error occurred during generation.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveJerseyToDB = async (jerseyData: any, imageBlob: Blob) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      console.log('💾 Saving jersey to database...');
      
      // 1. Primeiro, fazer upload da imagem para Cloudinary via nossa API
      console.log('📤 Uploading image to Cloudinary...');
      if (!imageBlob) {
        throw new Error('No image blob available for upload');
      }

      const formData = new FormData();
      formData.append('file', imageBlob, `${jerseyData.name}.png`);
      formData.append('fileName', `${selectedTeam}_${playerName}_${playerNumber}_${Date.now()}`);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Image uploaded to Cloudinary:', uploadResult.url);

      // 2. Agora salvar no banco com a URL do Cloudinary (não o base64)
      const jerseyDataWithCloudinaryUrl = {
        ...jerseyData,
        imageUrl: uploadResult.url, // URL do Cloudinary
        cloudinaryPublicId: uploadResult.publicId, // Para deletar depois se necessário
      };

      const response = await fetch('/api/jerseys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jerseyDataWithCloudinaryUrl),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save jersey to database');
      }

      const result = await response.json();
      console.log('✅ Jersey saved to DB:', result);
      setSaveSuccess(`Jersey saved successfully! DB ID: ${result.jerseyId}`);
    } catch (error: any) {
      console.error('❌ Error saving jersey to DB:', error);
      setSaveError(`Image generated, but failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetError = () => {
    setError(null);
    setSaveError(null);
  }

  // ✅ Monitor transaction status and update database when minted
  useEffect(() => {
    if (mintStatus === 'pending' && mintedTokenId) {
      const interval = setInterval(async () => {
        console.log(`🔎 Checking status for queueId: ${mintedTokenId}`);
        const statusResult = await getTransactionStatus(mintedTokenId);
        
        if (statusResult.result) {
          const { status, transactionHash: finalTxHash, errorMessage, blockNumber, tokenId } = statusResult.result;
          console.log('🔍 Engine status:', status);

          if (status === 'mined') {
            setMintStatus('success');
            setMintSuccess('NFT successfully created on blockchain!');
            setTransactionHash(finalTxHash);
            clearInterval(interval);

            // ✅ CRITICAL: Update MongoDB with transaction hash
            try {
              console.log('💾 Updating MongoDB with mint success...');
              const updateResponse = await fetch('/api/jerseys/update-mint-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userWallet: address,
                  transactionHash: finalTxHash,
                  tokenId: tokenId || null,
                  queueId: mintedTokenId,
                  status: 'minted',
                  chainId: 80002, // Polygon Amoy
                  blockNumber: blockNumber || null
                })
              });

              if (updateResponse.ok) {
                const updateResult = await updateResponse.json();
                console.log('✅ MongoDB updated successfully:', updateResult);
                
                // Show success message with explorer link
                setMintSuccess(
                  `🎉 NFT minted successfully! View on explorer: https://amoy.polygonscan.com/tx/${finalTxHash}`
                );
              } else {
                console.error('❌ Failed to update MongoDB:', await updateResponse.text());
              }
            } catch (dbError) {
              console.error('❌ Error updating database:', dbError);
              // Don't fail the mint, just log the error
            }

          } else if (status === 'errored' || status === 'cancelled') {
            setMintStatus('error');
            setMintError(`Transaction failed: ${errorMessage || 'Unknown error'}`);
            clearInterval(interval);
          }
        } else if (statusResult.error) {
          setMintStatus('error');
          setMintError(`Error checking status: ${statusResult.error}`);
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [mintStatus, mintedTokenId, getTransactionStatus, address]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        // CORREÇÃO: Chamar a nova API de referências do banco de dados
        console.log('🔄 Loading teams from new reference API...');
        const response = await fetch('/api/admin/jerseys/references');
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`);
        }
        const data = await response.json();

        // A API retorna { success: true, data: [...] }
        // Extrair apenas os nomes dos times do array 'data'
        if (data.success && Array.isArray(data.data)) {
          const teamNames = data.data.map((team: any) => team.teamName);
          console.log(`✅ Loaded ${teamNames.length} teams from DB references.`);
          setAvailableTeams(teamNames);
          if (teamNames.length > 0) {
            setSelectedTeam(teamNames[0]);
          }
        } else {
           throw new Error('Invalid data structure from teams API.');
        }
      } catch (err: any) {
        console.error('❌ Error loading teams from new API:', err);
        // Manter o fallback em caso de erro na API
        const defaultTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo'];
        setAvailableTeams(defaultTeams);
        setSelectedTeam(defaultTeams[0]);
      }
    };

    loadTeams();
  }, []);

  useEffect(() => {
    const loadTopCollectionsData = async () => {
      setMarketplaceLoading(true);
      
      // FALLBACK INSTANTÂNEO - Garantir MÍNIMO 3 NFTs sempre
      const fallbackData = [
        { name: 'Jersey Collection #1', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png', description: 'AI-generated jersey', price: '0.05 CHZ' },
        { name: 'Jersey Collection #2', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png', description: 'AI-generated jersey', price: '0.05 CHZ' },
        { name: 'Camp Nou Stadium', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751638622/jerseys/stadium_camp_nou_realistic_1751638577656.png', description: 'AI-generated stadium', price: '0.15 CHZ' },
        { name: 'Premium Jersey #3', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png', description: 'Limited edition jersey', price: '0.08 CHZ' },
        { name: 'Classic Stadium', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751638622/jerseys/stadium_camp_nou_realistic_1751638577656.png', description: 'Classic stadium design', price: '0.12 CHZ' },
        { name: 'Rare Jersey #4', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png', description: 'Rare collection item', price: '0.10 CHZ' }
      ];
      setMarketplaceNFTs(fallbackData);
      setMarketplaceLoading(false);

      try {
        console.log('🔄 Loading top collections data for jersey editor...');
        
        // Buscar dados reais das 3 APIs em paralelo
        const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
          fetch('/api/jerseys'),
          fetch('/api/stadiums'),
          fetch('/api/badges')
        ]);

        // Verificar se todas as respostas foram bem-sucedidas
        if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
          throw new Error(`API Error: Jerseys(${jerseysResponse.status}), Stadiums(${stadiumsResponse.status}), Badges(${badgesResponse.status})`);
        }

        // Processar dados reais
        const jerseys = await jerseysResponse.json();
        const stadiums = await stadiumsResponse.json();
        const badges = await badgesResponse.json();

        console.log('📊 Raw API data:', { jerseys: jerseys.length, stadiums: stadiums.length, badges: badges.length });

        // Implementar lógica de "Top Collections"
        const topCollections = [];

        // Top 3 Jerseys mais recentes
        const topJerseys = jerseys
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map((jersey: any) => ({
            name: jersey.name,
            imageUrl: jersey.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: jersey.description || 'AI-generated jersey',
            price: '0.05 CHZ',
            category: 'jersey',
            createdAt: jersey.createdAt
          }));

        // Top 2 Stadiums mais recentes
        const topStadiums = stadiums
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map((stadium: any) => ({
            name: stadium.name,
            imageUrl: stadium.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: stadium.description || 'AI-generated stadium',
            price: '0.15 CHZ',
            category: 'stadium',
            createdAt: stadium.createdAt
          }));

        // Top 1 Badge mais recente
        const topBadges = badges
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1)
          .map((badge: any) => ({
            name: badge.name,
            imageUrl: badge.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: badge.description || 'AI-generated badge',
            price: '0.03 CHZ',
            category: 'badge',
            createdAt: badge.createdAt
          }));

        // Combinar e ordenar por data de criação (mais recentes primeiro)
        let allTopCollections = [...topJerseys, ...topStadiums, ...topBadges]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6); // Limitar a 6 itens no carrossel

        // GARANTIR MÍNIMO 3 NFTs - Se temos menos que 3, completar com fallback
        if (allTopCollections.length < 3) {
          console.log(`⚠️ Only ${allTopCollections.length} real NFTs found, padding with fallback data`);
          const needed = 3 - allTopCollections.length;
          const fallbackToAdd = fallbackData.slice(0, needed);
          allTopCollections = [...allTopCollections, ...fallbackToAdd];
        }

        console.log('✅ Top Collections compiled (min 3 guaranteed):', allTopCollections);
          setMarketplaceNFTs(allTopCollections);
        // Sempre atualiza, pois agora garantimos mínimo 3

      } catch (error) {
        console.error('❌ Error loading top collections data:', error);
        console.log('🔄 Keeping fallback NFT data due to API error');
        // Mantém fallback com suas imagens reais
      }
    };

    loadTopCollectionsData();
  }, []);

  return (
    <ProfessionalEditorLayout
      sidebar={
        <ProfessionalSidebar
          availableTeams={availableTeams}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerNumber={playerNumber}
          setPlayerNumber={setPlayerNumber}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          quality={quality}
          setQuality={setQuality}
          isVisionMode={isVisionMode}
          referenceImage={referenceImage}
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          onFileUpload={handleFileUpload}
          onClearReference={clearReferenceImage}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          generationCost={generationCost}
          error={error}
          onResetError={resetError}
        />
      }
      canvas={
        <ProfessionalCanvas
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onResetError={resetError}
          playerName={playerName}
          playerNumber={playerNumber}
          selectedTeam={selectedTeam}
          selectedStyle={selectedStyle}
          quality={quality}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
        />
      }
      actionBar={
        <ProfessionalActionBar
          onGenerate={generateContent}
          isLoading={isLoading}
          canGenerate={!!(isConnected && ((selectedTeam && playerName && playerNumber) || isVisionMode))}
          generationCost={generationCost}
          onMintLegacy={handleMintNFT}
          onMintGasless={handleEngineNormalMint}
          canMintLegacy={Boolean(canMintLegacy)}
          canMintGasless={!!canMintGasless}
          isMinting={isMinting}
          mintStatus={mintStatus}
          mintSuccess={mintSuccess}
          mintError={mintError}
          transactionHash={transactionHash}
          isConnected={isConnected}
          isOnSupportedChain={isOnSupportedChain}
          isUserAdmin={isUserAdmin}
          nftName={selectedTeam && playerName && playerNumber ? `${selectedTeam} ${playerName} #${playerNumber}` : undefined}
          metadataUri={ipfsUrl || undefined}
          walletAddress={address || undefined}
          collection="jerseys"
          hasGeneratedImage={!!generatedImage}
          getTransactionUrl={getTransactionUrl}
        />
      }
      marketplace={
        <ProfessionalMarketplace
          items={marketplaceNFTs}
          isLoading={marketplaceLoading}
          onItemClick={(item) => {
            console.log('Clicked marketplace item:', item)
            // Implementar navegação para o marketplace ou modal de detalhes
          }}
          onViewAll={() => {
            console.log('View all marketplace items')
            // Navegação interna sem nova aba
            router.push('/marketplace')
          }}
          title="Trending NFTs"
          showSearch={false}
          showFilters={false}
          maxItems={6}
        />
      }
    />
  )
} 