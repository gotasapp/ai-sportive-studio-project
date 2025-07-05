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
  imageUrl: string; // CORRIGIDO: sem underscore para ser consistente
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
  
  // Save to DB state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Marketplace state
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  
  // ===== VISION ANALYSIS STATES =====
  const [isVisionMode, setIsVisionMode] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageBlob, setReferenceImageBlob] = useState<Blob | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  // Vision model fixed to default (admin can change in settings)
  const selectedVisionModel = 'openai/gpt-4o-mini'
  const [selectedView, setSelectedView] = useState('external')
  
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

  // Load top collections data
  useEffect(() => {
    const loadTopCollectionsData = async () => {
      // FALLBACK INSTANTÂNEO - Suas imagens reais de NFTs (prioridade stadiums)
      const fallbackData = [
        { name: 'Camp Nou Stadium', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751638622/jerseys/stadium_camp_nou_realistic_1751638577656.png', price: '0.15 CHZ' },
        { name: 'Jersey Collection #1', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png', price: '0.05 CHZ' },
        { name: 'Corinthians Champion Badge', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751644118/jerseys/badge_Corinthians_CHAMPION_1_1751644096784.png', price: '0.03 CHZ' },
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

        // Verificar se todas as respostas foram bem-sucedidas
        if (!jerseysResponse.ok || !stadiumsResponse.ok || !badgesResponse.ok) {
          throw new Error(`API Error: Jerseys(${jerseysResponse.status}), Stadiums(${stadiumsResponse.status}), Badges(${badgesResponse.status})`);
        }

        // Processar dados reais
        const jerseys = await jerseysResponse.json();
        const stadiums = await stadiumsResponse.json();
        const badges = await badgesResponse.json();

        console.log('📊 Raw API data for stadiums:', { jerseys: jerseys.length, stadiums: stadiums.length, badges: badges.length });

        // Implementar lógica de "Top Collections" com foco em stadiums
        // Top 2 Stadiums mais recentes (prioridade para página de stadiums)
        const topStadiums = stadiums
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map(stadium => ({
            name: stadium.name,
            imageUrl: stadium.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: stadium.description || 'AI-generated stadium',
            price: '0.15 CHZ',
            category: 'stadium',
            createdAt: stadium.createdAt
          }));

        // Top 2 Jerseys mais recentes
        const topJerseys = jerseys
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map(jersey => ({
            name: jersey.name,
            imageUrl: jersey.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: jersey.description || 'AI-generated jersey',
            price: '0.05 CHZ',
            category: 'jersey',
            createdAt: jersey.createdAt
          }));

        // Top 2 Badges mais recentes
        const topBadges = badges
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .map(badge => ({
            name: badge.name,
            imageUrl: badge.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
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
        .sort((a, b) => {
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
        // Se APIs falharem, mantém fallback

      } catch (error) {
        console.error('❌ Error loading top collections data for stadiums:', error);
        console.log('🔄 Keeping fallback NFT data due to API error');
        // Mantém fallback com suas imagens reais
      }
    };

    loadTopCollectionsData();
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

  // ===== VISION ANALYSIS FUNCTIONS =====
  
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
    setAnalysisResult(null)
    setIsVisionMode(false)
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
    setIsGenerating(true);
    setError('');
    setGeneratedImage('');
    setResult(null);

    try {
      // ===== DUAL SYSTEM DETECTION (Using Same Flow as JerseyEditor) =====
      if (isVisionMode && referenceImageBlob) {
        console.log('👁️ [VISION GENERATION] Using complete vision flow (same as jerseys)...')
        
        // **ANÁLISE AUTOMÁTICA TRANSPARENTE** - Sempre analisar se não há resultado
        if (!analysisResult) {
          console.log('🔍 [VISION ANALYSIS] Starting automatic stadium reference analysis...')
          
          try {
            setIsAnalyzing(true)
            
            // Convert blob to base64
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                const base64String = result.split(',')[1]
                resolve(base64String)
              }
              reader.readAsDataURL(referenceImageBlob)
            })

            // STEP 1: Get structured ANALYSIS PROMPT from API (same as jersey)
            console.log('📋 [VISION ANALYSIS] Step 1: Getting structured analysis prompt...')
            const analysisPromptResponse = await fetch('/api/vision-prompts/analysis', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sport: 'stadium',
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
              view: selectedView,
              promptLength: structuredAnalysisPrompt.length
            })

            // STEP 2: Call vision API with structured prompt (same as jersey)
            console.log('👁️ [VISION ANALYSIS] Step 2: Sending to Vision API for analysis...')
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

            const visionResult = await visionResponse.json()
            
            if (!visionResult.success) {
              throw new Error(visionResult.error || 'Vision analysis failed')
            }

            console.log('✅ [VISION ANALYSIS] Analysis completed successfully:', {
              model: visionResult.model_used,
              cost: visionResult.cost_estimate,
              analysisLength: visionResult.analysis?.length || 0
            })

            // Try to parse as JSON if possible, otherwise keep as string
            let parsedAnalysis = visionResult.analysis
            try {
              parsedAnalysis = JSON.parse(visionResult.analysis)
              console.log('✅ [VISION ANALYSIS] Successfully parsed JSON analysis')
            } catch {
              console.log('ℹ️ [VISION ANALYSIS] Analysis is text format (not JSON)')
            }

            setAnalysisResult(parsedAnalysis)
            
          } catch (error: any) {
            console.error('❌ [VISION ANALYSIS] Error:', error)
            setError(error.message || 'Failed to analyze stadium reference image')
            return
          } finally {
            setIsAnalyzing(false)
          }
        }
        
        // **GERAÇÃO COM VISION** (same pattern as jersey)
        console.log('🎨 [VISION GENERATION] Step 3: Getting base prompt and generating...')
        
        // Get base prompt from API
        const basePromptResponse = await fetch('/api/vision-prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sport: 'stadium',
            view: selectedView,
            style: generationStyle,
            qualityLevel: 'advanced'
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
        
        // Combine analysis with base prompt
        const analysisText = typeof analysisResult === 'string' 
          ? analysisResult 
          : JSON.stringify(analysisResult, null, 2)
          
        const finalCombinedPrompt = `${basePrompt}\n\nANALYSIS CONTEXT:\n${analysisText}\n\nSTADIUM PARAMETERS: Style=${generationStyle}, Perspective=${perspective}, Atmosphere=${atmosphere}, Time=${timeOfDay}, Weather=${weather}`

        console.log('🎨 [VISION GENERATION] Combined prompt ready:', {
          baseLength: basePrompt.length,
          analysisLength: analysisText.length,
          finalLength: finalCombinedPrompt.length
        })

        // Generate image using vision-generate API (same as jersey)
        console.log('🖼️ [VISION GENERATION] Generating image with DALL-E 3...')
        const visionGenerateResponse = await fetch('/api/vision-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: finalCombinedPrompt,
            quality: quality
          }),
        })

        if (!visionGenerateResponse.ok) {
          throw new Error(`Vision generation failed: ${visionGenerateResponse.status}`)
        }

        const visionGenerateResult = await visionGenerateResponse.json()
        
        if (!visionGenerateResult.success) {
          throw new Error(visionGenerateResult.error || 'Vision image generation failed')
        }

        console.log('✅ [VISION GENERATION] Image generated successfully:', {
          cost: visionGenerateResult.cost_usd,
          imageSize: visionGenerateResult.image_base64?.length || 0
        })

        setGeneratedImage(`data:image/png;base64,${visionGenerateResult.image_base64}`)
        
        const response = await fetch(`data:image/png;base64,${visionGenerateResult.image_base64}`)
        const blob = await response.blob()
        setGeneratedImageBlob(blob)

        // Save to DB with complete vision metadata (same as jersey)
        await saveStadiumToDB({
          name: `Stadium (Vision) - ${generationStyle}`,
          prompt: finalCombinedPrompt,
          imageUrl: `data:image/png;base64,${visionGenerateResult.image_base64}`,
          creatorWallet: address || "N/A",
          tags: [generationStyle, 'vision-generated', selectedView, atmosphere, timeOfDay],
          metadata: {
            generationMode: 'vision_enhanced',
            hasReferenceImage: true,
            analysisUsed: !!analysisResult,
            stadium_type: selectedView,
            visionModel: selectedVisionModel,
            qualityLevel: 'advanced',
            costUsd: visionGenerateResult.cost_usd,
            generation_params: {
              style: generationStyle,
              perspective,
              atmosphere,
              time_of_day: timeOfDay,
              weather
            }
          }
        }, blob)

        console.log('🎉 [VISION GENERATION] Complete stadium vision flow completed successfully!')
        return
      }
      
      // ===== STANDARD GENERATION (FALLBACK) =====
      if (!selectedStadium && !customPrompt) {
        setError('Select a stadium or enter a custom prompt');
        return;
      }

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
        
        const blob = await (await fetch(`data:image/png;base64,${response.generated_image_base64}`)).blob();
        setGeneratedImageBlob(blob); // RESTAURAR ESTA LINHA CRUCIAL

        // Construir o objeto de parâmetros, assim como na Jersey
        const stadiumParams = {
          stadium_id: selectedStadium,
          reference_type: referenceType,
          generation_style: generationStyle,
          perspective,
          atmosphere,
          time_of_day: timeOfDay,
          weather,
          quality,
          custom_prompt: customPrompt,
          final_prompt_used: response.prompt_used // Guardamos o prompt final também
        };

        // Chamar a função para salvar no banco com o objeto de parâmetros stringificado
        console.log('🎯 About to call saveStadiumToDB with blob size:', blob?.size);
        await saveStadiumToDB({
          name: selectedStadium !== 'custom_only' 
            ? `${availableStadiums.find(s => s.id === selectedStadium)?.name || 'Custom'} Stadium` 
            : `Custom Stadium`,
          prompt: JSON.stringify(stadiumParams), // CORREÇÃO: Enviar parâmetros como JSON stringificado
          creatorWallet: address || "N/A",
          tags: [selectedStadium === 'custom_only' ? 'Custom' : selectedStadium, generationStyle, atmosphere, timeOfDay],
        }, blob);
        console.log('✅ saveStadiumToDB completed successfully');

      } else {
        console.error('❌ Stadium generation failed:', response.error);
        setError(response.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('Failed to generate stadium');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStadiumToDB = async (stadiumData: any, imageBlob: Blob) => {
    console.log('🏟️ saveStadiumToDB called with:', { stadiumData, imageBlobSize: imageBlob?.size });
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    try {
      console.log('🏟️ Saving stadium to database...');
      
      // 1. Primeiro, fazer upload da imagem para Cloudinary via nossa API
      console.log('📤 Uploading image to Cloudinary...');
      if (!imageBlob) {
        throw new Error('No image blob available for upload');
      }

      const formData = new FormData();
      formData.append('file', imageBlob, `${stadiumData.name}.png`);
      formData.append('fileName', `stadium_${selectedStadium}_${generationStyle}_${Date.now()}`);
      
      console.log('📤 Making upload request to /api/upload...');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📤 Upload response status:', uploadResponse.status, uploadResponse.statusText);

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text();
        console.error('❌ Upload failed with response:', uploadError);
        throw new Error('Failed to upload image to Cloudinary');
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Image uploaded to Cloudinary:', uploadResult.url);

      // 2. Agora salvar no banco com a URL do Cloudinary (não o base64)
      const stadiumDataWithCloudinaryUrl = {
        ...stadiumData,
        imageUrl: uploadResult.url, // URL do Cloudinary
        cloudinaryPublicId: uploadResult.publicId, // Para deletar depois se necessário
      };

      console.log('💾 Final payload to be sent to /api/stadiums:', JSON.stringify(stadiumDataWithCloudinaryUrl, null, 2));

      console.log('📤 Making save request to /api/stadiums...');
      const response = await fetch('/api/stadiums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stadiumDataWithCloudinaryUrl),
      });

      console.log('📤 Save response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Save failed with response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || 'Failed to save stadium to database');
      }

      const result = await response.json();
      console.log('✅ Stadium saved to DB:', result);
      setSaveSuccess(`Stadium saved successfully! DB ID: ${result.stadiumId}`);
      
    } catch (error: any) {
      console.error('❌ Error saving stadium to DB:', error);
      setSaveError(`Image generated, but failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
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
    
    // Reset Vision states
    setReferenceImage(null);
    setReferenceImageBlob(null);
    setAnalysisResult(null);
    setIsVisionMode(false);
    setIsAnalyzing(false);
    
    if (availableStadiums.length > 0) {
      setSelectedStadium(availableStadiums[0].id);
    } else {
      setSelectedStadium('custom_only');
    }
  };

  const renderControls = () => (
    <>
      <EditorPanel title="1. Stadium Reference">
        <div className="space-y-4">
          {/* Vision Reference Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Upload Stadium Reference</label>
            
            {!referenceImage ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors cursor-pointer"
                   onClick={() => document.getElementById('stadium-vision-upload')?.click()}>
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">Click to upload stadium image</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP up to 10MB</p>
              </div>
            ) : (
              <div className="relative">
                <img src={referenceImage} alt="Stadium Reference" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={clearVisionImage} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700">
                  <span className="w-4 h-4 block text-xs leading-none">✕</span>
                </button>
              </div>
            )}
            
            <input
              id="stadium-vision-upload"
              type="file"
              accept="image/*"
              onChange={handleVisionFileUpload}
              className="hidden"
            />
          </div>

          {/* Stadium Selector - Disabled in Vision Mode */}
          <div className="space-y-4 mb-6">
            <label className="text-sm font-medium text-gray-300">Stadium Template</label>
            <select 
              value={selectedStadium} 
              onChange={(e) => setSelectedStadium(e.target.value)} 
              disabled={isVisionMode}
              className={`cyber-input w-full px-4 py-3 rounded-lg bg-black text-white ${
                isVisionMode ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="custom_only" className="bg-black text-white">
                {isVisionMode ? 'Template disabled (Vision Mode)' : 'No Template (Custom)'}
              </option>
              {availableStadiums.map((stadium) => (
                <option key={stadium.id} value={stadium.id} className="bg-black text-white">
                  {stadium.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Selection for Vision Mode */}
          {isVisionMode && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setSelectedView('external')}
                className={`p-3 rounded-lg border transition-all ${
                  selectedView === 'external'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300'
                }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">External</span>
              </button>
              <button
                onClick={() => setSelectedView('internal')}
                className={`p-3 rounded-lg border transition-all ${
                  selectedView === 'internal'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Internal</span>
              </button>
            </div>
          )}

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
            <button onClick={generateStadium} disabled={isGenerating || (!isVisionMode && !selectedStadium && !customPrompt)} className="cyber-button w-full py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  {isVisionMode ? (
                    isAnalyzing ? 
                      'Analyzing...' : 
                      'Generating...'
                  ) : (
                    'Generating...'
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Generate
                </div>
              )}
            </button>
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
      marketplace={<MarketplaceCarousel items={marketplaceNFTs.map(nft => ({ name: nft.name, imageUrl: nft.imageUrl, price: nft.price }))} isLoading={marketplaceLoading} />}
    />
  )
} 