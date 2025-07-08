'use client'

import React from 'react'
import { 
  Zap, Wallet, Rocket, Clock, CheckCircle, AlertCircle, 
  ExternalLink, Loader2, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()
  
  const renderGenerateButton = () => (
    <Button
      onClick={onGenerate}
      disabled={!canGenerate || isLoading}
      className={cn(
        "group transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white !text-black hover:bg-[#A20131] hover:!text-white",
        isMobile ? "h-10 px-4 text-sm font-semibold w-full" : "h-12 px-8 text-base font-semibold"
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className={cn("animate-spin", isMobile ? "w-4 h-4" : "w-6 h-6")} />
          <span>{isMobile ? "Generating..." : "Generating..."}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Zap className={cn(
            "fill-[#A20131] stroke-[#A20131] group-hover:fill-white group-hover:stroke-white",
            isMobile ? "w-4 h-4" : "w-6 h-6"
          )} />
          <span>{isMobile ? "Generate" : "Generate Jersey"}</span>
          {generationCost && !isMobile && (
            <Badge variant="secondary" className="border-none bg-black/20 text-black">
              ${generationCost.toFixed(3)}
            </Badge>
          )}
        </div>
      )}
    </Button>
  )

  const renderMintButtons = () => {
    if (isMobile) {
      return (
        <div className="flex flex-col gap-2 w-full">
          {/* Legacy Mint */}
          <Button
            onClick={onMintLegacy}
            disabled={!canMintLegacy || isMinting}
            variant="outline"
            className={cn(
              "h-9 px-4 text-sm font-medium transition-all duration-200 w-full",
              "bg-[#333333]/20 border-[#333333] text-[#FDFDFD] hover:bg-[#333333]/40",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span>Mint (Legacy)</span>
            </div>
          </Button>

          {/* Gasless Mint - Admin Only */}
          {isUserAdmin && (
            <Button
              onClick={onMintGasless}
              disabled={!canMintGasless || isMinting}
              variant="outline"
              className={cn(
                "h-9 px-4 text-sm font-medium transition-all duration-200 w-full",
                "bg-[#A20131]/10 border-[#A20131]/30 text-[#A20131] hover:bg-[#A20131]/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                <span>Mint (Gasless)</span>
              </div>
            </Button>
          )}
        </div>
      )
    }

    return (
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
  }

  const renderStatus = () => {
    if (mintStatus === 'idle') return null

    return (
      <div className={cn(
        "flex items-center justify-center gap-3 rounded-lg border",
        isMobile ? "px-3 py-2 flex-col gap-2" : "px-4 py-3",
        mintStatus === 'success' && "bg-green-500/10 border-green-500/30",
        mintStatus === 'error' && "bg-red-500/10 border-red-500/30",
        mintStatus === 'pending' && "bg-yellow-500/10 border-yellow-500/30"
      )}>
        <div className="flex items-center gap-2">
          {mintStatus === 'pending' && <Clock className={cn("text-yellow-400 animate-pulse", isMobile ? "w-4 h-4" : "w-5 h-5")} />}
          {mintStatus === 'success' && <CheckCircle className={cn("text-green-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />}
          {mintStatus === 'error' && <AlertCircle className={cn("text-red-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />}
          
          <span className={cn(
            "font-medium",
            isMobile ? "text-sm text-center" : "text-base",
            mintStatus === 'success' && "text-green-400",
            mintStatus === 'error' && "text-red-400",
            mintStatus === 'pending' && "text-yellow-400"
          )}>
            {mintStatus === 'pending' && (isMobile ? 'Minting...' : 'Minting in progress...')}
            {mintStatus === 'success' && (isMobile ? 'Success!' : mintSuccess)}
            {mintStatus === 'error' && (isMobile ? 'Error!' : mintError)}
          </span>
        </div>

        {transactionHash && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(getTransactionUrl(transactionHash), '_blank')}
            className={cn(
              "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10",
              isMobile && "w-full"
            )}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            {isMobile ? "View" : "View Transaction"}
          </Button>
        )}
      </div>
    )
  }

  const renderProgress = () => {
    if (!progress && !progressText) return null

    return (
      <div className={cn(
        "flex items-center gap-3",
        isMobile ? "flex-col gap-2" : "justify-center"
      )}>
        <div className={cn(
          isMobile ? "w-full" : "flex-1 max-w-md"
        )}>
          <Progress value={progress || 0} className="h-2" />
        </div>
        {progressText && (
          <span className={cn(
            "text-[#ADADAD]",
            isMobile ? "text-xs text-center" : "text-sm"
          )}>
            {progressText}
          </span>
        )}
      </div>
    )
  }

  const renderWalletWarnings = () => {
    if (isConnected && isOnSupportedChain) return null

    return (
      <div className={cn(
        "flex items-center justify-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30",
        isMobile && "flex-col gap-1 text-center"
      )}>
        <AlertCircle className={cn("text-yellow-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />
        <span className={cn(
          "text-yellow-400 font-medium",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {!isConnected && "Connect wallet to generate and mint"}
          {isConnected && !isOnSupportedChain && "Switch to CHZ or Polygon network"}
        </span>
      </div>
    )
  }

  const renderCostInfo = () => {
    if (!generationCost || !isMobile) return null

    return (
      <div className="flex items-center justify-center">
        <Badge variant="outline" className="bg-[#333333]/20 border-[#333333] text-[#ADADAD] text-xs">
          Cost: ${generationCost.toFixed(3)}
        </Badge>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="w-full space-y-3 p-3 bg-[#333333]/10 border-t border-[#333333] rounded-t-lg">
        {/* Progress */}
        {renderProgress()}
        
        {/* Wallet Warnings */}
        {renderWalletWarnings()}
        
        {/* Cost Info */}
        {renderCostInfo()}
        
        {/* Main Actions */}
        <div className="space-y-2">
          {renderGenerateButton()}
          {renderMintButtons()}
        </div>
        
        {/* Status */}
        {renderStatus()}
      </div>
    )
  }

  return (
    <div className="w-full p-4 bg-[#333333]/10 border-t border-[#333333] rounded-lg">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Warnings */}
        <div className="flex-1">
          {renderWalletWarnings()}
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-4">
          {renderGenerateButton()}
          {renderMintButtons()}
        </div>

        {/* Right: Progress */}
        <div className="flex-1 flex justify-end">
          {renderProgress()}
        </div>
      </div>

      {/* Status - Full Width */}
      {renderStatus() && (
        <div className="mt-4">
          {renderStatus()}
        </div>
      )}
    </div>
  )
} 