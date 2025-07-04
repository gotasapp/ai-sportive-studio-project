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

interface MarketplaceNFT {
  name: string;
  image_url: string;
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

  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [badgeName, setBadgeName] = useState<string>('CHAMPION')
  const [badgeNumber, setBadgeNumber] = useState<string>('1')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editionSize, setEditionSize] = useState<number>(100)
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null)
  
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
  const canMintGasless = generatedImage && selectedTeam && badgeName && badgeNumber && isUserAdmin

  const handleEngineNormalMint = async () => {
    if (!canMintGasless || !generatedImageBlob || !address) {
        setMintError('Missing required data for minting');
        return;
    }

    setIsMinting(true);
    setMintError(null);
    setMintStatus('pending');

    try {
        const nftName = `${selectedTeam} Badge ${badgeName} #${badgeNumber}`;
        const nftDescription = `AI-generated ${selectedTeam} badge. Style: ${selectedStyle}.`;

        const ipfsResult = await IPFSService.uploadComplete(
            generatedImageBlob,
            nftName,
            nftDescription,
            selectedTeam,
            selectedStyle,
            badgeName,
            badgeNumber
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
        const nftName = `${selectedTeam} Badge ${badgeName} #${badgeNumber}`;
        const nftDescription = `AI-generated ${selectedTeam} badge. Style: ${selectedStyle}.`;
        const imageFile = new File([generatedImageBlob], `${nftName}.png`, { type: 'image/png' });
        const attributes = [
          { trait_type: 'Team', value: selectedTeam },
          { trait_type: 'Name', value: badgeName },
          { trait_type: 'Number', value: badgeNumber },
          { trait_type: 'Style', value: selectedStyle },
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
    if (!selectedTeam) {
      setError('Please select a team')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const prompt = `official e-sports team badge, team name ${selectedTeam}, ${selectedStyle} style, champion badge, name ${badgeName}, number ${badgeNumber}`;
      const request: ImageGenerationRequest = { prompt, quality };
      const result = await Dalle3Service.generateImage(request);

      if (result.success && result.image_base64) {
        setGeneratedImage(`data:image/png;base64,${result.image_base64}`);
        
        const response = await fetch(`data:image/png;base64,${result.image_base64}`)
        const blob = await response.blob()
        setGeneratedImageBlob(blob);

        // Chamar a função para salvar no banco
        await saveBadgeToDB({
          name: `${selectedTeam} Badge ${badgeName} #${badgeNumber}`,
          prompt: prompt,
          creatorWallet: address || "N/A",
          tags: [selectedTeam, selectedStyle, badgeName, badgeNumber],
        }, blob);

      } else {
        setError('Failed to generate image.');
      }
    } catch (err: any) {
      setError(err.message || 'Image generation failed');
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
      
      // 1. Primeiro, fazer upload da imagem para Cloudinary via nossa API
      console.log('📤 Uploading image to Cloudinary...');
      if (!imageBlob) {
        throw new Error('No image blob available for upload');
      }

      const formData = new FormData();
      formData.append('file', imageBlob, `${badgeData.name}.png`);
      formData.append('fileName', `badge_${selectedTeam}_${badgeName}_${badgeNumber}_${Date.now()}`);
      
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
      const badgeDataWithCloudinaryUrl = {
        ...badgeData,
        imageUrl: uploadResult.url, // URL do Cloudinary
        cloudinaryPublicId: uploadResult.publicId, // Para deletar depois se necessário
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        
        // CORREÇÃO: Verifica se 'data' é um array antes de usá-lo.
        if (Array.isArray(data)) {
          setAvailableTeams(data);
          if (data.length > 0) {
            setSelectedTeam(data[0]);
          }
        } else {
            // Se não for um array, registra um erro e usa um array vazio.
            console.error('Failed to load teams: API did not return an array.', data);
            setAvailableTeams([]);
        }

      } catch (error) {
        console.error('Failed to load teams:', error);
        setAvailableTeams([]); // Garante que o estado não fique indefinido
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadMarketplaceData = async () => {
      setMarketplaceLoading(true);
      try {
        const response = await fetch('/marketplace-images.json');
        const data = await response.json();
        setMarketplaceNFTs(data.marketplace_nfts.badges || []);
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setMarketplaceLoading(false);
      }
    };
    loadMarketplaceData();
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
      <EditorPanel title="2. Custom Badge">
        <div className="space-y-4">
            <div className="space-y-4 mb-6">
              <label className="text-sm font-medium text-gray-300">Team</label>
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="cyber-input w-full px-4 py-3 rounded-lg bg-black text-white">
                <option value="" disabled>Select Team</option>
                {availableTeams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Badge Name</label>
                <input type="text" value={badgeName} onChange={(e) => setBadgeName(e.target.value)} className="cyber-input w-full px-4 py-3 rounded-lg bg-black text-white" placeholder="CHAMPION" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Number</label>
                <input type="text" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} className="cyber-input w-full px-4 py-3 rounded-lg bg-black text-white" placeholder="1" />
              </div>
            </div>
            <Button onClick={generateContent} disabled={isLoading} className="w-full">
                {isLoading ? 'Generating...' : 'Generate Badge'}
            </Button>
        </div>
      </EditorPanel>
      <EditorPanel title="3. Mint NFT">
        <div>
          <label className="text-sm font-medium text-gray-300">Edition Size: <span className="text-cyan-400 font-semibold">{editionSize}</span></label>
          <input type="range" min="1" max="1000" value={editionSize} onChange={(e) => setEditionSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider mt-2" />
        </div>
        <div className="space-y-3 mt-4">
          {isUserAdmin && (
            <button className={`cyber-button w-full py-4 rounded-lg font-semibold ${!canMintGasless || isMinting ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!canMintGasless || isMinting} onClick={handleEngineNormalMint}>
              {isMinting ? 'Minting...' : '🚀 Mint via Engine (Gasless)'}
            </button>
          )}
          <button className={`cyber-button w-full py-4 rounded-lg font-semibold ${!canMintLegacy || isMinting ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!canMintLegacy || isMinting} onClick={handleMintNFT}>
            {isMinting ? 'Minting...' : 'Mint (Legacy)'}
          </button>
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
      preview={<PreviewPanel generatedImage={generatedImage} isLoading={isLoading} error={error} onResetError={resetError} />}
      marketplace={<MarketplaceCarousel items={marketplaceNFTs.map(nft => ({ name: nft.name, imageUrl: nft.image_url, price: nft.price }))} isLoading={marketplaceLoading} />}
    />
  )
} 