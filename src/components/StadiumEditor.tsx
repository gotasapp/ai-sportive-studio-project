'use client';

import { useState, useEffect } from 'react';
import { Upload, Zap, Building, Eye, Camera, Sunset, Cloud, Users, RefreshCw, Image as ImageIcon, ChevronLeft, ChevronRight, Wallet, AlertTriangle, Check } from 'lucide-react';
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
import Image from 'next/image';

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

  // Auto-play carousel (paused during interaction and at the end)
  useEffect(() => {
    if (marketplaceNFTs.length > slidesToShow && !isDragging && currentSlide < maxSlide) {
      const interval = setInterval(nextSlide, 5500) // Change slide every 5.5 seconds (slower)
      return () => clearInterval(interval)
    }
  }, [marketplaceNFTs.length, maxSlide, isDragging, currentSlide])

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  const isOnChzChain = chainId === 88888 || chainId === 88882 // CHZ mainnet or testnet
  const isOnPolygonChain = chainId === 137 || chainId === 80002 // Polygon mainnet or Amoy testnet
  
  // Mint conditions
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy precisa wallet
  const canMintGasless = generatedImage && selectedStadium // Gasless só precisa dados

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
  const handleMintNFT = async () => {
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

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1">
            {/* Stadium Generator */}
            <div className="bg-card rounded-lg p-6 border border-gray-800 mb-6">
              <div className="space-y-3 md:space-y-4">
                <h2 className="heading-style">Create Stadium NFT</h2>
                
                {/* Stadium Selection */}
                <div className="space-y-2">
                  <h3 className="heading-style text-sm">Stadium</h3>
                  <Select value={selectedStadium} onValueChange={setSelectedStadium}>
                    <SelectTrigger className="cyber-input">
                      <SelectValue placeholder="Select stadium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom_only">Custom Only</SelectItem>
                      {availableStadiums.map((stadium) => (
                        <SelectItem key={stadium.id} value={stadium.id}>
                          {stadium.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <h3 className="heading-style text-sm">Custom Prompt</h3>
                  <Textarea
                    placeholder="Describe your stadium vision..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="cyber-input h-16 resize-none text-sm"
                  />
                </div>

                {/* Reference Upload */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white">Reference Image</h3>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="cyber-input flex items-center justify-center h-10 text-gray-400 hover:text-cyan-400 transition-colors">
                      <Upload className="w-3 h-3 mr-1.5" />
                      <span className="text-xs">Upload Reference</span>
                    </div>
                  </div>
                  {customReferencePreview && (
                    <div className="mt-1">
                      <Image src={customReferencePreview} alt="Reference preview" width={100} height={50} className="w-full h-16 object-cover rounded border border-cyan-400/30" />
                    </div>
                  )}
                </div>

                {/* Style Filters */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white">Style</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {STADIUM_STYLE_FILTERS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setGenerationStyle(style.id)}
                        className={`style-button p-1 rounded text-xs flex flex-col items-center space-y-0.5 transition-all ${
                          generationStyle === style.id ? 'active' : ''
                        }`}
                      >
                        <style.icon className="w-3 h-3" />
                        <span className="text-xs">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Perspective Filters */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white">Perspective</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {STADIUM_PERSPECTIVE_FILTERS.map((persp) => (
                      <button
                        key={persp.id}
                        onClick={() => setPerspective(persp.id)}
                        className={`style-button p-1 rounded text-xs flex flex-col items-center space-y-0.5 transition-all ${
                          perspective === persp.id ? 'active' : ''
                        }`}
                      >
                        <persp.icon className="w-3 h-3" />
                        <span className="text-xs">{persp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atmosphere */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white">Atmosphere</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {STADIUM_ATMOSPHERE_FILTERS.map((atm) => (
                      <button
                        key={atm.id}
                        onClick={() => setAtmosphere(atm.id)}
                        className={`style-button p-1 rounded text-xs flex flex-col items-center space-y-0.5 transition-all ${
                          atmosphere === atm.id ? 'active' : ''
                        }`}
                      >
                        <atm.icon className="w-3 h-3" />
                        <span className="text-xs">{atm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time and Weather */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-white">Time</h3>
                    <div className="space-y-1">
                      {STADIUM_TIME_FILTERS.map((time) => (
                        <button
                          key={time.id}
                          onClick={() => setTimeOfDay(time.id)}
                          className={`style-button w-full p-1.5 rounded text-xs flex items-center space-x-1.5 transition-all ${
                            timeOfDay === time.id ? 'active' : ''
                          }`}
                        >
                          <time.icon className="w-3 h-3" />
                          <span className="text-xs">{time.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-white">Weather</h3>
                    <div className="space-y-1">
                      {STADIUM_WEATHER_FILTERS.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setWeather(w.id)}
                          className={`style-button w-full p-1.5 rounded text-xs flex items-center space-x-1.5 transition-all ${
                            weather === w.id ? 'active' : ''
                          }`}
                        >
                          <w.icon className="w-3 h-3" />
                          <span className="text-xs">{w.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quality */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-white">Quality</h3>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="cyber-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (1024x1024)</SelectItem>
                      <SelectItem value="hd">HD (1024x1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateStadium}
                  disabled={isGenerating}
                  className="w-full cyber-button py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className="w-3 h-3" />
                      <span className="text-sm">Generate Stadium</span>
                    </div>
                  )}
                </button>

                {/* API Status - Hidden from view but kept in code */}
                <div className="pt-6 border-t border-gray-700 hidden">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-gray-300">
                        API: {apiStatus ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    
                    {result?.cost_usd && (
                      <div className="text-xs text-gray-400">
                        Cost: ${result.cost_usd.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mint Container - Below Stadium Generator (30% smaller height) */}
            <div className="gradient-border mb-4">
              <div className="bg-black p-2 md:p-3">
                <h2 className="heading-style mb-2 text-sm">Mint NFT</h2>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-300">Edition Size</span>
                      <span className="text-cyan-400 font-semibold text-xs">{editionSize}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      value={editionSize}
                      onChange={(e) => setEditionSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none slider"
                    />
                  </div>

                  <div className="space-y-2">
                    {/* 🚀 ENGINE GASLESS MINT */}
                    <button 
                      className={`cyber-button w-full py-2 rounded font-medium transition-all text-xs ${
                        canMintGasless && !isMinting
                          ? 'opacity-100 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!canMintGasless || isMinting}
                      onClick={() => {
                        if (canMintGasless) {
                          handleEngineNormalMint()
                        }
                      }}
                    >
                      {isMinting && mintStatus === 'pending' ? (
                        <div className="flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                          <span className="text-xs">Minting...</span>
                        </div>
                      ) : !generatedImage ? 'Generate Stadium First' :
                        !selectedStadium ? 'Select Stadium' :
                        '🚀 Mint (Gasless)'}
                    </button>

                    {/* 🎯 LEGACY MINT */}
                    <button 
                      className={`cyber-button w-full py-2 rounded font-medium transition-all text-xs ${
                        canMintLegacy && !isMinting
                          ? 'opacity-100 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!canMintLegacy || isMinting}
                      onClick={() => {
                        if (!isConnected) {
                          alert('Please connect your wallet first')
                        } else if (!isOnSupportedChain) {
                          alert('Please switch to a supported network')
                        } else if (canMintLegacy) {
                          handleMintNFT()
                        }
                      }}
                    >
                      {isMinting && mintStatus === 'pending' ? (
                        <div className="flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                          <span className="text-xs">Minting...</span>
                        </div>
                      ) : !isConnected ? 'Connect Wallet' :
                        !isOnSupportedChain ? 'Switch Network' :
                        !generatedImage ? 'Generate Stadium First' :
                        '🎯 Legacy Mint'}
                    </button>
                  </div>

                  {(mintStatus !== 'idle') && (
                    <div className={`p-2 rounded border text-xs ${
                      mintStatus === 'success'
                        ? 'bg-green-500/10 border-green-400/20 text-green-400'
                        : mintStatus === 'error'
                        ? 'bg-red-500/10 border-red-400/20 text-red-400'
                        : 'bg-yellow-500/10 border-yellow-400/20 text-yellow-400'
                    }`}>
                      {mintStatus === 'pending' && 'Waiting for confirmation...'}
                      {mintStatus === 'success' && `✅ ${mintSuccess}`}
                      {mintStatus === 'error' && `❌ ${mintError}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-4">
            <div>
              <div className="p-4 lg:p-2">
                <div className="flex justify-center h-[90vh]">
                  <div className="relative w-[65vh] h-[85vh] rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)',
                    border: '2px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    
                    {isGenerating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-8"></div>
                        <p className="text-cyan-400 text-2xl font-semibold">Generating stadium...</p>
                        <div className="mt-6 w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8">
                            <span className="text-red-400 text-4xl">⚠</span>
                          </div>
                          <p className="text-red-400 mb-8 text-center text-xl">{error}</p>
                          <button 
                            onClick={() => setError('')}
                            className="px-8 py-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-lg"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {generatedImage && !isGenerating && !error && (
                      <div className="absolute inset-0 p-6 lg:p-3">
                        <Image src={generatedImage} alt="Generated Stadium" width={1024} height={1024} className="w-full h-full object-contain rounded-lg" />
                        <div className="absolute inset-0 lg:inset-3 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
                        <div className="absolute -top-3 lg:top-1 -right-3 lg:right-1 w-8 lg:w-6 h-8 lg:h-6 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                        
                        <div className="absolute bottom-0 lg:bottom-3 left-0 lg:left-3 right-0 lg:right-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 lg:p-3 rounded-b-lg">
                          <div className="text-white">
                            <p className="font-bold text-2xl lg:text-lg">{selectedStadium !== 'custom_only' ? availableStadiums.find(s => s.id === selectedStadium)?.name : 'Custom Stadium'}</p>
                            <p className="text-cyan-400 text-lg lg:text-sm">{generationStyle} · {perspective} · {atmosphere}</p>
                            <div className="flex items-center mt-2 lg:mt-1 space-x-4 lg:space-x-3">
                              <span className="text-sm lg:text-xs text-gray-300">{timeOfDay} · {weather}</span>
                              <span className="text-sm lg:text-xs text-gray-300">Quality: {quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!generatedImage && !isGenerating && !error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-48 h-64 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-8 mx-auto">
                            <div className="text-center">
                              <Building className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
                              <p className="text-lg text-gray-400">Stadium</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-xl">Your generated stadium will appear here</p>
                          <p className="text-cyan-400/70 text-lg mt-4">Premium NFT quality rendering</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {generatedImage && (
              <div className="gradient-border">
                <div className="gradient-border-content p-4 md:p-6">
                  <div className="p-4 rounded-lg border border-green-400/20 bg-green-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center">
                        🌐 IPFS Upload
                      </h4>
                      {IPFSService.isConfigured() ? (
                        <span className="text-xs text-green-400">Configured</span>
                      ) : (
                        <span className="text-xs text-yellow-400">Not configured</span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={uploadToIPFS}
                        disabled={!generatedImageBlob || isUploadingToIPFS || !IPFSService.isConfigured()}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                          isUploadingToIPFS 
                            ? 'bg-blue-600/20 text-blue-400 cursor-not-allowed' 
                            : ipfsUrl 
                              ? 'bg-green-600/20 text-green-400 border border-green-400/30'
                              : 'bg-green-600/20 text-green-400 border border-green-400/30 hover:bg-green-600/30'
                        }`}
                      >
                        {isUploadingToIPFS ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Uploading to IPFS...
                          </div>
                        ) : ipfsUrl ? (
                          '✅ Uploaded to IPFS'
                        ) : (
                          '📤 Upload to IPFS'
                        )}
                      </button>
                      
                      {ipfsUrl && (
                        <div className="p-3 bg-neutral-900 rounded-lg">
                          <p className="text-xs text-gray-400 mb-2">IPFS URL:</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={ipfsUrl}
                              readOnly
                              className="flex-1 bg-neutral-800 text-gray-300 text-xs p-2 rounded border border-neutral-700"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ipfsUrl)
                              }}
                              className="px-3 py-2 bg-accent/20 text-accent rounded text-xs hover:bg-accent/30 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => window.open(ipfsUrl, '_blank')}
                              className="px-3 py-2 bg-accent/20 text-accent rounded text-xs hover:bg-accent/30 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {ipfsError && (
                        <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-lg">
                          <p className="text-red-400 text-sm">❌ {ipfsError}</p>
                          {!IPFSService.isConfigured() && (
                            <p className="text-yellow-400 text-xs mt-2">
                              💡 Add PINATA_JWT to .env.local to enable IPFS upload
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

                        {/* Marketplace - Drag & Scroll Carousel */}
            <div className="border border-neutral-800 rounded-lg mt-2">
              <div className="bg-black p-2 md:p-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="heading-style text-xs">Marketplace</h2>
                  <div className="text-xs text-gray-400">
                    Drag to scroll • {currentSlide + 1}-{Math.min(currentSlide + slidesToShow, marketplaceNFTs.length)} of {marketplaceNFTs.length}
                  </div>
                </div>
                
                {/* Draggable Sliding Container */}
                <div 
                  className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={(e) => handleDragStart(e.clientX)}
                  onMouseMove={(e) => handleDragMove(e.clientX)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                  onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                  onTouchEnd={handleDragEnd}
                >
                  <div 
                    className={`flex ${isDragging ? 'transition-none' : 'transition-transform duration-700 ease-in-out'}`}
                    style={{
                      transform: `translateX(calc(-${Math.min(currentSlide, maxSlide) * (100 / slidesToShow)}% + ${dragOffset}px))`,
                      width: `${(marketplaceNFTs.length / slidesToShow) * 100}%`
                    }}
                  >
                    {marketplaceLoading ? (
                      // Loading skeleton
                      Array.from({ length: 8 }).map((_, index) => (
                        <div 
                          key={`loading-${index}`} 
                          className="flex-shrink-0 px-1"
                          style={{ width: `${100 / marketplaceNFTs.length}%` }}
                        >
                          <div className="bg-neutral-900 rounded p-1.5 transition-all duration-300">
                            <div className="aspect-[4/5] bg-neutral-800 rounded mb-1 animate-pulse border border-neutral-700"></div>
                            <div className="space-y-0.5">
                              <div className="h-1.5 bg-neutral-700 rounded animate-pulse"></div>
                              <div className="h-1.5 bg-neutral-700 rounded w-2/3 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : marketplaceNFTs.length > 0 ? (
                      // Real NFT data with drag & scroll
                      marketplaceNFTs.map((nft, index) => (
                        <div 
                          key={`${nft.name}-${index}`} 
                          className="flex-shrink-0 px-1 group"
                          style={{ width: `${100 / marketplaceNFTs.length}%` }}
                        >
                          <div className="bg-neutral-900 rounded p-1.5 transition-all duration-300 hover:scale-105 cursor-pointer">
                            <div className="aspect-[4/5] rounded mb-1 relative overflow-hidden border border-neutral-700">
                              {/* Random trending indicator */}
                              {index % 3 === 0 && (
                                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 z-10"></div>
                              )}
                              
                              <img 
                                src={nft.image_url} 
                                alt={nft.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                                onError={(e) => {
                                  console.error('❌ Error loading stadium marketplace image:', nft.image_url);
                                  // Fallback to gradient background
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const parent = (e.target as HTMLImageElement).parentElement;
                                  if (parent) {
                                    parent.style.background = 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(138, 43, 226, 0.2))';
                                    parent.innerHTML += `<div class="absolute inset-0 flex items-center justify-center text-accent/60 font-bold text-xs">${nft.name.charAt(0)}</div>`;
                                  }
                                }}
                              />
                              
                              {/* Overlay gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-400 group-hover:text-accent transition-colors font-medium truncate">
                                {nft.name}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-accent font-bold text-xs">{nft.price}</span>
                                {index % 3 === 0 && (
                                  <span className="text-xs text-green-400 bg-green-400/10 px-1 py-0.5 rounded">
                                    🔥
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // No data fallback
                      <div className="w-full text-center py-2">
                        <p className="text-gray-400 text-xs">No marketplace items available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Scroll Bar - ShadCN Style */}
                <div className="mt-3 px-2">
                  <div className="relative">
                    {/* Track */}
                    <div className="w-full h-2 bg-neutral-800 rounded-full border border-neutral-700">
                      {/* Progress */}
                      <div 
                        className="h-full bg-accent rounded-full transition-all duration-300 shadow-lg shadow-accent/20"
                        style={{ width: `${maxSlide > 0 ? (Math.min(currentSlide, maxSlide) / maxSlide) * 100 : 0}%` }}
                      />
                      {/* Thumb */}
                      <div 
                        className="absolute top-0 w-4 h-2 bg-accent rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-y-0 transition-all duration-200 hover:scale-110 hover:shadow-accent/50"
                        style={{ 
                          left: `${maxSlide > 0 ? (Math.min(currentSlide, maxSlide) / maxSlide) * 100 : 0}%`,
                          transform: 'translateX(-50%)'
                        }}
                      />
                    </div>
                    
                    {/* Invisible input for interaction */}
                    <input
                      type="range"
                      min="0"
                      max={maxSlide}
                      value={currentSlide}
                      onChange={handleScrollChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {/* Labels */}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {currentSlide + 1} - {Math.min(currentSlide + slidesToShow, marketplaceNFTs.length)}
                      </span>
                      <span className="text-xs text-gray-400">
                        of {marketplaceNFTs.length} items
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-center">
                  <button className="px-3 py-1 border border-accent/30 text-accent rounded hover:border-accent hover:bg-accent/10 transition-all text-xs">
                    View All Items
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 