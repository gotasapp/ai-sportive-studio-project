'use client'

import React, { useState, useEffect } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check } from 'lucide-react'
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest } from '../types'
import { getTransactionUrl } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { isAdmin } from '../lib/admin-config'

// Importando os novos componentes reutilizáveis
import EditorLayout from '@/components/layouts/EditorLayout'
import EditorPanel from '@/components/editor/EditorPanel'
import PreviewPanel from '@/components/editor/PreviewPanel'
import MarketplaceCarousel from '@/components/editor/MarketplaceCarousel'
import StyleButton from './ui/StyleButton'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

// Marketplace data will be loaded from JSON
interface MarketplaceNFT {
  name: string;
  imageUrl: string; // CORRIGIDO: sem underscore para ser consistente
  description: string;
  price: string;
}

export default function JerseyEditor() {
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

  // Component state
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('JEFF')
  const [playerNumber, setPlayerNumber] = useState<string>('10')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
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

  // Marketplace state
  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNFT[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  
  // Admin check
  const isUserAdmin = isAdmin(account)
  
  // Mint conditions
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy needs wallet
  const canMintGasless = generatedImage && selectedTeam && playerName && playerNumber && isUserAdmin // Gasless only for admins

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

  // Effect to poll transaction status
  useEffect(() => {
    if (mintStatus === 'pending' && mintedTokenId) {
      const interval = setInterval(async () => {
        console.log(`🔎 Checking status for queueId: ${mintedTokenId}`);
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

  // 🎯 LEGACY MINT - Direct SDK (fallback) - THE MAIN USER FLOW
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

  const generateContent = async () => {
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
      const request = {
        model_id: selectedTeam,
        player_name: playerName,
        player_number: playerNumber,
        quality: quality,
      };
      
      console.log('Generating image with request data:', request)
      const result = await Dalle3Service.generateImage(request)
      console.log('DALL-E 3 Result:', result)
      
      if (result.success && result.image_base64) {
        setGeneratedImage(`data:image/png;base64,${result.image_base64}`);
        
        const response = await fetch(`data:image/png;base64,${result.image_base64}`)
        const blob = await response.blob()
        setGeneratedImageBlob(blob); // ⚠️ LINHA IMPORTANTE: salvar o blob no state

        // Chamar a função isolada para salvar no banco
        await saveJerseyToDB({
          name: `${selectedTeam} ${playerName} #${playerNumber}`,
          prompt: JSON.stringify(request),
          imageUrl: `data:image/png;base64,${result.image_base64}`,
          creatorWallet: address || "N/A",
          tags: [selectedTeam, selectedStyle],
        }, blob);

      } else {
        throw new Error(result.error || 'Image generation failed, no image data returned from API.')
      }
    } catch (err: any) {
      console.error('Generation failed:', err)
      setError(err.message || 'An unexpected error occurred.')
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

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await Dalle3Service.getAvailableTeams();
        if (teams.length > 0) {
          setAvailableTeams(teams);
          setSelectedTeam(teams[0] || '');
        }
      } catch (err: any) {
        console.error('Error loading teams:', err);
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
      
      // FALLBACK INSTANTÂNEO - Suas imagens reais de NFTs
      const fallbackData = [
        { name: 'Jersey Collection #1', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeiduwpvjbr3f7pkcmgztstb34ru3ogyghpz4ph2yryoovkb2u5romq_dmdv5q.png', price: '0.05 CHZ' },
        { name: 'Jersey Collection #2', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1750636634/bafybeigp26rpbhumy7ijx7uaoe5gdraun6xusrz7ma2nwoyxwg5qirz54q_vxs13v.png', price: '0.05 CHZ' },
        { name: 'Camp Nou Stadium', imageUrl: 'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751638622/jerseys/stadium_camp_nou_realistic_1751638577656.png', price: '0.15 CHZ' },
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
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(jersey => ({
            name: jersey.name,
            imageUrl: jersey.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: jersey.description || 'AI-generated jersey',
            price: '0.05 CHZ',
            category: 'jersey',
            createdAt: jersey.createdAt
          }));

        // Top 2 Stadiums mais recentes
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

        // Top 1 Badge mais recente
        const topBadges = badges
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1)
          .map(badge => ({
            name: badge.name,
            imageUrl: badge.imageUrl, // CORRIGIDO: MarketplaceCarousel espera imageUrl (sem underscore)
            description: badge.description || 'AI-generated badge',
            price: '0.03 CHZ',
            category: 'badge',
            createdAt: badge.createdAt
          }));

        // Combinar e ordenar por data de criação (mais recentes primeiro)
        const allTopCollections = [...topJerseys, ...topStadiums, ...topBadges]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6); // Limitar a 6 itens no carrossel

        console.log('✅ Top Collections compiled:', allTopCollections);
        if (allTopCollections.length > 0) {
          setMarketplaceNFTs(allTopCollections);
        }
        // Se APIs falharem, mantém fallback

      } catch (error) {
        console.error('❌ Error loading top collections data:', error);
        console.log('🔄 Keeping fallback NFT data due to API error');
        // Mantém fallback com suas imagens reais
      }
    };

    loadTopCollectionsData();
  }, []);

  const renderControls = () => (
    <>
      <EditorPanel title="1. Select Style">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {STYLE_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setSelectedStyle(filter.id)}
              isActive={selectedStyle === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-2" />
              {filter.label}
            </StyleButton>
          ))}
        </div>
      </EditorPanel>
      <EditorPanel title="2. Custom Jersey">
        <div className="space-y-4">
          <div className="space-y-4 mb-6">
            <label className="text-sm font-medium text-gray-300">Team</label>
            <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="cyber-input w-full px-4 py-3 rounded-lg bg-black text-white">
              <option value="" className="bg-black text-white">Select Team</option>
              {availableTeams.map((team) => <option key={team} value={team} className="bg-black text-white">{team}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Player Name</label>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="cyber-input w-full px-4 py-3 rounded-lg bg-black text-white" placeholder="JEFF" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Number</label>
              <input type="text" value={playerNumber} onChange={(e) => setPlayerNumber(e.target.value)} className="cyber-input w-full px-4 py-3 rounded-lg bg-black text-white" placeholder="10" />
            </div>
          </div>
          <button onClick={generateContent} disabled={isLoading || !selectedTeam} className="cyber-button w-full py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Generating...' : 'Generate Jersey'}
          </button>
        </div>
      </EditorPanel>
      <EditorPanel title="Mint NFT">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Edition Size</span>
            <span className="text-cyan-400 font-semibold">{editionSize}</span>
          </div>
          <input type="range" min="1" max="1000" value={editionSize} onChange={(e) => setEditionSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider" />
        </div>
        <div className="space-y-3 mt-4">
          {isUserAdmin && (
            <button 
              className={`cyber-button w-full py-4 rounded-lg font-semibold transition-all ${canMintGasless && !isMinting ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              disabled={!canMintGasless || isMinting} onClick={handleEngineNormalMint}>
              {isMinting && mintStatus === 'pending' ? 'Minting (Gasless)...' : '🚀 Mint via Engine (Gasless)'}
            </button>
          )}
          <button 
            className={`cyber-button w-full py-4 rounded-lg font-semibold transition-all ${canMintLegacy && !isMinting ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            disabled={!canMintLegacy || isMinting} onClick={handleMintNFT}>
            {isMinting && mintStatus === 'pending' ? 'Minting...' : !isConnected ? 'Connect Wallet' : !isOnSupportedChain ? 'Switch Network' : 'Mint'}
          </button>
        </div>
        {(mintStatus !== 'idle') && (
          <div className={`mt-4 p-3 rounded-lg border ${mintStatus === 'success' ? 'bg-green-500/10' : mintStatus === 'error' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
            <p className={`text-sm ${mintStatus === 'success' ? 'text-green-400' : mintStatus === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
              {mintStatus === 'pending' && 'Waiting for confirmation...'}
              {mintStatus === 'success' && `✅ ${mintSuccess}`}
              {mintStatus === 'error' && `❌ ${mintError}`}
            </p>
            {transactionHash && (
              <a href={getTransactionUrl(transactionHash)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline mt-2 block truncate">
                View on Explorer: {transactionHash}
              </a>
            )}
          </div>
        )}
      </EditorPanel>
    </>
  );

  return (
    <EditorLayout
      controls={renderControls()}
      preview={<PreviewPanel generatedImage={generatedImage} isLoading={isLoading} error={error} onResetError={resetError} />}
      marketplace={<MarketplaceCarousel items={marketplaceNFTs.map(nft => ({ name: nft.name, imageUrl: nft.imageUrl, price: nft.price }))} isLoading={marketplaceLoading} />}
    />
  )
} 