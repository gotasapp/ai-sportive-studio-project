'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Gamepad2, Globe, Crown, Palette } from 'lucide-react'
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'

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
import ProfessionalBadgeSidebar from '@/components/badge/ProfessionalBadgeSidebar'
import ProfessionalBadgeCanvas from '@/components/badge/ProfessionalBadgeCanvas'
import ProfessionalBadgeActionBar from '@/components/badge/ProfessionalBadgeActionBar'
import ProfessionalMarketplace from '@/components/editor/ProfessionalMarketplace'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

interface MarketplaceNFT {
  name: string;
  imageUrl: string; // CORRIGIDO: sem underscore para ser consistente
  description: string;
  price: string;
}

export default function BadgeEditor() {
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  
  const address = account?.address
  const isConnected = !!account
  const chainId = chain?.id
  
  const { mintNFTWithMetadata, setClaimConditions } = useWeb3()
  const { mintGasless, createNFTMetadata, getTransactionStatus } = useEngine()

  const [badgeName, setBadgeName] = useState<string>('CHAMPION')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editionSize, setEditionSize] = useState<number>(100)
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null)
  
  // Vision System States
  const [isVisionMode, setIsVisionMode] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageBlob, setReferenceImageBlob] = useState<Blob | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedBadgeView, setSelectedBadgeView] = useState<'logo' | 'emblem'>('logo')
  
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
  
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  
  const supportedChainIds = [88888, 88882, 137, 80002]
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  
  const isUserAdmin = isAdmin(account)
  
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage
  const canMintGasless = generatedImage && badgeName && isUserAdmin

  const handleEngineNormalMint = async () => {
    if (!canMintGasless || !generatedImageBlob || !address) {
        setMintError('Missing required data for minting');
        return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintStatus('pending');

    try {
        const nftName = `${badgeName} Badge`;
        const nftDescription = `AI-generated badge. Style: ${selectedStyle}.`;

        const ipfsResult = await IPFSService.uploadComplete(
            generatedImageBlob,
            nftName,
            nftDescription,
            'Custom',
            selectedStyle,
            badgeName,
            ''
        );

        const result = await mintGasless({
            to: address,
            metadataUri: ipfsResult.metadataUrl,
        });

        setMintSuccess(`Transaction sent! Queue ID: ${result.queueId}`);
        setMintedTokenId(result.queueId || null);
    } catch (error: any) {
        setMintError(error.message || 'Engine mint failed');
        setMintStatus('error');
    } finally {
        setIsMinting(false);
    }
  };
  
  useEffect(() => {
    if (mintStatus === 'pending' && mintedTokenId) {
      const interval = setInterval(async () => {
        const statusResult = await getTransactionStatus(mintedTokenId);
        if (statusResult.result?.status === 'mined') {
            setMintStatus('success');
            setMintSuccess('NFT successfully created!');
            setTransactionHash(statusResult.result.transactionHash);
            clearInterval(interval);
        } else if (statusResult.result?.status === 'errored') {
            setMintStatus('error');
            setMintError(`Transaction failed: ${statusResult.result.errorMessage}`);
            clearInterval(interval);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mintStatus, mintedTokenId, getTransactionStatus]);

  const handleMintNFT = async () => {
    if (!canMintLegacy || !generatedImageBlob) {
      setMintError('Missing required data for minting');
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintStatus('pending');

    try {
        const nftName = `${badgeName} Badge`;
        const nftDescription = `AI-generated badge. Style: ${selectedStyle}.`;
        const imageFile = new File([generatedImageBlob], `${nftName}.png`, { type: 'image/png' });
        const attributes = [
          { trait_type: 'Name', value: badgeName },
          { trait_type: 'Style', value: selectedStyle },
          { trait_type: 'Custom Prompt', value: customPrompt || 'None' },
        ];
        
        const result = await mintNFTWithMetadata(nftName, nftDescription, imageFile, attributes, editionSize);
        setMintStatus('success');
        setMintSuccess(`Legacy mint successful!`);
        setTransactionHash(result.transactionHash || 'N/A');
    } catch (error: any) {
        setMintStatus('error');
        setMintError(error.message || 'Minting failed');
    } finally {
        setIsMinting(false)
    }
  }

  const generateContent = async () => {
    // 🔒 VALIDAÇÃO DE SEGURANÇA: Wallet obrigatória
    if (!isConnected) {
      setError('🔒 Please connect your wallet to generate badges')
      return
    }

    if (!badgeName.trim()) {
      setError('Please enter a badge name')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      if (isVisionMode && referenceImageBlob) {
        // Vision-enhanced generation flow
        console.log('🎨 Starting Vision-enhanced badge generation...')
        
        // Validate reference image
        if (!referenceImageBlob || referenceImageBlob.size === 0) {
          throw new Error('No reference image available. Please upload an image first.')
        }
        
        console.log('📸 Reference image info:', {
          size: referenceImageBlob.size,
          type: referenceImageBlob.type,
          lastModified: referenceImageBlob instanceof File ? referenceImageBlob.lastModified : 'N/A'
        })
        
        // Step 1: Get analysis prompt
        setIsAnalyzing(true)
        console.log('📋 Step 1: Getting analysis prompt for badge...')
        const analysisPromptResponse = await fetch('/api/vision-prompts/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sport: 'badge',
            view: selectedBadgeView
          })
        })

        if (!analysisPromptResponse.ok) {
          throw new Error('Failed to get analysis prompt')
        }

        const analysisPromptData = await analysisPromptResponse.json()
        console.log('✅ Analysis prompt received')

        // Step 2: Analyze the uploaded image
        console.log('🔍 Step 2: Analyzing uploaded badge image...')
        
        // Convert blob to base64 for vision-test API
        const imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(referenceImageBlob)
        })

        // Debug payload
        const payload = {
          image_base64: imageBase64,
          prompt: analysisPromptData.analysis_prompt,
          model: 'openai/gpt-4o-mini'
        }
        
        console.log('📤 Sending to vision-test API:', {
          hasImage: !!payload.image_base64,
          imageLength: payload.image_base64?.length || 0,
          imagePrefix: payload.image_base64?.substring(0, 30) || 'none',
          hasPrompt: !!payload.prompt,
          promptLength: payload.prompt?.length || 0,
          model: payload.model
        })

        const analysisResponse = await fetch('/api/vision-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json().catch(() => ({}))
          console.error('❌ Vision-test API error response:', errorData)
          throw new Error(`Analysis failed! Status: ${analysisResponse.status} - ${JSON.stringify(errorData)}`)
        }

        const analysisData = await analysisResponse.json()
        console.log('📥 Received from vision-test API:', analysisData)
        
        if (!analysisData.success) {
          throw new Error(`Analysis error: ${analysisData.error}`)
        }

        console.log('✅ Image analysis completed:', analysisData)
        setAnalysisResult(analysisData)
        setIsAnalyzing(false)

        // Step 3: Get base prompt
        console.log('📝 Step 3: Getting base generation prompt...')
        const basePromptResponse = await fetch('/api/vision-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sport: 'badge',
            view: selectedBadgeView,
            teamName: 'Custom',
            badgeName: badgeName,
            badgeNumber: '',
            style: selectedStyle,
            qualityLevel: quality === 'hd' ? 'advanced' : 'base'
          })
        })

        if (!basePromptResponse.ok) {
          throw new Error('Failed to get base prompt')
        }

        const basePromptData = await basePromptResponse.json()
        console.log('✅ Base prompt received')

        // Step 4: Generate using vision-generate API
        console.log('🎨 Step 4: Generating badge with Vision...')
        
        // Prepare final prompt by combining base prompt with analysis and custom prompt
        const finalPrompt = `${basePromptData.prompt}
        
ORIGINAL DESIGN ANALYSIS: ${analysisData.analysis}

${customPrompt.trim() ? `CUSTOM REQUIREMENTS: ${customPrompt.trim()}` : ''}

QUALITY REQUIREMENTS: Premium badge design, professional graphic design, studio lighting, 4K quality, transparent background, vector-quality edges.`.trim()

        console.log('📝 Final combined prompt ready:', {
          basePromptLength: basePromptData.prompt.length,
          analysisLength: analysisData.analysis.length,
          finalPromptLength: finalPrompt.length,
          preview: finalPrompt.substring(0, 200) + '...'
        })

        const visionGenerateResponse = await fetch('/api/vision-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            quality: quality === 'hd' ? 'hd' : 'standard'
          })
        })

        if (!visionGenerateResponse.ok) {
          const errorData = await visionGenerateResponse.json().catch(() => ({}))
          console.error('❌ Vision-generate API error:', errorData)
          throw new Error(`Vision generation failed! Status: ${visionGenerateResponse.status} - ${JSON.stringify(errorData)}`)
        }

        const visionResult = await visionGenerateResponse.json()
        console.log('✅ Vision generation completed:', visionResult)

        if (visionResult.success && visionResult.image_base64) {
          setGeneratedImage(`data:image/png;base64,${visionResult.image_base64}`)
          
          const response = await fetch(`data:image/png;base64,${visionResult.image_base64}`)
          const blob = await response.blob()
          setGeneratedImageBlob(blob)

          // Save to database with vision metadata
          await saveBadgeToDB({
            name: `${badgeName} Badge`,
            prompt: finalPrompt,
            generationMode: 'vision_enhanced',
            badgeType: selectedBadgeView,
            visionModel: 'gpt-4o-mini',
            analysisData: analysisData.analysis,
            customPrompt: customPrompt || '',
            costUsd: visionResult.cost_usd || 0,
            creatorWallet: address || "N/A",
            tags: [selectedStyle, badgeName, 'vision_enhanced', selectedBadgeView, ...(customPrompt.trim() ? ['custom'] : [])],
          }, blob)
          
          console.log('✅ Vision-enhanced badge generated and saved!')
        } else {
          throw new Error(visionResult.error || 'Vision generation failed')
        }

      } else {
        // Standard generation flow
        const request = {
          team_name: 'Custom',
          badge_name: badgeName,
          badge_number: '',
          custom_prompt: customPrompt || '',
          style: selectedStyle,
          quality: quality,
        };
        
        console.log('Generating badge with request data:', request)
        
        const response = await fetch('/api/badges/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        const result = await response.json()
        console.log('DALL-E 3 Result:', result)

        if (result.success && result.optimized_image) {
          console.log('✅ Badge generation successful!');
          setGeneratedImage(`data:image/png;base64,${result.optimized_image}`);
          
          const response = await fetch(`data:image/png;base64,${result.optimized_image}`)
          const blob = await response.blob()
          setGeneratedImageBlob(blob);

          await saveBadgeToDB({
            name: `${badgeName} Badge`,
            prompt: JSON.stringify(request),
            generationMode: 'standard',
            customPrompt: customPrompt || '',
            creatorWallet: address || "N/A",
            tags: [selectedStyle, badgeName, ...(customPrompt.trim() ? ['custom'] : [])],
          }, blob);

        } else {
          console.error('❌ Badge generation failed:', result.error);
          setError(result.error || 'Failed to generate badge.');
        }
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Badge generation failed');
      setIsAnalyzing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const saveBadgeToDB = async (badgeData: any, imageBlob: Blob) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      console.log('🏆 Saving badge to database...');
      
      // 1. First, upload image to Cloudinary via our API
      console.log('📤 Uploading image to Cloudinary...');
      if (!imageBlob) {
        throw new Error('No image blob available for upload');
      }

      const formData = new FormData();
      formData.append('file', imageBlob, `${badgeData.name}.png`);
      formData.append('fileName', `badge_${badgeName}_${Date.now()}`);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Image uploaded to Cloudinary:', uploadResult.url);

      // 2. Now save to database with Cloudinary URL (not base64)
      const badgeDataWithCloudinaryUrl = {
        ...badgeData,
        imageUrl: uploadResult.url, // Cloudinary URL
        cloudinaryPublicId: uploadResult.publicId, // For deletion if needed
      };

      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badgeDataWithCloudinaryUrl),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save badge to database');
      }

      const result = await response.json();
      console.log('✅ Badge saved to DB:', result);
      setSaveSuccess(`Badge saved successfully! DB ID: ${result.badgeId}`);
    } catch (error: any) {
      console.error('❌ Error saving badge to DB:', error);
      setSaveError(`Image generated, but failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetError = () => setError(null);

  // Vision System Functions
  const handleVisionFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    // Store blob and create preview
    setReferenceImageBlob(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string)
      setIsVisionMode(true)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const exitVisionMode = () => {
    setIsVisionMode(false)
    setReferenceImage(null)
    setReferenceImageBlob(null)
    setAnalysisResult(null)
    setIsAnalyzing(false)
  }



  useEffect(() => {
    const loadTopCollectionsData = async () => {
      setMarketplaceLoading(true);
      
      // FALLBACK INSTANTÂNEO - Suas imagens reais de NFTs (prioridade badges)
      const fallbackData = [
        { name: 'Corinthians Champion Badge', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png', description: 'AI-generated champion badge', price: '0.03 CHZ' },
        { name: 'Jersey Collection #1', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png', description: 'AI-generated jersey', price: '0.05 CHZ' },
        { name: 'Camp Nou Stadium', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751638622/jerseys/stadium_camp_nou_realistic_1751638577656.png', description: 'AI-generated stadium', price: '0.15 CHZ' },
      ];
      setMarketplaceNFTs(fallbackData);
      setMarketplaceLoading(false);

      try {
        console.log('🔄 Loading top collections data for badge editor...');
        
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

        console.log('📊 Raw API data for badges:', { jerseys: jerseys.length, stadiums: stadiums.length, badges: badges.length });

        // Implementar lógica de "Top Collections" com foco em badges
        // Top 2 Badges mais recentes (prioridade para página de badges)
        const topBadges = badges
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map((badge: any) => ({
            name: badge.name,
            imageUrl: badge.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: badge.description || 'AI-generated badge',
            price: '0.03 CHZ',
            category: 'badge',
            createdAt: badge.createdAt
          }));

        // Top 2 Jerseys mais recentes
        const topJerseys = jerseys
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
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

        // Combinar priorizando badges primeiro, depois outros por data
        const allTopCollections = [
          ...topBadges,
          ...topJerseys,
          ...topStadiums
        ]
        .sort((a: any, b: any) => {
          // Badges primeiro, depois por data
          if (a.category === 'badge' && b.category !== 'badge') return -1;
          if (a.category !== 'badge' && b.category === 'badge') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 6); // Limitar a 6 itens no carrossel

        console.log('✅ Top Collections compiled for badges:', allTopCollections);
        if (allTopCollections.length > 0) {
          setMarketplaceNFTs(allTopCollections);
        }
        // Se APIs falharem, mantém fallback

      } catch (error) {
        console.error('❌ Error loading top collections data for badges:', error);
        console.log('🔄 Keeping fallback NFT data due to API error');
        // Mantém fallback com suas imagens reais
      }
    };

    loadTopCollectionsData();
  }, []);

  return (
    <ProfessionalEditorLayout
      sidebar={
        <ProfessionalBadgeSidebar
          badgeName={badgeName}
          setBadgeName={setBadgeName}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          quality={quality}
          setQuality={setQuality}
          isVisionMode={isVisionMode}
          referenceImage={referenceImage}
          selectedBadgeView={selectedBadgeView}
          setSelectedBadgeView={setSelectedBadgeView}
          onFileUpload={handleVisionFileUpload}
          onClearReference={exitVisionMode}
          error={error}
          onResetError={resetError}
        />
      }
      canvas={
        <ProfessionalBadgeCanvas
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onResetError={resetError}
          badgeName={badgeName}
          selectedStyle={selectedStyle}
          quality={quality}
          customPrompt={customPrompt}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
          isAnalyzing={isAnalyzing}
        />
      }
      actionBar={
        <ProfessionalBadgeActionBar
          onGenerate={generateContent}
          isLoading={isLoading || isAnalyzing}
          canGenerate={!!(isConnected && badgeName.trim())}
          onMintLegacy={handleMintNFT}
          onMintGasless={handleEngineNormalMint}
          canMintLegacy={!!canMintLegacy}
          canMintGasless={!!canMintGasless}
          isMinting={isMinting}
          mintStatus={mintStatus}
          mintSuccess={mintSuccess}
          mintError={mintError}
          transactionHash={transactionHash}
          isConnected={isConnected}
          isOnSupportedChain={isOnSupportedChain}
          isUserAdmin={isUserAdmin}
          getTransactionUrl={getTransactionUrl}
          isAnalyzing={isAnalyzing}
        />
      }
      marketplace={
        <ProfessionalMarketplace
          items={marketplaceNFTs}
          isLoading={marketplaceLoading}
          onItemClick={(item) => {
            console.log('Clicked marketplace item:', item)
          }}
          onViewAll={() => {
            console.log('View all marketplace items')
            window.open('/marketplace', '_blank')
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