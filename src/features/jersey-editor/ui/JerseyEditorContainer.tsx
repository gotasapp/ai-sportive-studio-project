// ================================================
// JerseyEditorContainer
// Maintains original functionality with refactored structure available
// ================================================

import React, { useState, useEffect, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check, Eye, FileImage, X } from 'lucide-react'
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

import { Dalle3Service } from '../../../lib/services/dalle3-service'
import { IPFSService } from '../../../lib/services/ipfs-service'
import { useWeb3 } from '../../../lib/useWeb3'
import { useEngine } from '../../../lib/useEngine'
import { ImageGenerationRequest } from '../../../types'
import { getTransactionUrl } from '../../../lib/utils'
import { Button } from '@/components/ui/button'
import { isAdmin } from '../../../lib/admin-config'

import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalSidebar from '@/components/editor/ProfessionalSidebar'
import ProfessionalCanvas from '@/components/editor/ProfessionalCanvas'
import ProfessionalActionBar from '@/components/editor/ProfessionalActionBar'

// Constantes do arquivo original
const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

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

export function JerseyEditorContainer() {
  const router = useRouter()
  const { toast } = useToast()
  
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
  const [playerName, setPlayerName] = useState<string>('')
  const [playerNumber, setPlayerNumber] = useState<string>('')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
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
  
  // Save to DB state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const canMintGasless = generatedImage // Engine works without wallet

  // Monitor transaction status and update database when minted
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

            // Update MongoDB with transaction hash
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

  // Load teams on component mount
  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/admin/jerseys/references')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        const teamNames = data.data.map((team: any) => team.teamName)
        setAvailableTeams(teamNames)
        
        // Set the first team as default if none selected
        if (!selectedTeam && teamNames.length > 0) {
          setSelectedTeam(teamNames[0])
        }
      } else {
        // Fallback to hardcoded teams
        const fallbackTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo']
        setAvailableTeams(fallbackTeams)
        if (!selectedTeam) setSelectedTeam(fallbackTeams[0])
      }
    } catch (error) {
      console.error('Error loading teams:', error)
      // Fallback to hardcoded teams
      const fallbackTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo']
      setAvailableTeams(fallbackTeams)
      if (!selectedTeam) setSelectedTeam(fallbackTeams[0])
    }
  }

  // Functions from original file
  const generateContent = async () => {
    // 🔒 SECURITY VALIDATION: Wallet required - Show toast
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Connect your wallet to start generating NFTs"
      })
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
        
        // **TRANSPARENT AUTOMATIC ANALYSIS** - Always analyze if no result
        if (!analysisResult) {
          console.log('🔍 [VISION ANALYSIS] Starting automatic reference image analysis...')
          
          // Automatic analysis using the same function, but without separate UI
          try {
            setIsAnalyzing(true) // To show visual feedback
            
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

            if (!structuredPrompt) {
              throw new Error('No analysis prompt received from API')
            }

            // Send to Vision API (usar endpoint interno do Next.js)
            const visionAnalysisUrl = '/api/vision-test'
            
            const analysisPayload = {
              image_base64: imageBase64.split(',')[1], // Remove data:image prefix
              prompt: structuredPrompt,
              model: selectedVisionModel,
              type: 'vision-analysis'
            }

            const visionResponse = await fetch(visionAnalysisUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(analysisPayload),
            })

            if (!visionResponse.ok) {
              const errorText = await visionResponse.text()
              throw new Error(`Vision analysis failed: ${visionResponse.status} - ${errorText}`)
            }

            const analysisData = await visionResponse.json()
            
            if (!analysisData.success) {
              throw new Error(analysisData.error || 'Vision analysis failed')
            }

            // Use analysis result directly as text (bullet points format like vision-test)
            let finalResult = analysisData.analysis
            setAnalysisResult(finalResult)
            
          } catch (analysisError: any) {
            console.error('❌ [VISION ANALYSIS] Failed:', analysisError)
            throw new Error(`Failed to analyze reference image: ${analysisError.message}`)
          } finally {
            setIsAnalyzing(false)
          }
        }

        // Vision generation flow continues...
        const analysisText = String(analysisResult || 'No analysis available')

        // Simple prompt generation
        const playerInfo = (playerName || playerNumber) 
          ? `Player name "${playerName || 'PLAYER'}" number "${playerNumber || '00'}" ` 
          : ''
        
        const simplePrompt = `A professional ${selectedSport} jersey ${selectedView} view, centered composition. ${playerInfo}Clean background, high-resolution quality, professional lighting.

Design based on analysis: ${analysisText}`

        // Generate image using vision-generate API
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

        // Handle base64 response from vision-generate API
        let finalBlob: Blob | null = null
        
        if (visionResult.image_base64) {
          const imageDataUrl = `data:image/png;base64,${visionResult.image_base64}`
          setGeneratedImage(imageDataUrl)
          
          // Convert base64 to blob for saving
          try {
            const response = await fetch(imageDataUrl)
            const blob = await response.blob()
            
            if (!blob || blob.size === 0) {
              throw new Error('Blob creation failed - empty blob')
            }
            
            finalBlob = blob
            setGeneratedImageBlob(blob)
            
          } catch (blobError: any) {
            // Manual base64 to blob conversion
            const byteCharacters = atob(visionResult.image_base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const manualBlob = new Blob([byteArray], { type: 'image/png' })
            
            finalBlob = manualBlob
            setGeneratedImageBlob(manualBlob)
          }
        }

        // Save to DB with vision metadata
        if (finalBlob && finalBlob.size > 0) {
          await saveJerseyToDB({
            name: `${selectedTeam} ${playerName} #${playerNumber} (Vision)`,
            prompt: simplePrompt,
            imageUrl: generatedImage,
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
              dalleImageUrl: visionResult.image_url
            }
          }, finalBlob);
        }
        
      } else {
        // Standard generation using team reference
        console.log('✅ [STANDARD FLOW] Starting standard generation using an existing team reference...');
        
        const requestBody = {
          teamName: selectedTeam,
          player_name: playerName,
          player_number: playerNumber,
          quality: quality,
          sport: 'jersey',
          view: 'back'
        };

        const response = await fetch('/api/generate-from-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = data.detail || data.error || 'An unknown error occurred.';
          throw new Error(errorMessage);
        }
        
        // Validate base64 data
        if (typeof data.image_base64 !== 'string' || data.image_base64.trim() === '') {
          throw new Error('Invalid image data received from server. Generation failed.');
        }

        // Clean base64 data
        const pureBase64 = data.image_base64.split(',').pop();

        if (!pureBase64) {
          throw new Error('Base64 data is empty after trying to clean it.');
        }

        // Set image for display
        setGeneratedImage(`data:image/png;base64,${pureBase64}`);

        // Convert base64 to Blob
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
      
      // 1. Upload image to Cloudinary
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

      // 2. Save to database with Cloudinary URL
      const jerseyDataWithCloudinaryUrl = {
        ...jerseyData,
        imageUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.publicId,
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

      // Update MongoDB for legacy mints
      try {
        console.log('💾 Updating MongoDB with legacy mint success...');
        const updateResponse = await fetch('/api/jerseys/update-mint-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userWallet: address,
            transactionHash: result.transactionHash,
            tokenId: null,
            status: 'minted',
            chainId: 80002,
            blockNumber: null
          })
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('✅ MongoDB updated successfully for legacy mint:', updateResult);
        } else {
          console.error('❌ Failed to update MongoDB:', await updateResponse.text());
        }
      } catch (dbError) {
        console.error('❌ Error updating database:', dbError);
      }

    } catch (error: any) {
      console.error('❌ LEGACY MINT: Mint failed:', error)
      setMintError(error instanceof Error ? error.message : 'Legacy mint failed')
      setMintStatus('error');
      
      setTimeout(() => {
        setMintError(null);
        setMintStatus('idle');
      }, 10000)
    } finally {
      setIsMinting(false)
    }
  }

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
        chainId: chainId || 80002,
      });

      // 3. Update UI with queue ID
      setMintSuccess(`Transaction sent! Queue ID: ${result.queueId}`);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement file upload logic
    console.log('File upload called')
  }

  const clearReferenceImage = () => {
    setReferenceImage(null)
    setReferenceImageBlob(null)
    setAnalysisResult(null)
  }

  const resetError = () => {
    setError(null)
  }

  // Get vision analysis text
  const visionAnalysis = analysisResult ? {
    dominantColors: analysisResult.dominantColors || [],
    patterns: analysisResult.patterns || [],
    logoHints: analysisResult.logoHints || [],
    fabric: analysisResult.fabric || '',
    notes: analysisResult.notes || ''
  } : null

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
          canGenerate={!!((selectedTeam && playerName && playerNumber) || isVisionMode)}
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
          generatedImageBlob={generatedImageBlob || undefined}
          nftDescription={`AI-generated jersey for ${selectedTeam} - ${playerName} #${playerNumber}. ${selectedStyle} style jersey created with advanced AI technology.`}
          nftAttributes={[
            { trait_type: 'Team', value: selectedTeam || 'Unknown' },
            { trait_type: 'Player Name', value: playerName },
            { trait_type: 'Player Number', value: playerNumber },
            { trait_type: 'Style', value: selectedStyle },
            { trait_type: 'Quality', value: quality },
            { trait_type: 'Type', value: 'Jersey' },
            { trait_type: 'Generator', value: 'AI Sports NFT' }
          ]}
          getTransactionUrl={getTransactionUrl}
        />
      }
    />
  )
}
