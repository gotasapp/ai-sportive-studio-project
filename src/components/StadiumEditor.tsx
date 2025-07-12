'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
// import { StadiumService, StadiumInfo } from '@/lib/services/stadium-service'; // REMOVED OLD SERVICE
import { IPFSService } from '@/lib/services/ipfs-service';
import { useWeb3 } from '@/lib/useWeb3';
import { useEngine } from '@/lib/useEngine';
import { isAdmin } from '@/lib/admin-config';
import { getTransactionUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Importando os novos componentes profissionais
import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalStadiumSidebar from '@/components/stadium/ProfessionalStadiumSidebar'
import ProfessionalStadiumCanvas from '@/components/stadium/ProfessionalStadiumCanvas'
import ProfessionalStadiumActionBar from '@/components/stadium/ProfessionalStadiumActionBar'
import ProfessionalMarketplace from '@/components/editor/ProfessionalMarketplace'

// NEW TYPE DEFINITION for stadiums from our API
interface ApiStadium {
  id: string;
  name: string;
  previewImage: string | null;
}

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
  const router = useRouter()
  
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
  const [availableStadiums, setAvailableStadiums] = useState<ApiStadium[]>([]);
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
  const [result, setResult] = useState<any | null>(null); // Changed to any as StadiumResponse is removed
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
  const [selectedSport, setSelectedSport] = useState('soccer')
  
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

  // Load available stadiums from our new DB-driven endpoint
  useEffect(() => {
    const loadAvailableStadiums = async () => {
      try {
        console.log('🔄 Loading available stadiums from DB...');
        const response = await fetch('/api/stadiums');
        if (!response.ok) {
          throw new Error(`Failed to fetch stadiums: ${response.statusText}`);
        }
        const stadiums: ApiStadium[] = await response.json();
        setAvailableStadiums(stadiums as any); // Casting to any to avoid type conflicts with old StadiumInfo
        if (stadiums.length > 0) {
          setSelectedStadium(stadiums[0].id);
        }
        console.log(`✅ Loaded ${stadiums.length} stadiums from DB.`);
      } catch (error) {
        console.error('❌ Error loading stadiums:', error);
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
    if (isGenerating) return;
    setIsGenerating(true);
    setError('');
    setGeneratedImage('');
    setResult(null);

    try {
      // Use the new reference generation flow
      if (selectedStadium !== 'custom_only') {
        console.log(`🚀 Starting reference generation for stadium: ${selectedStadium}`);
        const response = await fetch('/api/generate-stadium-from-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName: selectedStadium, // The API expects the ID in the 'teamName' field
            quality: quality,
            sport: 'soccer', // Default values, can be customized later
            view: 'external',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to generate stadium from reference.');
        }

        const data = await response.json();
        
        if (data.image_base64) {
          const imageUrl = `data:image/png;base64,${data.image_base64}`;
          setGeneratedImage(imageUrl);
          
          // Convert base64 to Blob for potential future use (like minting)
          const fetchRes = await fetch(imageUrl);
          const blob = await fetchRes.blob();
          setGeneratedImageBlob(blob);
        }
        console.log('✅ Stadium generated successfully from reference.');

      } else {
        // This is the old logic for custom prompts/uploads, should be preserved
        // For now, we show an error if custom mode is selected without a proper implementation
        console.log('CUSTOM MODE - NOT IMPLEMENTED IN THIS FLOW');
        throw new Error('Custom generation (from prompt or upload) is not yet connected in this UI. Please select a reference stadium.');
      }
    } catch (err: any) {
      console.error('❌ Generation Error:', err);
      setError(err.message || 'An unknown error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMintNFT = async (isGasless: boolean) => {
    if (!generatedImageBlob) {
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
      title="Stadium Fan NFT"
      showTitle={true}
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
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
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