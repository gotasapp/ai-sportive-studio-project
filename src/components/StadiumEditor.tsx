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
import { stadiumService, StadiumInfo, StadiumResponse } from '@/lib/services/stadium-service';
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

const MARKETPLACE_ITEMS = [
  { id: 1, number: '01', price: '0.5 ETH', trending: true },
  { id: 2, number: '02', price: '0.3 ETH', trending: false },
  { id: 3, number: '03', price: '0.8 ETH', trending: true },
  { id: 4, number: '04', price: '0.4 ETH', trending: false },
  { id: 5, number: '05', price: '1.2 ETH', trending: true },
  { id: 6, number: '06', price: '0.6 ETH', trending: false }
];

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

  // Convert base64 to blob when image is generated
  useEffect(() => {
    if (result?.generated_image_base64) {
      try {
        const byteCharacters = atob(result.generated_image_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        setGeneratedImageBlob(blob);
      } catch (error) {
        console.error('Error converting base64 to blob:', error);
      }
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
      const stadiums = await stadiumService.getAvailableStadiums();
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
      await stadiumService.checkHealth();
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
        response = await stadiumService.generateFromReference(request);
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
        response = await stadiumService.generateCustom(request);
      }
      
      if (response.success && response.generated_image_base64) {
        setGeneratedImage(`data:image/png;base64,${response.generated_image_base64}`);
        setResult(response);
      } else {
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
    <div className="min-h-screen" style={{
      background: `
        radial-gradient(ellipse at top, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at bottom, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
        #000518
      `
    }}>
      <div className="container mx-auto px-6 py-8" style={{ background: 'transparent' }}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1">
            <div className="gradient-border">
              <div className="gradient-border-content p-6 space-y-6">
                <h2 className="text-xl font-bold text-white">Stadium Generator</h2>
                
                {/* Stadium Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Stadium</h3>
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
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Custom Prompt</h3>
                  <Textarea
                    placeholder="Describe your stadium vision..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="cyber-input h-20 resize-none"
                  />
                </div>

                {/* Reference Upload */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Reference Image</h3>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="cyber-input flex items-center justify-center h-12 text-gray-400 hover:text-cyan-400 transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="text-sm">Upload Reference</span>
                    </div>
                  </div>
                  {customReferencePreview && (
                    <div className="mt-2">
                      <Image src={customReferencePreview} alt="Reference preview" width={100} height={50} className="w-full h-20 object-cover rounded border border-cyan-400/30" />
                    </div>
                  )}
                </div>

                {/* Style Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STADIUM_STYLE_FILTERS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setGenerationStyle(style.id)}
                        className={`style-button p-2 rounded-lg text-xs flex flex-col items-center space-y-1 transition-all ${
                          generationStyle === style.id ? 'active' : ''
                        }`}
                      >
                        <style.icon className="w-4 h-4" />
                        <span>{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Perspective Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Perspective</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STADIUM_PERSPECTIVE_FILTERS.map((persp) => (
                      <button
                        key={persp.id}
                        onClick={() => setPerspective(persp.id)}
                        className={`style-button p-2 rounded-lg text-xs flex flex-col items-center space-y-1 transition-all ${
                          perspective === persp.id ? 'active' : ''
                        }`}
                      >
                        <persp.icon className="w-4 h-4" />
                        <span>{persp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atmosphere */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Atmosphere</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {STADIUM_ATMOSPHERE_FILTERS.map((atm) => (
                      <button
                        key={atm.id}
                        onClick={() => setAtmosphere(atm.id)}
                        className={`style-button p-2 rounded-lg text-xs flex flex-col items-center space-y-1 transition-all ${
                          atmosphere === atm.id ? 'active' : ''
                        }`}
                      >
                        <atm.icon className="w-4 h-4" />
                        <span>{atm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time and Weather */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Time</h3>
                    <div className="space-y-1">
                      {STADIUM_TIME_FILTERS.map((time) => (
                        <button
                          key={time.id}
                          onClick={() => setTimeOfDay(time.id)}
                          className={`style-button w-full p-2 rounded text-xs flex items-center space-x-2 transition-all ${
                            timeOfDay === time.id ? 'active' : ''
                          }`}
                        >
                          <time.icon className="w-3 h-3" />
                          <span>{time.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">Weather</h3>
                    <div className="space-y-1">
                      {STADIUM_WEATHER_FILTERS.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setWeather(w.id)}
                          className={`style-button w-full p-2 rounded text-xs flex items-center space-x-2 transition-all ${
                            weather === w.id ? 'active' : ''
                          }`}
                        >
                          <w.icon className="w-3 h-3" />
                          <span>{w.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quality */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Quality</h3>
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
                  className="w-full cyber-button py-3 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Generate Stadium</span>
                    </div>
                  )}
                </button>

                {/* API Status */}
                <div className="pt-6 border-t border-gray-700">
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
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="gradient-border">
              <div className="gradient-border-content p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Stadium Preview</h3>
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs ${apiStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {apiStatus ? '🟢 Ready' : '🔴 Offline'}
                    </div>
                    {generatedImage && (
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-400/30 hover:bg-cyan-600/30 transition-colors text-sm flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset & Generate New</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative w-96 h-[28rem] rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)',
                    border: '2px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    
                    {isGenerating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-cyan-400 text-xl font-semibold">Generating stadium...</p>
                        <div className="mt-4 w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <span className="text-red-400 text-3xl">⚠</span>
                          </div>
                          <p className="text-red-400 mb-6 text-center text-lg">{error}</p>
                          <button 
                            onClick={() => setError('')}
                            className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {generatedImage && !isGenerating && !error && (
                      <div className="absolute inset-0 p-6">
                        <Image src={generatedImage} alt="Generated Stadium" width={1024} height={1024} className="w-full h-full object-contain rounded-lg" />
                        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 rounded-b-lg">
                          <div className="text-white">
                            <p className="font-bold text-xl">{selectedStadium !== 'custom_only' ? availableStadiums.find(s => s.id === selectedStadium)?.name : 'Custom Stadium'}</p>
                            <p className="text-cyan-400 text-sm">{generationStyle} · {perspective} · {atmosphere}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-xs text-gray-300">{timeOfDay} · {weather}</span>
                              <span className="text-xs text-gray-300">Quality: {quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!generatedImage && !isGenerating && !error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-40 h-48 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <div className="text-center">
                              <Building className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                              <p className="text-sm text-gray-400">Stadium</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-lg">Your generated stadium will appear here</p>
                          <p className="text-cyan-400/70 text-sm mt-3">Premium NFT quality rendering</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {generatedImage && (
                  <div className="mt-6 p-4 rounded-lg border border-green-400/20 bg-green-500/5">
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
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-400 mb-2">IPFS URL:</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={ipfsUrl}
                              readOnly
                              className="flex-1 bg-gray-700/50 text-gray-300 text-xs p-2 rounded border border-gray-600"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ipfsUrl)
                              }}
                              className="px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded text-xs hover:bg-cyan-600/30 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => window.open(ipfsUrl, '_blank')}
                              className="px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded text-xs hover:bg-cyan-600/30 transition-colors"
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
                )}
              </div>
            </div>

            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <h2 className="text-xl font-bold text-white mb-6">Mint NFT</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Edition Size</span>
                      <span className="text-cyan-400 font-semibold">{editionSize}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      value={editionSize}
                      onChange={(e) => setEditionSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Gas Fee</span>
                    <span className="text-white">0.02 CHZ</span>
                  </div>

                  <button 
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 border border-orange-400/30 mb-3"
                    disabled={!isConnected || isMinting}
                    onClick={handleSetClaimConditions}
                  >
                    {isMinting ? 'Processing...' : '⚙️ Admin: Set Claim Conditions'}
                  </button>

                  <div className="space-y-3">
                    {/* 🚀 ENGINE GASLESS MINT - Backend pays gas */}
                    <button 
                      className={`cyber-button w-full py-4 rounded-lg font-semibold transition-all ${
                        canMintGasless && !isMinting
                          ? 'opacity-100 cursor-pointer bg-gradient-to-r from-green-600/20 to-cyan-600/20 border-green-400/30' 
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
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Minting (Gasless)...
                        </div>
                      ) : !generatedImage ? 'Generate Stadium First' :
                        !selectedStadium ? 'Select Stadium' :
                        '🚀 Mint via Engine (Gasless)'}
                    </button>

                    {/* 🎯 LEGACY MINT - User pays gas (fallback) */}
                    <button 
                      className={`cyber-button w-full py-3 rounded-lg font-medium transition-all ${
                        canMintLegacy && !isMinting
                          ? 'opacity-100 cursor-pointer bg-gradient-to-r from-purple-600/20 to-gray-600/20 border-purple-400/30' 
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Minting (Legacy)...
                        </div>
                      ) : !isConnected ? 'Connect Wallet to Mint' :
                        !isOnSupportedChain ? 'Switch to Supported Network' :
                        !generatedImage ? 'Generate Stadium First' :
                        '🎯 Legacy Mint (User Pays Gas)'}
                    </button>
                  </div>

                  {(mintStatus !== 'idle') && (
                    <div className={`p-3 rounded-lg border ${
                      mintStatus === 'success'
                        ? 'bg-green-500/10 border-green-400/20'
                        : mintStatus === 'error'
                        ? 'bg-red-500/10 border-red-400/20'
                        : 'bg-yellow-500/10 border-yellow-400/20'
                    }`}>
                      <p className={`text-sm ${
                        mintStatus === 'success' ? 'text-green-400' : 
                        mintStatus === 'error' ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {mintStatus === 'pending' && (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Waiting for confirmation in your wallet...
                          </div>
                        )}
                        {mintStatus === 'success' && `✅ ${mintSuccess}`}
                        {mintStatus === 'error' && `❌ ${mintError}`}
                      </p>
                      {transactionHash && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Transaction Hash:</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={transactionHash}
                              readOnly
                              className="flex-1 bg-gray-700/50 text-gray-300 text-xs p-2 rounded border border-gray-600"
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(transactionHash)}
                              className="px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded text-xs hover:bg-cyan-600/30 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                                onClick={() => window.open(`https://amoy.polygonscan.com/tx/${transactionHash}`, '_blank')}
                                className="px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded text-xs hover:bg-cyan-600/30 transition-colors"
                            >
                                View
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-700">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm text-gray-300">
                          API Status: {apiStatus ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-sm text-gray-300">
                          DALL-E 3: {apiStatus ? 'Ready' : 'Offline'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Status: AI Generation Ready
                      </div>
                      
                      {generationCost && (
                        <div className="text-xs text-gray-400">
                          Last generation: ${generationCost.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Marketplace</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all"
                      onClick={() => {
                        const container = document.getElementById('marketplace-scroll-stadium');
                        if (container) container.scrollLeft -= 200;
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all"
                      onClick={() => {
                        const container = document.getElementById('marketplace-scroll-stadium');
                        if (container) container.scrollLeft += 200;
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div 
                  id="marketplace-scroll-stadium"
                  className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {MARKETPLACE_ITEMS.concat(MARKETPLACE_ITEMS).map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex-shrink-0 group cursor-pointer">
                      <div className="marketplace-card rounded-lg p-3 w-36 transition-all duration-300 hover:scale-105">
                        <div className="aspect-[4/5] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden border border-cyan-400/20">
                          {item.trending && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          )}
                          
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="text-2xl font-bold text-cyan-400/60">🏟️</div>
                            
                            <div className="absolute inset-3 border border-dashed border-cyan-400/20 rounded"></div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/10 via-transparent to-purple-400/10 rounded-lg"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 group-hover:text-cyan-400 transition-colors font-medium">
                            Stadium #{item.number}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold text-sm">{item.price}</span>
                            {item.trending && (
                              <span className="text-xs text-green-400 bg-green-400/10 px-1 py-0.5 rounded text-xs">
                                🔥
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <button className="px-4 py-2 border border-cyan-400/30 text-cyan-400 rounded-lg hover:border-cyan-400 hover:bg-cyan-400/10 transition-all text-sm">
                    View All NFTs
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