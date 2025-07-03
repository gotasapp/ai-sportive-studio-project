'use client';

import { useState, useEffect } from 'react';
import { Upload, Zap, Building, Eye, Camera, Sunset, Cloud, Users, RefreshCw, Image as ImageIcon, ChevronLeft, ChevronRight, Wallet, AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StadiumService, StadiumInfo, StadiumResponse } from '@/lib/services/stadium-service';
import { IPFSService } from '@/lib/services/ipfs-service';
import { useWeb3 } from '@/lib/useWeb3';
import { useEngine } from '@/lib/useEngine';
import { isAdmin } from '@/lib/admin-config';
import Image from 'next/image';
import { getTransactionUrl } from '@/lib/utils';

// Importando os novos componentes reutilizáveis
import EditorLayout from '@/components/layouts/EditorLayout';
import EditorPanel from '@/components/editor/EditorPanel';
import PreviewPanel from '@/components/editor/PreviewPanel';
import MarketplaceCarousel from '@/components/editor/MarketplaceCarousel';
import StyleButton from '@/components/ui/StyleButton';

const STADIUM_STYLE_FILTERS = [
  { id: 'realistic', label: 'Realistic', icon: Eye },
  { id: 'cinematic', label: 'Cinematic', icon: Camera },
  { id: 'dramatic', label: 'Dramatic', icon: Zap }
];

const STADIUM_PERSPECTIVE_FILTERS = [
  { id: 'external', label: 'External', icon: Building },
  { id: 'internal', label: 'Internal', icon: Users },
  { id: 'mixed', label: 'Mixed', icon: Eye }
];

const STADIUM_ATMOSPHERE_FILTERS = [
  { id: 'packed', label: 'Packed', icon: Users },
  { id: 'half_full', label: 'Half Full', icon: Users },
  { id: 'empty', label: 'Empty', icon: Building }
];

const STADIUM_TIME_FILTERS = [
  { id: 'day', label: 'Day', icon: Zap },
  { id: 'night', label: 'Night', icon: Building },
  { id: 'sunset', label: 'Sunset', icon: Sunset }
];

const STADIUM_WEATHER_FILTERS = [
  { id: 'clear', label: 'Clear', icon: Zap },
  { id: 'dramatic', label: 'Dramatic', icon: Cloud },
  { id: 'cloudy', label: 'Cloudy', icon: Cloud }
];

// Marketplace data will be loaded from JSON
interface MarketplaceNFT {
  name: string;
  image_url: string;
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
  const [referenceType, setReferenceType] = useState('atmosphere');
  
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
  const [customReferenceBase64, setCustomReferenceBase64] = useState('');
  const [customReferencePreview, setCustomReferencePreview] = useState('');
  
  // Generation state
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StadiumResponse | null>(null);
  const [apiStatus, setApiStatus] = useState(false);
  const [generationCost, setGenerationCost] = useState<number | null>(null);

  // IPFS state
  const [ipfsUrl, setIpfsUrl] = useState('');
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [ipfsError, setIpfsError] = useState<string | null>(null);
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
  
  // Smooth Carousel state with drag & scroll
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const slidesToShow = 4
  const maxSlide = Math.max(0, marketplaceNFTs.length - slidesToShow) // Para exatamente no último conjunto visível
  
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
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy precisa wallet
  const canMintGasless = generatedImage && selectedStadium && isUserAdmin // Gasless só para admins

  useEffect(() => {
    loadAvailableStadiums();
    checkApiStatus();
  }, []);

  // Load marketplace data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        console.log('🔄 Loading marketplace data for stadiums...')
        const response = await fetch('/marketplace-images.json')
        if (!response.ok) throw new Error('Failed to load marketplace data')
        
        const data = await response.json()
        console.log('✅ Marketplace data loaded for stadiums:', data)
        
        // Combine jerseys and stadiums for the marketplace carousel
        const allNFTs = [...data.marketplace_nfts.jerseys, ...data.marketplace_nfts.stadiums]
        setMarketplaceNFTs(allNFTs)
      } catch (error) {
        console.error('❌ Error loading marketplace data for stadiums:', error)
      } finally {
        setMarketplaceLoading(false)
      }
    }

    loadMarketplaceData()
  }, []);

  // Convert base64 to blob when image is generated
  useEffect(() => {
    console.log('🔄 useEffect triggered for blob conversion');
    console.log('📊 result?.generated_image_base64 exists:', !!result?.generated_image_base64);
    
    if (result?.generated_image_base64) {
      console.log('🔄 Converting base64 to blob...');
      try {
        const byteCharacters = atob(result.generated_image_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        setGeneratedImageBlob(blob);
        console.log('✅ Blob created successfully, size:', blob.size);
      } catch (error) {
        console.error('❌ Error converting base64 to blob:', error);
        setGeneratedImageBlob(null);
      }
    } else {
      console.log('⚠️ No image data to convert to blob');
      setGeneratedImageBlob(null);
    }
  }, [result?.generated_image_base64]);

  // Efeito para fazer o polling do status da transação
  useEffect(() => {
    if (mintStatus === 'pending' && mintedTokenId) {
      const interval = setInterval(async () => {
        console.log(`🔎 Verificando status para queueId: ${mintedTokenId}`);
        const statusResult = await getTransactionStatus(mintedTokenId);
        
        if (statusResult.result) {
            const { status, transactionHash: finalTxHash, errorMessage } = statusResult.result;
            console.log('Status da Engine:', status);

            if (status === 'mined') {
                setMintStatus('success');
                setMintSuccess('NFT successfully created on blockchain!');
                setTransactionHash(finalTxHash);
                clearInterval(interval);
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
  }, [mintStatus, mintedTokenId, getTransactionStatus]);

  const loadAvailableStadiums = async () => {
    try {
      const stadiums = await StadiumService.getAvailableStadiums();
      setAvailableStadiums(stadiums);
      if (stadiums.length > 0) {
        setSelectedStadium(stadiums[0].id);
      }
    } catch (error) {
      console.error('Error loading stadiums:', error);
      setError('Failed to load available stadiums');
    }
  };

  const checkApiStatus = async () => {
    try {
      await StadiumService.checkHealth();
      setApiStatus(true);
    } catch (error) {
      setApiStatus(false);
    }
  };

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
      const stadiumName = selectedStadium !== 'custom_only' 
        ? availableStadiums.find(s => s.id === selectedStadium)?.name || 'Custom Stadium'
        : 'Custom Stadium';

      const name = `${stadiumName} Stadium NFT`
      const description = `AI-generated stadium NFT featuring ${stadiumName} in ${generationStyle} style with ${perspective} perspective.`

      const result = await IPFSService.uploadComplete(
        generatedImageBlob,
        name,
        description,
        stadiumName,
        generationStyle,
        '', // no player name for stadiums
        '' // no player number for stadiums
      )

      setIpfsUrl(result.imageUrl)
      console.log('🎉 Upload completed:', result)
      
    } catch (error: any) {
      console.error('❌ IPFS upload failed:', error)
      setIpfsError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploadingToIPFS(false)
    }
  }

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
    if (!generatedImageBlob || !selectedStadium) {
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
      const stadiumName = selectedStadium !== 'custom_only' 
        ? availableStadiums.find(s => s.id === selectedStadium)?.name || 'Custom Stadium'
        : 'Custom Stadium';

      const nftName = `${stadiumName} Stadium NFT`
      const nftDescription = `AI-generated stadium NFT featuring ${stadiumName} in ${generationStyle} style with ${perspective} perspective. Generated by AI Sports NFT Generator.`
      
      const attributes = [
        { trait_type: 'Stadium', value: stadiumName },
        { trait_type: 'Style', value: generationStyle },
        { trait_type: 'Perspective', value: perspective },
        { trait_type: 'Atmosphere', value: atmosphere },
        { trait_type: 'Time of Day', value: timeOfDay },
        { trait_type: 'Weather', value: weather },
        { trait_type: 'Quality', value: quality },
        { trait_type: 'Generator', value: 'AI Sports NFT' }
      ]

      console.log('⚡ ENGINE NORMAL: Starting normal mint process...')
      console.log('📦 Name:', nftName)
      console.log('📝 Description:', nftDescription)
      console.log('🎯 Recipient:', address)
      console.log('💳 Backend pays gas')

      // 1. Upload image and metadata to IPFS first
      const ipfsResult = await IPFSService.uploadComplete(
        generatedImageBlob,
        nftName,
        nftDescription,
        stadiumName,
        generationStyle,
        '', // no player name for stadiums
        '' // no player number for stadiums
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

  // 🎯 LEGACY MINT - Direct SDK (fallback) - THE MAIN USER FLOW
  const handleMintNFT = async (isGasless: boolean) => {
    if (!generatedImageBlob || !selectedStadium) {
      setMintError('Missing required data for minting')
      return
    }

    setIsMinting(true)
    setMintError(null)
    setMintSuccess(null)
    setMintStatus('pending');

    try {
      const stadiumName = selectedStadium !== 'custom_only' 
        ? availableStadiums.find(s => s.id === selectedStadium)?.name || 'Custom Stadium'
        : 'Custom Stadium';

      const nftName = `${stadiumName} Stadium NFT`
      const nftDescription = `AI-generated stadium NFT featuring ${stadiumName} in ${generationStyle} style with ${perspective} perspective. Generated by AI Sports NFT Generator.`
      
      const attributes = [
        { trait_type: 'Stadium', value: stadiumName },
        { trait_type: 'Style', value: generationStyle },
        { trait_type: 'Perspective', value: perspective },
        { trait_type: 'Atmosphere', value: atmosphere },
        { trait_type: 'Time of Day', value: timeOfDay },
        { trait_type: 'Weather', value: weather },
        { trait_type: 'Quality', value: quality },
        { trait_type: 'Generator', value: 'AI Sports NFT' }
      ]

      console.log('🎯 LEGACY: Starting NFT mint process...')
      console.log('📦 Name:', nftName)
      console.log('📝 Description:', nftDescription)
      console.log('🎨 Attributes:', attributes)

      // Convert blob to File for the mint function
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

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCustomFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomReferenceFile(file);
      try {
        const base64 = await convertFileToBase64(file);
        setCustomReferenceBase64(base64);
        setCustomReferencePreview(`data:image/${file.type.split('/')[1]};base64,${base64}`);
      } catch (error) {
        console.error('Error converting file:', error);
        setError('Error processing image');
      }
    }
  };

  const generateStadium = async () => {
    if (!selectedStadium && !customPrompt) {
      setError('Select a stadium or enter a custom prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage('');
    setResult(null);

    try {
      let response: StadiumResponse;

      if (selectedStadium && selectedStadium !== 'custom_only') {
        // Generate with reference
        const request = {
          stadium_id: selectedStadium,
          reference_type: referenceType,
          generation_style: generationStyle,
          perspective,
          atmosphere,
          time_of_day: timeOfDay,
          weather,
          quality,
          custom_prompt: customPrompt || undefined,
          custom_reference_base64: customReferenceBase64 || undefined,
        };
        response = await StadiumService.generateFromReference(request);
      } else {
        // Generate custom only
        if (!customPrompt) {
          setError('Enter a custom prompt for custom generation');
          setIsGenerating(false);
          return;
        }
        
        const request = {
          prompt: customPrompt,
          reference_image_base64: customReferenceBase64 || undefined,
          generation_style: generationStyle,
          perspective,
          atmosphere,
          time_of_day: timeOfDay,
          quality,
        };
        response = await StadiumService.generateCustom(request);
      }
      
      if (response.success && response.generated_image_base64) {
        console.log('✅ Stadium generation successful!');
        console.log('📸 Image data length:', response.generated_image_base64.length);
        setGeneratedImage(`data:image/png;base64,${response.generated_image_base64}`);
        setResult(response);
        console.log('🎯 Result set, useEffect should trigger blob conversion');
      } else {
        console.log('❌ Stadium generation failed:', response.error);
        setError(response.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('Failed to generate stadium');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setGeneratedImage('');
    setResult(null);
    setError('');
    setCustomPrompt('');
    setCustomReferenceFile(null);
    setCustomReferenceBase64('');
    setCustomReferencePreview('');
    setIpfsUrl('');
    setIpfsError('');
    setGeneratedImageBlob(null);
    if (availableStadiums.length > 0) {
      setSelectedStadium(availableStadiums[0].id);
    } else {
      setSelectedStadium('custom_only');
    }
  };

  const renderControls = () => (
    <>
      <EditorPanel title="1. Architecture">
        <div className="space-y-4">
            <div>
                <Label>Reference Stadium</Label>
                <Select value={selectedStadium} onValueChange={setSelectedStadium}>
                    <SelectTrigger className="cyber-input bg-black text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-black">
                        <SelectItem value="custom_only" className="bg-black text-white">No Reference (Custom Prompt)</SelectItem>
                        {availableStadiums.map(s => <SelectItem key={s.id} value={s.id} className="bg-black text-white">{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Generation Style</Label>
                <div className="grid grid-cols-3 gap-2">
                    {STADIUM_STYLE_FILTERS.map(f => <StyleButton key={f.id} onClick={() => setGenerationStyle(f.id)} isActive={generationStyle === f.id}>
                        <f.icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{f.label}</span>
                    </StyleButton>)}
                </div>
            </div>
             <div>
                <Label>Perspective</Label>
                <div className="grid grid-cols-3 gap-2">
                    {STADIUM_PERSPECTIVE_FILTERS.map(f => <StyleButton key={f.id} onClick={() => setPerspective(f.id)} isActive={perspective === f.id}>
                        <f.icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{f.label}</span>
                    </StyleButton>)}
                </div>
            </div>
        </div>
      </EditorPanel>
      <EditorPanel title="2. Customization">
        <div className="space-y-4">
            <div>
                <Label>Atmosphere</Label>
                <div className="grid grid-cols-3 gap-2">
                    {STADIUM_ATMOSPHERE_FILTERS.map(f => <StyleButton key={f.id} onClick={() => setAtmosphere(f.id)} isActive={atmosphere === f.id}>
                        <f.icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{f.label}</span>
                    </StyleButton>)}
                </div>
            </div>
             <div>
                <Label>Time of Day</Label>
                <div className="grid grid-cols-3 gap-2">
                    {STADIUM_TIME_FILTERS.map(f => <StyleButton key={f.id} onClick={() => setTimeOfDay(f.id)} isActive={timeOfDay === f.id}>
                        <f.icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{f.label}</span>
                    </StyleButton>)}
                </div>
            </div>
            <div>
                <Label>Weather</Label>
                <div className="grid grid-cols-3 gap-2">
                    {STADIUM_WEATHER_FILTERS.map(f => <StyleButton key={f.id} onClick={() => setWeather(f.id)} isActive={weather === f.id}>
                        <f.icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{f.label}</span>
                    </StyleButton>)}
                </div>
            </div>
            <div>
                <Label>Custom Prompt (Optional)</Label>
                <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="e.g., a futuristic stadium on Mars" />
            </div>
            <Button onClick={generateStadium} disabled={isGenerating} className="w-full">
                {isGenerating ? 'Generating...' : 'Generate Stadium'}
            </Button>
        </div>
      </EditorPanel>
      <EditorPanel title="3. Mint NFT">
            <div>
          <label className="text-sm font-medium text-gray-300">Edition Size: <span className="text-cyan-400 font-semibold">{editionSize}</span></label>
          <input type="range" min="1" max="1000" value={editionSize} onChange={(e) => setEditionSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider mt-2" />
                          </div>
        <div className="space-y-3 mt-4">
          {isUserAdmin && <Button onClick={() => handleMintNFT(true)} disabled={!canMintGasless || isMinting} className="cyber-button w-full">Mint via Engine (Gasless)</Button>}
          <Button onClick={() => handleMintNFT(false)} disabled={!canMintLegacy || isMinting} className="cyber-button w-full">Mint (Legacy)</Button>
                      </div>
        {mintStatus !== 'idle' && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${mintStatus === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            <p>{mintStatus === 'success' ? `✅ ${mintSuccess}` : `❌ ${mintError}`}</p>
            {transactionHash && <a href={getTransactionUrl(transactionHash)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline mt-1 block truncate">View on Explorer</a>}
                      </div>
                    )}
      </EditorPanel>
    </>
  );

  return (
    <EditorLayout
      controls={renderControls()}
      preview={<PreviewPanel generatedImage={generatedImage} isLoading={isGenerating} error={error} onResetError={resetForm} />}
      marketplace={<MarketplaceCarousel items={marketplaceNFTs} isLoading={marketplaceLoading} />}
    />
  )
} 