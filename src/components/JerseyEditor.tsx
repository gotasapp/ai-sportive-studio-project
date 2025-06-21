'use client'

import React, { useState, useEffect } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check } from 'lucide-react'
import { useActiveAccount, useActiveWallet, useActiveWalletChain } from 'thirdweb/react'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest } from '../types'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

const MARKETPLACE_ITEMS = [
  { id: 1, number: '10', price: '0.5 ETH', trending: true },
  { id: 2, number: '23', price: '0.3 ETH', trending: false },
  { id: 3, number: '07', price: '0.8 ETH', trending: true },
  { id: 4, number: '11', price: '0.4 ETH', trending: false },
  { id: 5, number: '99', price: '1.2 ETH', trending: true },
  { id: 6, number: '88', price: '0.6 ETH', trending: false }
]

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

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  const isOnChzChain = chainId === 88888 || chainId === 88882 // CHZ mainnet or testnet
  const isOnPolygonChain = chainId === 137 || chainId === 80002 // Polygon mainnet or Amoy testnet
  
  // Mint conditions
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy precisa wallet
  const canMintGasless = generatedImage && selectedTeam && playerName && playerNumber // Gasless só precisa dados

  // Upload para IPFS
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
      const name = `${selectedTeam} ${playerName} #${playerNumber}`
      const description = `AI-generated ${selectedTeam} jersey for ${playerName} #${playerNumber}. Style: ${selectedStyle}.`

      const result = await IPFSService.uploadComplete(
        generatedImageBlob,
        name,
        description,
        selectedTeam,
        selectedStyle,
        playerName,
        playerNumber
      )

      setIpfsUrl(result.imageUrl)
      console.log('🎉 Upload completo:', result)
      
    } catch (error: any) {
      console.error('❌ IPFS upload failed:', error)
      setIpfsError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploadingToIPFS(false)
    }
  }

  // Função para configurar Claim Conditions (Admin)
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
      
      const attributes = [
        { trait_type: 'Team', value: selectedTeam },
        { trait_type: 'Player Name', value: playerName },
        { trait_type: 'Player Number', value: playerNumber },
        { trait_type: 'Style', value: selectedStyle },
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

      console.log('✅ ENGINE MINT (GASLESS): Mint iniciado com sucesso:', result);
      setMintStatus('pending');
      setMintSuccess(`Transação enviada! Verificando status... Queue ID: ${result.queueId}`);
      setMintedTokenId(result.queueId);
      
    } catch (error: any) {
      console.error('❌ ENGINE MINT (GASLESS): Falha no mint:', error)
      setMintError(error instanceof Error ? error.message : 'Falha no Engine Mint (Gasless)')
      setMintStatus('error');
      
      setTimeout(() => {
        setMintError(null);
        setMintStatus('idle');
      }, 10000)
    } finally {
      setIsMinting(false)
    }
  }

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
                setMintSuccess('NFT criado com sucesso na blockchain!');
                setTransactionHash(finalTxHash);
                clearInterval(interval);
            } else if (status === 'errored' || status === 'cancelled') {
                setMintStatus('error');
                setMintError(`Falha na transação: ${errorMessage || 'Erro desconhecido'}`);
                clearInterval(interval);
            }
        } else if (statusResult.error) {
            setMintStatus('error');
            setMintError(`Erro ao verificar status: ${statusResult.error}`);
            clearInterval(interval);
        }

      }, 3000);

      return () => clearInterval(interval);
    }
  }, [mintStatus, mintedTokenId, getTransactionStatus]);

  // 🎯 LEGACY MINT - Direct SDK (fallback) - O FLUXO PRINCIPAL DO USUÁRIO
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

  const generateContent = async () => {
    if (!selectedTeam) {
      setError('Please select a team')
      return
    }

    if (!playerName || !playerNumber) {
      setError('Preencha o nome e número do jogador')
      return
    }

    if (isConnected && !isOnSupportedChain) {
      setError('Please switch to a supported network (CHZ or Polygon)')
      return
    }

    setIsLoading(true)
    setError(null)
    setGenerationCost(null)

    let model_id = `${selectedTeam.toLowerCase()}_${selectedStyle}`;
    if (selectedTeam === 'Flamengo' && selectedStyle === 'retro') {
      model_id = 'flamengo_1981';
    } else if (selectedTeam === 'Corinthians' && selectedStyle === 'retro') {
      model_id = 'corinthians_2022';
    }

    try {
      const request: ImageGenerationRequest = {
        model_id: `${selectedTeam.toLowerCase()}_${selectedStyle}`,
        player_name: playerName,
        player_number: playerNumber,
        quality: quality
      };

      const result = await Dalle3Service.generateImage(request);

      if (result.success && result.image_base64) {
        const imageUrl = Dalle3Service.base64ToImageUrl(result.image_base64);
        setGeneratedImage(imageUrl);
        setGenerationCost(result.cost_usd || null);
        
        const base64Data = result.image_base64.replace(/^data:image\/[a-z]+;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        setGeneratedImageBlob(blob);
      } else {
        setError(result.error || 'Unknown error during generation');
      }
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError('Error connecting to the API. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setSelectedTeam('');
    setPlayerName('');
    setPlayerNumber('');
    setGeneratedImage(null);
    setGeneratedImageBlob(null);
    setError(null);
    setGenerationCost(null);
  };

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await Dalle3Service.getAvailableTeams();
        if (teams.length > 0) {
          setAvailableTeams(teams);
          setSelectedTeam(teams[0]);
        } else {
          const defaultTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo'];
          setAvailableTeams(defaultTeams);
          setSelectedTeam(defaultTeams[0]);
        }
      } catch (err: any) {
        console.error('Erro ao carregar times:', err);
        const defaultTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo'];
        setAvailableTeams(defaultTeams);
        setSelectedTeam(defaultTeams[0]);
      }
    };

    const checkApiStatus = async () => {
      try {
        const status = await Dalle3Service.checkHealth();
        setApiStatus(status);
      } catch (err: any) {
        console.error('Erro ao verificar status da API:', err);
        setApiStatus(false);
      }
    };

    loadTeams();
    checkApiStatus();
  }, []);

  return (
    <div className="min-h-screen" style={{
      background: '#000518',
      backgroundImage: `
        radial-gradient(ellipse at top left, #000720 0%, transparent 40%),
        radial-gradient(ellipse at top right, #000924 0%, transparent 40%),
        radial-gradient(ellipse at bottom left, #000720 0%, transparent 40%),
        radial-gradient(ellipse at bottom right, #000A29 0%, transparent 40%),
        radial-gradient(ellipse at center, #00081D 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.03) 0%, transparent 50%)
      `
    }}>
      
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <h2 className="text-xl font-bold text-white mb-6">AI Generation</h2>
                
                <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-8 mb-6 text-center cyber-card">
                  <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Upload image or enter text</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="file-upload"
                    accept="image/*"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Choose file
                  </label>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_FILTERS.map((style) => {
                      const IconComponent = style.icon;
                      return (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`style-button ${selectedStyle === style.id ? 'active' : ''} px-4 py-3 rounded-lg flex items-center space-x-2 transition-all`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm font-medium">{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <label className="text-sm font-medium text-gray-300">Team</label>
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="cyber-input w-full px-4 py-3 rounded-lg"
                  >
                    <option value="">Select Team</option>
                    {availableTeams.map((team) => (
                      <option key={team} value={team} className="bg-gray-800">
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Player Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="cyber-input w-full px-4 py-3 rounded-lg"
                      placeholder="JEFF"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Number</label>
                    <input
                      type="text"
                      value={playerNumber}
                      onChange={(e) => setPlayerNumber(e.target.value)}
                      className="cyber-input w-full px-4 py-3 rounded-lg"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Royalties</span>
                    <span className="text-cyan-400 font-semibold">{royalties}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={royalties}
                    onChange={(e) => setRoyalties(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Gas fee</span>
                    <span className="text-white">0.22</span>
                  </div>
                </div>

                <button
                  onClick={generateContent}
                  disabled={isLoading || !selectedTeam}
                  className="cyber-button w-full py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate Jersey'}
                </button>
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
                      ) : !generatedImage ? 'Generate Jersey First' :
                        !selectedTeam || !playerName || !playerNumber ? 'Complete Jersey Details' :
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
                        !generatedImage ? 'Generate Jersey First' :
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
                            Aguardando confirmação na sua wallet...
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
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="gradient-border">
              <div className="gradient-border-content p-8">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Jersey Preview</h3>
                
                <div className="mb-6 p-4 rounded-lg border border-cyan-400/20 bg-slate-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white flex items-center">
                      <Wallet className="w-4 h-4 mr-2" />
                      Web3 Status
                    </h4>
                    {!isConnected && (
                      <button
                        onClick={() => alert('Please connect your wallet using the button in the header')}
                        className="px-3 py-1 text-xs bg-cyan-600/20 text-cyan-400 rounded-md border border-cyan-400/30 hover:bg-cyan-600/30 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Wallet</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-300">
                          {isConnected ? address?.slice(0, 6) + '...' + address?.slice(-4) : 'Not connected'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Network</span>
                      <div className="flex items-center space-x-2">
                        {isConnected ? (
                          <>
                            <div className={`w-2 h-2 rounded-full ${isOnSupportedChain ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs text-gray-300">
                              {chain?.name || 'Unknown'}
                            </span>
                            {!isOnSupportedChain && (
                              <button
                                onClick={() => alert('Please switch network using your wallet')}
                                className="px-2 py-0.5 text-xs bg-yellow-600/20 text-yellow-400 rounded border border-yellow-400/30 hover:bg-yellow-600/30 transition-colors"
                              >
                                Switch Network
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <span className="text-xs text-gray-300">Connect wallet first</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Gasless Mint</span>
                      <div className="flex items-center space-x-2">
                        {canMintGasless ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">Ready</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400">
                              {!generatedImage ? 'Generate jersey' : 
                               !selectedTeam || !playerName || !playerNumber ? 'Complete details' : 'Not ready'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Legacy Mint</span>
                      <div className="flex items-center space-x-2">
                        {canMintLegacy ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">Ready</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400">
                              {!isConnected ? 'Connect wallet' : 
                               !isOnSupportedChain ? 'Switch network' : 
                               !generatedImage ? 'Generate jersey' : 'Not ready'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative w-96 h-[28rem] rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)',
                    border: '2px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    
                    {isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-cyan-400 text-xl font-semibold">Generating your jersey...</p>
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
                            onClick={() => setError(null)}
                            className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {generatedImage && !isLoading && !error && (
                      <div className="absolute inset-0 p-6">
                        <img 
                          src={generatedImage} 
                          alt="Generated Jersey" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 rounded-b-lg">
                          <div className="text-white">
                            <p className="font-bold text-2xl">{playerName} #{playerNumber}</p>
                            <p className="text-cyan-400 text-lg">{selectedTeam}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-sm text-gray-300">Style: {selectedStyle}</span>
                              <span className="text-sm text-gray-300">Quality: {quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!generatedImage && !isLoading && !error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-40 h-48 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                              <p className="text-sm text-gray-400">Jersey</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-lg">Your generated jersey will appear here</p>
                          <p className="text-cyan-400/70 text-sm mt-3">Perfect NFT proportions (4:5 ratio)</p>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Marketplace</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all"
                      onClick={() => {
                        const container = document.getElementById('marketplace-scroll');
                        if (container) container.scrollLeft -= 200;
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all"
                      onClick={() => {
                        const container = document.getElementById('marketplace-scroll');
                        if (container) container.scrollLeft += 200;
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div 
                  id="marketplace-scroll"
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
                            <div className="text-4xl font-bold text-cyan-400/60">{item.number}</div>
                            
                            <div className="absolute inset-3 border border-dashed border-cyan-400/20 rounded"></div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/10 via-transparent to-purple-400/10 rounded-lg"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 group-hover:text-cyan-400 transition-colors font-medium">
                            Jersey #{item.number}
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