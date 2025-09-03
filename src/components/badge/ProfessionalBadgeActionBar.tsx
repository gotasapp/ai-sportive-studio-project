'use client'

import React from 'react'
import { 
  Zap, Wallet, Rocket, Clock, CheckCircle, AlertCircle, 
  ExternalLink, Loader2, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BatchMintDialog } from '@/components/ui/batch-mint-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProfessionalBadgeActionBarProps {
  onGenerate: () => void
  isLoading: boolean
  canGenerate: boolean
  onMintGasless: () => void
  canMintGasless: boolean
  isMinting: boolean
  mintStatus: 'idle' | 'pending' | 'success' | 'error'
  mintSuccess: string | null
  mintError: string | null
  transactionHash: string | null
  isConnected: boolean
  isOnSupportedChain: boolean
  isUserAdmin: boolean
  getTransactionUrl: (hash: string) => string
  isAnalyzing?: boolean
  hasGeneratedImage?: boolean
  nftName?: string
  metadataUri?: string
  walletAddress?: string
  collection?: string
  generatedImageBlob?: Blob
}

export default function ProfessionalBadgeActionBar({
  onGenerate,
  isLoading,
  canGenerate,
  onMintGasless,
  canMintGasless,
  isMinting,
  mintStatus,
  mintSuccess,
  mintError,
  transactionHash,
  isConnected,
  isOnSupportedChain,
  isUserAdmin,
  getTransactionUrl,
  isAnalyzing = false,
  hasGeneratedImage = false,
  nftName,
  metadataUri,
  walletAddress,
  collection,
  generatedImageBlob
}: ProfessionalBadgeActionBarProps) {
  
  const renderGenerateButton = () => (
    <Button
      onClick={onGenerate}
      disabled={!canGenerate || isLoading}
      className={cn(
        "group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white !text-black hover:bg-[#FF0052] hover:!text-white"
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Generating...'}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 fill-[#FF0052] stroke-[#FF0052] group-hover:fill-white group-hover:stroke-white" />
          <span>Generate Badge</span>
        </div>
      )}
    </Button>
  )

  const renderMintButtons = () => (
    <div className="flex items-center gap-3">
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
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span>Gasless</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gasless mint via admin wallet</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Batch Mint Dialog - Admin: gasless, Usuário: pago */}
      {walletAddress && nftName && hasGeneratedImage && (
        <BatchMintDialog
          trigger={
            <Button
              disabled={!isConnected || isMinting}
              variant="outline"
              className="h-12 px-6 text-base font-medium bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052] hover:bg-[#FF0052]/20 disabled:opacity-50"
            >
              <span>Mint</span>
            </Button>
          }
          to={walletAddress}
          metadataUri={metadataUri || ''}
          nftName={nftName}
          collection={(collection as "jerseys" | "badges" | "stadiums") || 'badges'}
          disabled={!isConnected || isMinting}
          isUserAdmin={isUserAdmin}
          generatedImageBlob={generatedImageBlob}
        />
      )}

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
                  "bg-[#FF0052]/10 border-[#FF0052]/30 text-[#FF0052] hover:bg-[#FF0052]/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
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
    </div>
  )

  const renderStatus = () => {
    if (mintStatus === 'idle') return null

    return (
      <div className={cn(
        "flex items-center justify-center gap-3 px-4 py-3 rounded-lg border",
        mintStatus === 'success' && "bg-green-500/10 border-green-500/30",
        mintStatus === 'error' && "bg-red-500/10 border-red-500/30",
        mintStatus === 'pending' && "bg-yellow-500/10 border-yellow-500/30"
      )}>
        <div className="flex items-center gap-2">
          {mintStatus === 'pending' && <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />}
          {mintStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {mintStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
          
          <span className={cn(
            "text-base font-medium",
            mintStatus === 'success' && "text-green-400",
            mintStatus === 'error' && "text-red-400",
            mintStatus === 'pending' && "text-yellow-400"
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
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Transaction
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Status Display */}
      {renderStatus()}

      {/* Main Action Bar - Centralizado */}
      <div className="flex items-center justify-center gap-6">
        {/* ANTES de gerar imagem: Apenas Generate Button centralizado */}
        {!hasGeneratedImage && renderGenerateButton()}

        {/* DEPOIS de gerar imagem: Mint Buttons */}
        {hasGeneratedImage && renderMintButtons()}
      </div>

      {/* 🚀 BOTÃO SEND TO LAUNCHPAD - Após gerar imagem */}
      {hasGeneratedImage && generatedImageBlob && (
        <div className="flex items-center justify-center">
          <Button
            onClick={async () => {
              console.log('🚀 Enviando badge para Launchpad...')
              
              try {
                // Check if blob exists
                if (!generatedImageBlob) {
                  throw new Error('No image available')
                }

                // 1. Upload to Cloudinary
                const formData = new FormData()
                formData.append('file', generatedImageBlob, 'launchpad_badge.png')
                formData.append('fileName', `badge_launchpad_${Date.now()}`)
                
                const uploadResponse = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                })

                if (!uploadResponse.ok) {
                  throw new Error('Upload failed')
                }

                const uploadResult = await uploadResponse.json()
                console.log('✅ Upload OK:', uploadResult.url)
                
                // 2. Save to database
                const response = await fetch('/api/launchpad/pending-images', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    imageUrl: uploadResult.url,
                    category: 'badges',
                    name: 'Badge for Launchpad',
                    description: 'Badge image sent for approval',
                    price: '0.05',
                    maxSupply: 100,
                    status: 'pending_launchpad'
                  })
                })
                
                const result = await response.json()
                
                if (result.success) {
                  toast.success('Badge sent to Launchpad!')
                  console.log('✅ Success:', result)
                } else {
                  throw new Error(result.error || 'Failed to save')
                }
                
              } catch (error) {
                console.error('❌ Erro:', error)
                toast.error('Failed to send badge to Launchpad')
              }
            }}
            disabled={!generatedImageBlob}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                     text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 
                     hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              <span>Send to Launchpad</span>
            </div>
          </Button>
        </div>
      )}

      {/* Connection Warning - Apenas se necessário */}


      {isConnected && !isOnSupportedChain && (
        <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-medium">
            Please switch to CHZ Mainnet
          </span>
        </div>
      )}
    </div>
  )
} 