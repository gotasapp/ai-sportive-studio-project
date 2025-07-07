'use client'

import React from 'react'
import { 
  Zap, Wallet, Rocket, Clock, CheckCircle, AlertCircle, 
  ExternalLink, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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
  
  // Wallet
  isConnected: boolean
  isOnSupportedChain: boolean
  isUserAdmin: boolean
  
  // Progress
  progress?: number
  progressText?: string
  
  // Utils
  getTransactionUrl: (hash: string) => string
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
  isConnected,
  isOnSupportedChain,
  isUserAdmin,
  progress,
  progressText,
  getTransactionUrl
}: ProfessionalActionBarProps) {
  
  const renderGenerateButton = () => (
    <Button
      onClick={onGenerate}
      disabled={!canGenerate || isLoading}
      className={cn(
        "group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white !text-black hover:bg-[#A20131] hover:!text-white"
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Generating...</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 fill-[#A20131] stroke-[#A20131] group-hover:fill-white group-hover:stroke-white" />
          <span>Generate Jersey</span>
          {generationCost && (
            <Badge variant="secondary" className="border-none bg-black/20 text-black">
              ${generationCost.toFixed(3)}
            </Badge>
          )}
        </div>
      )}
    </Button>
  )

  const renderMintButtons = () => (
    <div className="flex items-center gap-3">
      {/* Legacy Mint */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onMintLegacy}
              disabled={!canMintLegacy || isMinting}
              variant="outline"
              className={cn(
                "h-12 px-6 text-base font-medium transition-all duration-200",
                "bg-[#333333]/20 border-[#333333] text-[#FDFDFD] hover:bg-[#333333]/40",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Mint (Legacy)</span>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mint using your wallet (requires gas)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Gasless Mint - Admin Only */}
      {isUserAdmin && (
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

  const renderProgress = () => {
    if (!progress && !progressText) return null

    return (
      <div className="flex items-center justify-center gap-3">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#ADADAD]">{progressText || 'Processing...'}</span>
            {progress && (
              <span className="text-sm text-[#ADADAD]">{Math.round(progress)}%</span>
            )}
          </div>
          <Progress 
            value={progress || 0} 
            className="h-2 bg-[#333333]/30"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {renderProgress()}

      {/* Status Display */}
      {renderStatus()}

      {/* Main Action Bar - Centralizado */}
      <div className="flex items-center justify-center gap-6">
        {/* Generate Button */}
        {renderGenerateButton()}

        {/* Mint Buttons */}
        {renderMintButtons()}
      </div>

      {/* Connection Warning - Apenas se necessário */}
      {!isConnected && (
        <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-medium">
            Connect your wallet to start generating and minting
          </span>
        </div>
      )}

      {isConnected && !isOnSupportedChain && (
        <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-medium">
            Please switch to a supported network (CHZ, Polygon, Amoy)
          </span>
        </div>
      )}
    </div>
  )
} 