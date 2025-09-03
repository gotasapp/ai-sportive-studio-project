'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette, Wallet, AlertTriangle, Check, Eye, FileImage, X } from 'lucide-react'
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { getContract, prepareContractCall, createThirdwebClient, sendTransaction } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

import { Dalle3Service } from '../lib/services/dalle3-service'
import { IPFSService } from '../lib/services/ipfs-service'
import { useWeb3 } from '../lib/useWeb3'
import { useEngine } from '../lib/useEngine'
import { ImageGenerationRequest } from '../types'
import { getTransactionUrl } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { isAdmin } from '../lib/admin-config'
import { STYLE_FILTERS, SPORTS_OPTIONS, VIEW_OPTIONS, VISION_MODELS } from './jersey/constants/jerseyConstants'
import { getSportLabel, getViewLabel } from './jersey/utils/jerseyUtils'

// Importing the new professional components
import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalSidebar from '@/components/editor/ProfessionalSidebar'
import ProfessionalCanvas from '@/components/editor/ProfessionalCanvas'
import ProfessionalActionBar from '@/components/editor/ProfessionalActionBar'
import { useIsMobile } from "@/hooks/useIsMobile";
import JerseyMobileMainPage from "@/components/jersey/JerseyMobileMainPage";
import JerseyMobileAdvancedPage from "@/components/jersey/JerseyMobileAdvancedPage";
import JerseyMobileLayout from "@/components/jersey/JerseyMobileLayout";

export default function JerseyEditor() {
  const router = useRouter()
  const { toast } = useToast()
  
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

  // ===== EXISTING STATES =====
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [playerNumber, setPlayerNumber] = useState<string>('')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
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

  // ===== NEW VISION ANALYSIS STATES =====
  const [isVisionMode, setIsVisionMode] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageBlob, setReferenceImageBlob] = useState<Blob | null>(null)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  // Vision model fixed to default (admin can change in settings)
  const selectedVisionModel = 'openai/gpt-4o-mini'
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [selectedView, setSelectedView] = useState('back')
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Network validation (simplified for CHZ + Polygon)
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Amoy
  const isOnSupportedChain = supportedChainIds.includes(chainId || 0)
  
  // Admin check
  const isUserAdmin = isAdmin(account)
  
  // Mint conditions
  const canMintLegacy = isConnected && isOnSupportedChain && generatedImage // Legacy needs wallet
  const canMintGasless = generatedImage && selectedTeam && playerName && playerNumber && isUserAdmin // Gasless only for admins

  // ===== SIMPLIFIED PLACEHOLDER FUNCTIONS =====
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Move full implementation from original
    console.log('Vision analysis file upload - to be implemented')
  }

  const clearReferenceImage = () => {
    // TODO: Move full implementation from original
    setReferenceImage(null)
    setReferenceImageBlob(null)
    setCustomPrompt('')
    setAnalysisResult(null)
    setIsVisionMode(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeReferenceImage = async () => {
    // TODO: Move full implementation from original
    console.log('Vision analysis - to be implemented')
  }

  const handleSetClaimConditions = async () => {
    // TODO: Move full implementation from original
    console.log('Set claim conditions - to be implemented')
  }

  const handleEngineNormalMint = async () => {
    // TODO: Move full implementation from original
    console.log('Engine mint - to be implemented')
  }

  const handleMintNFT = async () => {
    // TODO: Move full implementation from original
    console.log('Legacy mint - to be implemented')
  }

  // ===== SIMPLIFIED GENERATION FUNCTION =====
  const generateContent = async () => {
    // TODO: Move full 610-line implementation to service
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🚀 [GENERATION] Simplified placeholder')
      
      // Placeholder logic - to be replaced with service call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setError('Generation simplified - original logic needs to be moved to service')
      
    } catch (err: any) {
      console.error('❌ Generation Error:', err)
      setError(err.message || 'An unknown error occurred during generation.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveJerseyToDB = async (jerseyData: any, imageBlob: Blob) => {
    // TODO: Move full implementation from original
    console.log('Save to DB - to be implemented')
  }

  const resetError = () => {
    setError(null);
    setSaveError(null);
  }

  // ===== SIMPLIFIED EFFECTS =====
  
  // Load teams effect (simplified)
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/admin/jerseys/references');
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const teamNames = data.data.map((team: any) => team.teamName);
          setAvailableTeams(teamNames);
          if (teamNames.length > 0) {
            setSelectedTeam(teamNames[0]);
          }
        } else {
           throw new Error('Invalid data structure from teams API.');
        }
      } catch (err: any) {
        console.error('❌ Error loading teams:', err);
        const defaultTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo'];
        setAvailableTeams(defaultTeams);
        setSelectedTeam(defaultTeams[0]);
      }
    };

    loadTeams();
  }, []);

  const isMobile = useIsMobile();
  const [mobilePage, setMobilePage] = useState<'main' | 'advanced'>('main');

  if (isMobile) {
    return (
      <JerseyMobileLayout
        playerName={playerName}
        setPlayerName={setPlayerName}
        playerNumber={playerNumber}
        setPlayerNumber={setPlayerNumber}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        selectedStyle={selectedStyle}
        setSelectedStyle={setSelectedStyle}
        quality={quality}
        setQuality={setQuality}
        generatedImage={generatedImage}
        isLoading={isLoading}
        error={error}
        onResetError={resetError}
        referenceImage={referenceImage}
        isVisionMode={isVisionMode}
        onGenerate={generateContent}
        onFileUpload={handleFileUpload}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        isConnected={isConnected}
        isOnSupportedChain={isOnSupportedChain}
        isUserAdmin={isUserAdmin}
        canMintGasless={!!canMintGasless}
        isMinting={isMinting}
        mintStatus={mintStatus}
        mintSuccess={mintSuccess}
        mintError={mintError}
        transactionHash={transactionHash}
        onMintGasless={handleEngineNormalMint}
        generationCost={generationCost}
        availableTeams={availableTeams}
        walletAddress={address || ""}
        nftName={selectedTeam && playerName && playerNumber ? `${selectedTeam} ${playerName} #${playerNumber}` : ""}
        hasGeneratedImage={!!generatedImage}
        metadataUri={ipfsUrl || ""}
        collection="jerseys"
      />
    );
  }

  return (
    <ProfessionalEditorLayout
      sidebar={
        <ProfessionalSidebar
          availableTeams={availableTeams}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerNumber={playerNumber}
          setPlayerNumber={setPlayerNumber}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          quality={quality}
          setQuality={setQuality}
          isVisionMode={isVisionMode}
          referenceImage={referenceImage}
          selectedSport={selectedSport}
          setSelectedSport={setSelectedSport}
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          onFileUpload={handleFileUpload}
          onClearReference={clearReferenceImage}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          generationCost={generationCost}
          error={error}
          onResetError={resetError}
        />
      }
      canvas={
        <ProfessionalCanvas
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onResetError={resetError}
          playerName={playerName}
          playerNumber={playerNumber}
          selectedTeam={selectedTeam}
          selectedStyle={selectedStyle}
          quality={quality}
          referenceImage={referenceImage}
          isVisionMode={isVisionMode}
        />
      }
      actionBar={
        <ProfessionalActionBar
          onGenerate={generateContent}
          isLoading={isLoading}
          canGenerate={!!((selectedTeam && playerName && playerNumber) || isVisionMode)}      
          generationCost={generationCost}
          onMintGasless={handleEngineNormalMint}
          canMintGasless={!!canMintGasless}
          isMinting={isMinting}
          mintStatus={mintStatus}
          mintSuccess={mintSuccess}
          mintError={mintError}
          transactionHash={transactionHash}
          isConnected={isConnected}
          isOnSupportedChain={isOnSupportedChain}
          isUserAdmin={isUserAdmin}
          nftName={selectedTeam && playerName && playerNumber ? `${selectedTeam} ${playerName} #${playerNumber}` : undefined}
          metadataUri={ipfsUrl || undefined}
          walletAddress={address || undefined}
          collection="jerseys"
          hasGeneratedImage={!!generatedImage}
          generatedImageBlob={generatedImageBlob || undefined}
          nftDescription={`AI-generated jersey for ${selectedTeam} - ${playerName} #${playerNumber}. ${selectedStyle} style jersey created with advanced AI technology.`}
          nftAttributes={[
            { trait_type: 'Team', value: selectedTeam || 'Unknown' },
            { trait_type: 'Player Name', value: playerName },
            { trait_type: 'Player Number', value: playerNumber },
            { trait_type: 'Style', value: selectedStyle },
            { trait_type: 'Quality', value: quality },
            { trait_type: 'Type', value: 'Jersey' },
            { trait_type: 'Generator', value: 'AI Sports NFT' }
          ]}
          getTransactionUrl={getTransactionUrl}
        />
      }
    />
  )
}
