'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { StadiumService, StadiumInfo, StadiumResponse } from '@/lib/services/stadium-service';
import { IPFSService } from '@/lib/services/ipfs-service';
import { useWeb3 } from '@/lib/useWeb3';
import { useEngine } from '@/lib/useEngine';
import { isAdmin } from '@/lib/admin-config';
import { getTransactionUrl } from '@/lib/utils';

// Importando os novos componentes profissionais
import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalStadiumSidebar from '@/components/stadium/ProfessionalStadiumSidebar'
import ProfessionalStadiumCanvas from '@/components/stadium/ProfessionalStadiumCanvas'
import ProfessionalStadiumActionBar from '@/components/stadium/ProfessionalStadiumActionBar'
import ProfessionalMarketplace from '@/components/editor/ProfessionalMarketplace'

// Marketplace data will be loaded from JSON
interface MarketplaceNFT {
  name: string;
  imageUrl: string;
  description: string;
  price: string;
}

export default function StadiumEditor() {
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

  // Stadium reference state
  const [availableStadiums, setAvailableStadiums] = useState<StadiumInfo[]>([]);
  const [selectedStadium, setSelectedStadium] = useState('custom_only');
  
  // Generation parameters
  const [generationStyle, setGenerationStyle] = useState<string>('realistic');
  const [perspective, setPerspective] = useState<string>('external');
  const [atmosphere, setAtmosphere] = useState<string>('packed');
  const [timeOfDay, setTimeOfDay] = useState<string>('day');
  const [weather, setWeather] = useState<string>('clear');
  const [quality, setQuality] = useState<string>('standard');
  
  // Custom inputs
  const [customPrompt, setCustomPrompt] = useState('');
  const [customReferenceFile, setCustomReferenceFile] = useState<File | null>(null);
  
  // Generation state
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StadiumResponse | null>(null);
  const [generationCost, setGenerationCost] = useState<number | null>(null);

  // IPFS state
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null);

  // Mint state
  const [editionSize, setEditionSize] = useState(100);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Marketplace state
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  
  // Vision Analysis states
  const [isVisionMode, setIsVisionMode] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageBlob, setReferenceImageBlob] = useState<Blob | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedView, setSelectedView] = useState('external')
  
  // Network validation
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  const isUserAdmin = isAdmin(account)
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage
  const canMintGasless = generatedImage && isUserAdmin

  // Load marketplace data
  useEffect(() => {
    const loadTopCollectionsData = async () => {
      setMarketplaceLoading(true);
      
      // FALLBACK INSTANTÂNEO - Suas imagens reais de NFTs
      const fallbackData = [
        { name: 'Camp Nou Stadium', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751638622/jerseys/stadium_camp_nou_realistic_1751638577656.png', description: 'AI-generated stadium', price: '0.15 CHZ' },
        { name: 'Stadium Collection #1', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png', description: 'AI-generated jersey', price: '0.05 CHZ' },
        { name: 'Stadium Collection #2', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png', description: 'AI-generated jersey', price: '0.05 CHZ' },
      ];
      setMarketplaceNFTs(fallbackData);
      setMarketplaceLoading(false);

      try {
        console.log('🔄 Loading top collections data for stadium editor...');
        
        // Buscar dados reais das 3 APIs em paralelo
        const [jerseysResponse, stadiumsResponse, badgesResponse] = await Promise.all([
          fetch('/api/jerseys'),
          fetch('/api/stadiums'),
          fetch('/api/badges')
        ]);

        if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
          throw new Error(`API Error: Jerseys(${jerseysResponse.status}), Stadiums(${stadiumsResponse.status}), Badges(${badgesResponse.status})`);
        }

        const jerseys = await jerseysResponse.json();
        const stadiums = await stadiumsResponse.json();
        const badges = await badgesResponse.json();

        console.log('📊 Raw API data:', { jerseys: jerseys.length, stadiums: stadiums.length, badges: badges.length });

        // Top 3 Stadiums mais recentes
        const topStadiums = stadiums
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map((stadium: any) => ({
            name: stadium.name,
            imageUrl: stadium.imageUrl,
            description: stadium.description || 'AI-generated stadium',
            price: '0.15 CHZ',
            category: 'stadium',
            createdAt: stadium.createdAt
          }));

        // Top 2 Jerseys mais recentes
        const topJerseys = jerseys
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map((jersey: any) => ({
            name: jersey.name,
            imageUrl: jersey.imageUrl,
            description: jersey.description || 'AI-generated jersey',
            price: '0.05 CHZ',
            category: 'jersey',
            createdAt: jersey.createdAt
          }));

        // Top 1 Badge mais recente
        const topBadges = badges
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1)
          .map((badge: any) => ({
            name: badge.name,
            imageUrl: badge.imageUrl,
            description: badge.description || 'AI-generated badge',
            price: '0.03 CHZ',
            category: 'badge',
            createdAt: badge.createdAt
          }));

        // Combinar priorizando stadiums primeiro, depois outros por data
        const allTopCollections = [
          ...topStadiums,
          ...topJerseys,
          ...topBadges
        ]
        .sort((a: any, b: any) => {
          // Stadiums primeiro, depois por data
          if (a.category === 'stadium' && b.category !== 'stadium') return -1;
          if (a.category !== 'stadium' && b.category === 'stadium') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 6); // Limitar a 6 itens no carrossel

        console.log('✅ Top Collections compiled for stadiums:', allTopCollections);
        if (allTopCollections.length > 0) {
          setMarketplaceNFTs(allTopCollections);
        }

      } catch (error) {
        console.error('❌ Error loading top collections data for stadiums:', error);
        console.log('🔄 Keeping fallback NFT data due to API error');
      }
    };

    loadTopCollectionsData();
  }, []);

  // Load available stadiums
  useEffect(() => {
  const loadAvailableStadiums = async () => {
    try {
      const stadiums = await StadiumService.getAvailableStadiums();
      setAvailableStadiums(stadiums);
      if (stadiums.length > 0) {
        setSelectedStadium(stadiums[0].id);
      }
    } catch (error) {
      console.error('Error loading stadiums:', error);
        setAvailableStadiums([]);
        setSelectedStadium('custom_only');
      }
    };

    loadAvailableStadiums();
  }, []);
  
  const handleVisionFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      
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
      
      console.log('📸 Stadium reference image uploaded:', file.name, file.size)
      
    } catch (error) {
      console.error('❌ Upload error:', error)
      setError('Failed to upload image')
    }
  }

  const clearVisionImage = () => {
    setReferenceImage(null)
    setReferenceImageBlob(null)
    setIsVisionMode(false)
  }

  const generateStadium = async () => {
    if (!isConnected) {
      setError('🔒 Please connect your wallet to generate stadiums')
      return
    }

    setIsGenerating(true);
    setError('');

    try {
      if (isVisionMode && referenceImageBlob) {
        // Vision-enhanced generation
        console.log('🎨 Starting Vision-enhanced stadium generation...')
            setIsAnalyzing(true)
            
        // Convert to base64
              const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string
            
            // Call vision analysis API
            const visionResponse = await fetch('/api/vision-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData: base64Data,
                sport: 'stadium',
              view: selectedView,
                customPrompt: customPrompt
              })
            })

            if (!visionResponse.ok) {
              throw new Error(`Vision analysis failed: ${visionResponse.status}`)
            }

            const visionResult = await visionResponse.json()
            setIsAnalyzing(false)
            
            if (visionResult.imageUrl) {
              setGeneratedImage(visionResult.imageUrl)
              
              // Convert to blob for minting
              const imageResponse = await fetch(visionResult.imageUrl)
              const blob = await imageResponse.blob()
              setGeneratedImageBlob(blob)
              
              console.log('✅ Vision-enhanced stadium generated successfully')
            }
            
          } catch (error: any) {
            setIsAnalyzing(false)
            setError(error.message || 'Vision analysis failed')
          }
        }
        reader.readAsDataURL(referenceImageBlob)

      } else {
        // Standard generation
        const response = await StadiumService.generateStadium({
          stadiumId: selectedStadium !== 'custom_only' ? selectedStadium : undefined,
            style: generationStyle,
          perspective: perspective,
          atmosphere: atmosphere,
          timeOfDay: timeOfDay,
          weather: weather,
          customPrompt: customPrompt
        });

        if (response.imageUrl) {
          setGeneratedImage(response.imageUrl);
          
          // Convert to blob for minting
          const imageResponse = await fetch(response.imageUrl);
          const blob = await imageResponse.blob();
          setGeneratedImageBlob(blob);
          
          setResult(response);
          console.log('✅ Stadium generated successfully');
        }
      }

    } catch (error: any) {
      console.error('❌ Stadium generation error:', error);
      setError(error.message || 'Failed to generate stadium');
    } finally {
          setIsGenerating(false);
      setIsAnalyzing(false);
    }
  };

  const handleMintNFT = async (isGasless: boolean) => {
    if (!generatedImageBlob || !address) {
      setMintError('Missing required data for minting');
      return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintStatus('pending');

    try {
      const nftName = `${selectedStadium !== 'custom_only' ? selectedStadium.replace(/_/g, ' ') : 'Custom'} Stadium`;
      const nftDescription = `AI-generated stadium. Style: ${generationStyle}, Perspective: ${perspective}, Atmosphere: ${atmosphere}.`;

      if (isGasless && isUserAdmin) {
        // Engine gasless mint
        const ipfsResult = await IPFSService.uploadComplete(
          generatedImageBlob,
          nftName,
          nftDescription,
          selectedStadium !== 'custom_only' ? selectedStadium : 'Custom',
          generationStyle,
          perspective,
          atmosphere
        );

        const result = await mintGasless({
          to: address,
          metadataUri: ipfsResult.metadataUrl,
        });

        setMintSuccess(`Transaction sent! Queue ID: ${result.queueId}`);
        setMintedTokenId(result.queueId || null);
      } else {
        // Legacy mint
        const imageFile = new File([generatedImageBlob], `${nftName}.png`, { type: 'image/png' });
        const attributes = [
          { trait_type: 'Stadium', value: selectedStadium !== 'custom_only' ? selectedStadium : 'Custom' },
          { trait_type: 'Style', value: generationStyle },
          { trait_type: 'Perspective', value: perspective },
          { trait_type: 'Atmosphere', value: atmosphere },
          { trait_type: 'Time of Day', value: timeOfDay },
          { trait_type: 'Weather', value: weather },
        ];
        
        const result = await mintNFTWithMetadata(nftName, nftDescription, imageFile, attributes, editionSize);
        setMintStatus('success');
        setMintSuccess(`Legacy mint successful!`);
        setTransactionHash(result.transactionHash || 'N/A');
      }
      
    } catch (error: any) {
      setMintStatus('error');
      setMintError(error.message || 'Minting failed');
    } finally {
      setIsMinting(false);
    }
  };

  // Monitor gasless mint status
  useEffect(() => {
    if (mintStatus === 'pending' && mintedTokenId) {
      const interval = setInterval(async () => {
        const statusResult = await getTransactionStatus(mintedTokenId);
        if (statusResult.result?.status === 'mined') {
          setMintStatus('success');
          setMintSuccess('Stadium NFT successfully created!');
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

  const resetError = () => setError('');

  return (
    <ProfessionalEditorLayout
      sidebar={
        <ProfessionalStadiumSidebar
          availableStadiums={availableStadiums}
          selectedStadium={selectedStadium}
          setSelectedStadium={setSelectedStadium}
          generationStyle={generationStyle}
          setGenerationStyle={setGenerationStyle}
          perspective={perspective}
          setPerspective={setPerspective}
          atmosphere={atmosphere}
          setAtmosphere={setAtmosphere}
          timeOfDay={timeOfDay}
          setTimeOfDay={setTimeOfDay}
          weather={weather}
          setWeather={setWeather}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          isVisionMode={isVisionMode}
          referenceImage={referenceImage}
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          onFileUpload={handleVisionFileUpload}
          onClearReference={clearVisionImage}
          generationCost={generationCost}
          error={error}
          onResetError={resetError}
        />
      }
      canvas={
        <ProfessionalStadiumCanvas
          generatedImage={generatedImage}
          isLoading={isGenerating}
          error={error}
          onResetError={resetError}
          selectedStadium={selectedStadium}
          generationStyle={generationStyle}
          perspective={perspective}
          atmosphere={atmosphere}
          timeOfDay={timeOfDay}
          weather={weather}
          customPrompt={customPrompt}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
          isAnalyzing={isAnalyzing}
          availableStadiums={availableStadiums}
        />
      }
      actionBar={
        <ProfessionalStadiumActionBar
          onGenerate={generateStadium}
          isLoading={isGenerating}
          canGenerate={!!(isConnected && ((selectedStadium && selectedStadium !== 'custom_only') || customPrompt.trim() || isVisionMode))}
          generationCost={generationCost}
          onMintLegacy={() => handleMintNFT(false)}
          onMintGasless={() => handleMintNFT(true)}
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