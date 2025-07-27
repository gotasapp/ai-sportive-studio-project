'use client'

import React from 'react'
import { 
  Zap, Wallet, Rocket, Clock, CheckCircle, AlertCircle, 
  ExternalLink, Loader2, Hash, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { BatchMintDialog } from '@/components/ui/batch-mint-dialog'
import { PublicMint } from '@/components/ui/public-mint'
import { cn } from '@/lib/utils'
import { TransactionButton } from 'thirdweb/react'
import { getContract, createThirdwebClient } from 'thirdweb'
import { defineChain } from 'thirdweb/chains'
import { mintTo } from 'thirdweb/extensions/erc721'
import { toast } from 'sonner'

interface ProfessionalActionBarProps {
  // Generation
  onGenerate: () => void
  isLoading: boolean
  canGenerate: boolean
  generationCost: number | null

  // Minting
  onMintLegacy: () => void
  onMintGasless: () => void
  canMintLegacy: boolean
  canMintGasless: boolean
  isMinting: boolean
  mintStatus: 'idle' | 'pending' | 'success' | 'error'
  mintSuccess: string | null
  mintError: string | null
  transactionHash: string | null

  // Batch Minting
  nftName?: string
  metadataUri?: string
  walletAddress?: string
  collection?: 'jerseys' | 'stadiums' | 'badges'
  hasGeneratedImage?: boolean

  // Public Minting (for any user)
  generatedImageBlob?: Blob
  nftDescription?: string
  nftAttributes?: Array<{ trait_type: string; value: string }>

  // Wallet
  isConnected: boolean
  isOnSupportedChain: boolean
  isUserAdmin: boolean

  // Progress
  progress?: number
  progressText?: string

  // Utils
  getTransactionUrl: (hash: string) => string

  // Launchpad
  onSendToLaunchpad?: () => void
  isLaunchpadMode?: boolean
  onToggleLaunchpadMode?: () => void
}

export default function ProfessionalActionBar({
  onGenerate,
  isLoading,
  canGenerate,
  generationCost,
  onMintLegacy,
  onMintGasless,
  canMintLegacy,
  canMintGasless,
  isMinting,
  mintStatus,
  mintSuccess,
  mintError,
  transactionHash,
  nftName,
  metadataUri,
  walletAddress,
  collection,
  hasGeneratedImage,
  generatedImageBlob,
  nftDescription,
  nftAttributes,
  isConnected,
  isOnSupportedChain,
  isUserAdmin,
  progress,
  progressText,
  getTransactionUrl,
  onSendToLaunchpad,
  isLaunchpadMode,
  onToggleLaunchpadMode
}: ProfessionalActionBarProps) {
  


  const renderGenerateButton = () => (
    <Button
      onClick={onGenerate}
      disabled={!canGenerate || isLoading}
      className={cn(
        "group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white !text-black hover:bg-[#A20131] hover:!text-white",
        // Mobile responsiveness
        "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-3 max-lg:gap-2">
          <Loader2 className="w-6 h-6 animate-spin max-lg:w-4 max-lg:h-4" />
          <span>Generating...</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 max-lg:gap-2">
          <Zap className="w-6 h-6 fill-[#A20131] stroke-[#A20131] group-hover:fill-white group-hover:stroke-white max-lg:w-4 max-lg:h-4" />
          <span>Generate Jersey</span>
          {generationCost && (
            <Badge variant="secondary" className="border-none bg-black/20 text-black max-lg:text-xs max-lg:px-1.5 max-lg:py-0.5">
              ${generationCost.toFixed(3)}
            </Badge>
          )}
        </div>
      )}
    </Button>
  )

  const renderMintButtons = () => (
    <div className="flex items-center gap-3 max-lg:flex-col max-lg:gap-2 max-lg:w-full">
      {/* Legacy Mint - Sempre visível após gerar imagem */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onMintLegacy}
              disabled={!canMintLegacy || isMinting}
              variant="outline"
              className={cn(
                "h-12 px-6 text-base font-medium transition-all duration-200",
                "bg-[#333333]/10 border-[#333333] text-[#FDFDFD] hover:bg-[#333333]/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Mobile responsiveness
                "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
              )}
            >
              <div className="flex items-center gap-2 max-lg:gap-1.5">
                <Wallet className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                <span>Mint</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mint using your wallet (requires gas)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Gasless Mint - TEMPORARIAMENTE OCULTO (código mantido) */}
      {false && isUserAdmin && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onMintGasless}
                disabled={!canMintGasless || isMinting}
                variant="outline"
                className={cn(
                  "h-12 px-6 text-base font-medium transition-all duration-200",
                  "bg-[#A20131]/10 border-[#A20131]/30 text-[#A20131] hover:bg-[#A20131]/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // Mobile responsiveness
                  "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
                )}
              >
                <div className="flex items-center gap-2 max-lg:gap-1.5">
                  <Rocket className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                  <span>Mint (Gasless)</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gasless mint via Engine (Admin only)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Batch Mint Logic - Diferente para Admin vs Usuário Comum */}
      {isUserAdmin ? (
        // ADMIN: Batch Mint via Backend
        walletAddress && nftName && hasGeneratedImage && (
          <BatchMintDialog
            trigger={
              <Button
                disabled={!canMintGasless || isMinting}
                variant="outline"
                className={cn(
                  "h-12 px-6 text-base font-medium transition-all duration-200",
                  "bg-[#A20131]/10 border-[#A20131]/30 text-[#A20131] hover:bg-[#A20131]/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // Mobile responsiveness
                  "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
                )}
                onClick={() => console.log('🎯 Admin Batch Mint clicked!')}
              >
                <div className="flex items-center gap-2 max-lg:gap-1.5">
                  <Hash className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                  <span>Batch Mint</span>
                </div>
              </Button>
            }
            to={walletAddress}
            metadataUri={metadataUri || ''}
            nftName={nftName}
            collection={collection}
            disabled={!canMintGasless || isMinting}
          />
        )
      ) : (
        // USUÁRIO COMUM: Public Mint (Edition Drop)
        isConnected && generatedImageBlob && nftName && (
          <PublicMint
            imageBlob={generatedImageBlob}
            metadata={{
              name: nftName,
              description: nftDescription || `AI-generated ${collection || 'NFT'} created with CHZ Fan Token Studio`,
              attributes: nftAttributes || [
                { trait_type: 'Generator', value: 'AI Sports NFT' },
                { trait_type: 'Collection', value: collection || 'General' },
                { trait_type: 'Type', value: 'Public Mint' }
              ]
            }}
          />
        )
      )}

      
    </div>
  )

  const renderStatus = () => {
    if (mintStatus === 'idle') return null

    return (
      <div className={cn(
        "flex items-center justify-center gap-3 px-4 py-3 rounded-lg border",
        mintStatus === 'success' && "bg-green-500/10 border-green-500/30",
        mintStatus === 'error' && "bg-red-500/10 border-red-500/30",
        mintStatus === 'pending' && "bg-yellow-500/10 border-yellow-500/30",
        // Mobile responsiveness
        "max-lg:flex-col max-lg:gap-2 max-lg:px-3 max-lg:py-2"
      )}>
        <div className="flex items-center gap-2 max-lg:gap-1.5">
          {mintStatus === 'pending' && <Clock className="w-5 h-5 text-yellow-400 animate-pulse max-lg:w-4 max-lg:h-4" />}
          {mintStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400 max-lg:w-4 max-lg:h-4" />}
          {mintStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-400 max-lg:w-4 max-lg:h-4" />}

          <span className={cn(
            "text-base font-medium",
            mintStatus === 'success' && "text-green-400",
            mintStatus === 'error' && "text-red-400",
            mintStatus === 'pending' && "text-yellow-400",
            // Mobile responsiveness
            "max-lg:text-sm max-lg:text-center"
          )}>
            {mintStatus === 'pending' && 'Minting in progress...'}
            {mintStatus === 'success' && mintSuccess}
            {mintStatus === 'error' && mintError}
          </span>
        </div>

        {transactionHash && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(getTransactionUrl(transactionHash), '_blank')}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 max-lg:text-xs max-lg:px-2 max-lg:py-1"
          >
            <ExternalLink className="w-4 h-4 mr-1 max-lg:w-3 max-lg:h-3" />
            View Transaction
          </Button>
        )}
      </div>
    )
  }

  const renderProgress = () => {
    if (!progress && !progressText) return null

    return (
      <div className="flex items-center justify-center gap-3 max-lg:flex-col max-lg:gap-2">
        <div className="flex-1 max-w-md max-lg:w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#ADADAD] max-lg:text-xs">{progressText || 'Processing...'}</span>
            {progress && (
              <span className="text-sm text-[#ADADAD] max-lg:text-xs">{Math.round(progress)}%</span>
            )}
          </div>
          <Progress
            value={progress || 0}
                            className="h-2 bg-[#333333]/10 max-lg:h-1.5"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-lg:space-y-2">
      {/* Progress Bar */}
      {renderProgress()}

      {/* Status Display */}
      {renderStatus()}

      {/* Botão Launchpad - FUNÇÃO SIMPLES */}
      <div className="flex items-center justify-center">
        <Button
          onClick={async () => {
            console.log('🚀 Enviando imagem para Launchpad...')
            
            try {
              // 1. Upload para Cloudinary
              const formData = new FormData()
              formData.append('file', generatedImageBlob, 'launchpad_image.png')
              formData.append('fileName', `launchpad_${Date.now()}`)
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              })
              
              if (!uploadResponse.ok) {
                throw new Error('Falha no upload')
              }
              
              const uploadResult = await uploadResponse.json()
              console.log('✅ Upload OK:', uploadResult.url)
              
              // 2. Salvar no banco
              const response = await fetch('/api/launchpad/pending-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: uploadResult.url,
                  category: 'jerseys',
                  name: 'Jersey para Launchpad',
                  description: 'Imagem enviada para aprovação',
                  price: '0.1',
                  maxSupply: 100,
                  status: 'pending_launchpad'
                })
              })
              
              const result = await response.json()
              
              if (result.success) {
                toast.success('Imagem enviada para o Launchpad!')
                console.log('✅ Sucesso:', result)
              } else {
                throw new Error(result.error || 'Falha ao salvar')
              }
              
            } catch (error) {
              console.error('❌ Erro:', error)
              toast.error('Erro ao enviar para Launchpad')
            }
          }}
          disabled={!generatedImageBlob}
          variant="outline"
          className="h-12 px-6 text-base font-medium bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            <span>Enviar para Launchpad</span>
          </div>
        </Button>
      </div>
      


      {/* Main Action Bar - Centralizado no desktop, stacked no mobile */}
      <div className="flex items-center justify-center gap-6 max-lg:flex-col max-lg:gap-3">
        {/* ANTES de gerar imagem: Generate Button */}
        {!hasGeneratedImage && renderGenerateButton()}

        {/* DEPOIS de gerar imagem: Mint Buttons */}
        {hasGeneratedImage && renderMintButtons()}
      </div>

      {/* Connection Warning - Apenas se necessário */}
      {!isConnected && (
        <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-lg:flex-col max-lg:gap-1 max-lg:text-center">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-medium max-lg:text-xs">
            Connect your wallet to start generating and minting
          </span>
        </div>
      )}

      {isConnected && !isOnSupportedChain && (
        <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg max-lg:flex-col max-lg:gap-1 max-lg:text-center">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-medium max-lg:text-xs">
            Please switch to a supported network (CHZ, Polygon, Amoy)
          </span>
        </div>
      )}
    </div>
  )
} 