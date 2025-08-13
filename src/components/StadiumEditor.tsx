'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';

import { useToast } from '@/hooks/use-toast';
// import { StadiumService, StadiumInfo } from '@/lib/services/stadium-service'; // REMOVED OLD SERVICE
import { IPFSService } from '@/lib/services/ipfs-service';
import { useWeb3 } from '@/lib/useWeb3';
import { useEngine } from '@/lib/useEngine';
import { isAdmin } from '@/lib/admin-config';
import { getTransactionUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import StadiumMobileLayout from '@/components/stadium/StadiumMobileLayout';

// Importando os novos componentes profissionais
import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalStadiumSidebar from '@/components/stadium/ProfessionalStadiumSidebar'
import ProfessionalStadiumCanvas from '@/components/stadium/ProfessionalStadiumCanvas'
import ProfessionalStadiumActionBar from '@/components/stadium/ProfessionalStadiumActionBar'


// NEW TYPE DEFINITION for stadiums from our API
interface ApiStadium {
  id: string;
  name: string;
  previewImage: string | null;
  basePrompt?: string; // NOVO: prompt base do stadium
  available_references: string[];
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
  const { toast } = useToast()
  
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
  
  // Marketplace removed to match Jersey page layout
  
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
    // 🔒 VALIDAÇÃO DE SEGURANÇA: Wallet obrigatória - Mostrar toast
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Connect your wallet to start generating NFTs"
      })
      return
    }

    if (isGenerating) return;
    setIsGenerating(true);
    setError('');
    setGeneratedImage('');
    setResult(null);

    try {
      // Use the new reference generation flow
      if (selectedStadium !== 'custom_only') {
        console.log(`🚀 Starting reference generation for stadium: ${selectedStadium}`);
        // Prompt base geral para stadiums
        const generalBasePrompt =
          'A professional football stadium, modern architecture, high-capacity seating, realistic lighting, clean background, ultra-high resolution, photorealistic rendering, premium sports venue, championship atmosphere.';
        // Buscar prompt base do stadium selecionado (se disponível)
        const stadiumRef = availableStadiums.find(s => s.id === selectedStadium);
        const stadiumBasePrompt = stadiumRef && stadiumRef.basePrompt ? `\n${stadiumRef.basePrompt}` : '';
        // Montar prompt final
        const prompt = [
          generalBasePrompt,
          stadiumBasePrompt,
          `Atmosphere: ${atmosphere}, Time of day: ${timeOfDay}, Weather: ${weather}, Style: ${generationStyle}, Perspective: ${perspective}.`,
          customPrompt ? `Custom instructions: ${customPrompt}` : ''
        ].filter(Boolean).join('\n');
        const response = await fetch('/api/generate-from-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName: selectedStadium,
            quality: quality,
            sport: 'stadium',
            style: generationStyle,
            perspective: perspective,
            atmosphere: atmosphere,
            timeOfDay: timeOfDay,
            weather: weather,
            view: perspective, // pode ser ajustado conforme o backend espera
            prompt // NOVO: prompt base geral + stadium + parâmetros + custom
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

  // Função para análise vision de stadiums
  const analyzeStadiumReferenceImage = async () => {
    if (!referenceImageBlob) return;
    setIsAnalyzing(true);
    setError('');
    try {
      // Prompt de análise fornecido pelo usuário
      const analysisPrompt = `Analyze this image of a soccer stadium and return ONLY a valid JSON object with the following structure:

{
  "stadiumName": "if visible or inferable",
  "dominantColors": ["color1", "color2", "color3"],
  "architectureStyle": "brief description (e.g. modern, classic, futuristic, retro)",
  "roofDesign": "open, retractable, fully covered, or none",
  "seatingPattern": "describe colors, arrangement, and shape",
  "fieldView": "describe field perspective, center lines, visible logos or patterns",
  "crowdPresence": "yes or no",
  "lighting": "natural, stadium floodlights, day/night, shadows, reflections",
  "uniqueFeatures": "e.g. large screen, team symbols, tunnel position, banners",
  "weatherConditions": "clear, cloudy, sunset, rain, night, etc."
}

This description will be used to generate a new version of the stadium with slight visual changes based on user filters (like style or lighting). Ensure the JSON is accurate, compact, and does not include any explanation or extra text. Return only the JSON.`;
      // Converter imagem para base64
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(referenceImageBlob);
      });
      // Chamar vision-test/analysis
      const response = await fetch('/api/vision-prompts/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: 'stadium',
          view: perspective,
          prompt: analysisPrompt,
          image_base64: imageBase64
        })
      });
      if (!response.ok) {
        throw new Error('Failed to analyze stadium image');
      }
      const analysisData = await response.json();
      // Aqui você pode salvar o resultado ou usar como preferir
      console.log('✅ Stadium analysis result:', analysisData);
      setIsAnalyzing(false);
      return analysisData;
    } catch (error: any) {
      setIsAnalyzing(false);
      setError(error.message || 'Failed to analyze stadium image');
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
        if (!address) {
          throw new Error("Wallet address is required for minting.");
        }
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

        console.log('🚀 Calling Engine to mint Gasless NFT for:', address)
        const result = await mintGasless({
          to: address,
          metadataUri: ipfsResult.metadataUrl,
          chainId: chainId || 80002, // Adicionando chainId com fallback
        });

        setMintStatus('pending');
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

  // useEffect para carregar stadiums
  useEffect(() => {
    const loadAvailableStadiums = async () => {
      try {
        console.log('🔄 Loading available stadium references from DB...');
        const response = await fetch('/api/admin/stadiums/references');
        if (!response.ok) {
          throw new Error(`Failed to fetch stadium references: ${response.statusText}`);
        }
        const data = await response.json();
        // data.data é o array de stadium references
        const stadiums: ApiStadium[] = (data.data || []).map((ref: any) => ({
          id: ref.teamName || ref.stadiumId || ref._id,
          name: ref.teamName || ref.stadiumId || 'Unnamed Stadium',
          previewImage: ref.referenceImages && ref.referenceImages.length > 0 ? ref.referenceImages[0].url : null,
          basePrompt: ref.teamBasePrompt || '', // NOVO: prompt base do stadium
          available_references: ref.available_references || [],
        }));
        setAvailableStadiums(stadiums);
        if (stadiums.length > 0) {
          setSelectedStadium(stadiums[0].id);
        }
        console.log(`✅ Loaded ${stadiums.length} stadium references from DB.`);
      } catch (error) {
        console.error('❌ Error loading stadium references:', error);
        setAvailableStadiums([]);
        setSelectedStadium('custom_only');
      }
    };

    loadAvailableStadiums();
  }, []);

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <StadiumMobileLayout
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
        generatedImage={generatedImage}
        isLoading={isGenerating}
        onGenerate={generateStadium}
        isConnected={isConnected}
        isOnSupportedChain={isOnSupportedChain}
        isUserAdmin={isUserAdmin}
        canMintLegacy={!!canMintLegacy}
        canMintGasless={!!canMintGasless}
        isMinting={isMinting}
        mintStatus={mintStatus}
        mintSuccess={mintSuccess}
        mintError={mintError}
        transactionHash={transactionHash}
        onMintLegacy={() => handleMintNFT(false)}
        onMintGasless={() => handleMintNFT(true)}
        walletAddress={address || ""}
        nftName={selectedStadium !== 'custom_only' ? selectedStadium.replace(/_/g, ' ') : 'Custom Stadium'}
        hasGeneratedImage={!!generatedImage}
        metadataUri={''} // Adapte se necessário para stadium
        collection="stadiums"
      />
    );
  }
  
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
          canGenerate={!!((selectedStadium && selectedStadium !== 'custom_only') || customPrompt.trim() || isVisionMode)}
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
          hasGeneratedImage={!!generatedImage}
          nftName={`Stadium Collection #${Date.now()}`}
          metadataUri={''}
          walletAddress={address}
          collection={'stadiums'}
          generatedImageBlob={generatedImageBlob || undefined}
        />
      }

    />
  )
} 