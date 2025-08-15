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
  onMintGasless: () => void
  canMintGasless: boolean
  onMintLegacy: () => void
  canMintLegacy: boolean
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
  onMintGasless,
  canMintGasless,
  onMintLegacy,
  canMintLegacy,
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
        "bg-white !text-black hover:bg-[#FF0052] hover:!text-white",
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
          <Zap className="w-6 h-6 fill-[#FF0052] stroke-[#FF0052] group-hover:fill-white group-hover:stroke-white max-lg:w-4 max-lg:h-4" />
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
      {/* Legacy Mint - Para todos os usuários conectados */}
      {canMintLegacy && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onMintLegacy}
                disabled={!canMintLegacy || isMinting}
                variant="outline"
                className={cn(
                  "h-12 px-6 text-base font-medium transition-all duration-200",
                  "bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // Mobile responsiveness
                  "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
                )}
              >
                <div className="flex items-center gap-2 max-lg:gap-1.5">
                  <Wallet className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                  <span>Legacy</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Legacy mint using your wallet (requires gas)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Gasless Mint - Somente para Admin */}
      {isUserAdmin && canMintGasless && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onMintGasless}
                disabled={!canMintGasless || isMinting}
                variant="outline"
                className={cn(
                  "h-12 px-6 text-base font-medium transition-all duration-200",
                  "bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052] hover:bg-[#FF0052]/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // Mobile responsiveness
                  "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
                )}
              >
                <div className="flex items-center gap-2 max-lg:gap-1.5">
                  <Zap className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                  <span>Gasless</span>
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
      {/* MINT INTELIGENTE: Todos os usuários podem usar */}
      {walletAddress && nftName && hasGeneratedImage && (
        <BatchMintDialog
          trigger={
            <Button
              disabled={!isConnected || isMinting}
              variant="outline"
              className="h-12 px-6 text-base font-medium bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052] hover:bg-[#FF0052]/20 disabled:opacity-50"
              onClick={() => console.log('🎯 Smart Mint clicked!')}
            >
              <span>Mint</span>
            </Button>
          }
          to={walletAddress}
          metadataUri={metadataUri || ''}
          nftName={nftName}
          collection={collection}
          disabled={!isConnected || isMinting}
          isUserAdmin={isUserAdmin}
          generatedImageBlob={generatedImageBlob}
        />
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
              // Check if blob exists
              if (!generatedImageBlob) {
                toast.error('No image generated yet');
                return;
              }

              // 1. Upload to Cloudinary
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
              
              // 2. Save to database
              const response = await fetch('/api/launchpad/pending-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: uploadResult.url,
                  category: 'jerseys',
                  name: 'Jersey for Launchpad',
                  description: 'Image sent for approval',
                  price: '0.1',
                  maxSupply: 100,
                  status: 'pending_launchpad'
                })
              })
              
              const result = await response.json()
              
              if (result.success) {
                toast.success('Image sent to Launchpad!')
                console.log('✅ Success:', result)
              } else {
                throw new Error(result.error || 'Failed to save')
              }
              
            } catch (error) {
              console.error('❌ Erro:', error)
              toast.error('Failed to send to Launchpad')
            }
          }}
          disabled={!generatedImageBlob}
          variant="outline"
          className="h-12 px-6 text-base font-medium bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            <span>Send to Launchpad</span>
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