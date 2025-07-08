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
        "group h-12 px-8 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white !text-black hover:bg-[#A20131] hover:!text-white",
        // Mobile adjustments
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
    <div className="flex items-center gap-3 max-lg:gap-2 max-lg:flex-col max-lg:w-full">
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
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Mobile adjustments
                "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
              )}
            >
              <div className="flex items-center gap-2 max-lg:gap-1.5">
                <Wallet className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                <span>Mint (Legacy)</span>
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
<<<<<<< HEAD
                  "bg-[#333333]/20 border-[#333333] text-[#FDFDFD] hover:bg-[#333333]/40",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  <span>Mint (Legacy)</span>
=======
                  "bg-[#A20131]/10 border-[#A20131]/30 text-[#A20131] hover:bg-[#A20131]/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  // Mobile adjustments
                  "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
                )}
              >
                <div className="flex items-center gap-2 max-lg:gap-1.5">
                  <Rocket className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
                  <span>Mint (Gasless)</span>
>>>>>>> 77aedeb ( segunda tentativa resposividade)
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
        mintStatus === 'pending' && "bg-yellow-500/10 border-yellow-500/30",
        // Mobile adjustments
        "max-lg:flex-col max-lg:gap-2 max-lg:px-3 max-lg:py-2"
      )}>
<<<<<<< HEAD
        <div className="flex items-center gap-2">
          {mintStatus === 'pending' && <Clock className={cn("text-yellow-400 animate-pulse", isMobile ? "w-4 h-4" : "w-5 h-5")} />}
          {mintStatus === 'success' && <CheckCircle className={cn("text-green-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />}
          {mintStatus === 'error' && <AlertCircle className={cn("text-red-400", isMobile ? "w-4 h-4" : "w-5 h-5")} />}
=======
        <div className="flex items-center gap-2 max-lg:gap-1.5">
          {mintStatus === 'pending' && <Clock className="w-5 h-5 text-yellow-400 animate-pulse max-lg:w-4 max-lg:h-4" />}
          {mintStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400 max-lg:w-4 max-lg:h-4" />}
          {mintStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-400 max-lg:w-4 max-lg:h-4" />}
>>>>>>> 77aedeb ( segunda tentativa resposividade)
          
          <span className={cn(
            "font-medium",
            isMobile ? "text-sm text-center" : "text-base",
            mintStatus === 'success' && "text-green-400",
            mintStatus === 'error' && "text-red-400",
            mintStatus === 'pending' && "text-yellow-400",
            // Mobile adjustments
            "max-lg:text-sm max-lg:text-center"
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
<<<<<<< HEAD
            className={cn(
              "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10",
              isMobile && "w-full"
            )}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            {isMobile ? "View" : "View Transaction"}
=======
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 max-lg:text-xs max-lg:px-2 max-lg:py-1"
          >
            <ExternalLink className="w-4 h-4 mr-1 max-lg:w-3 max-lg:h-3" />
            View Transaction
>>>>>>> 77aedeb ( segunda tentativa resposividade)
          </Button>
        )}
      </div>
    )
  }

  const renderProgress = () => {
    if (!progress && !progressText) return null

    return (
<<<<<<< HEAD
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
=======
      <div className="flex items-center justify-center gap-3 max-lg:flex-col max-lg:gap-2">
        <div className="flex-1 max-w-md max-lg:w-full">
          {progress && (
            <Progress 
              value={progress} 
              className="h-2 bg-[#333333]/20 max-lg:h-1.5"
            />
          )}
        </div>
        {progressText && (
          <span className="text-sm text-[#ADADAD] max-lg:text-xs max-lg:text-center">
            {progressText}
          </span>
        )}
>>>>>>> 77aedeb ( segunda tentativa resposividade)
      </div>
    )
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="action-bar bg-transparent border-t border-[#333333] p-4 max-lg:p-2">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        {renderProgress()}

        {/* Main Actions */}
        <div className={cn(
          "flex items-center justify-between gap-4",
          // Mobile: stack vertically
          "max-lg:flex-col max-lg:gap-3 max-lg:items-stretch"
        )}>
          {/* Left Side - Connection Status */}
          <div className="flex items-center gap-3 max-lg:justify-center max-lg:order-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-400" : "bg-red-400"
              )} />
              <span className="text-sm text-[#ADADAD] max-lg:text-xs">
                {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
              </span>
            </div>
            
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnSupportedChain ? "bg-green-400" : "bg-yellow-400"
                )} />
                <span className="text-sm text-[#ADADAD] max-lg:text-xs">
                  {isOnSupportedChain ? 'Supported Network' : 'Switch Network'}
                </span>
              </div>
            )}
          </div>

          {/* Center - Generate Button */}
          <div className="flex-1 flex justify-center max-lg:order-1 max-lg:w-full">
            {renderGenerateButton()}
          </div>

          {/* Right Side - Mint Actions */}
          <div className="max-lg:order-3 max-lg:w-full max-lg:flex max-lg:justify-center">
            {renderMintButtons()}
          </div>
        </div>

        {/* Status Messages */}
        <div className="mt-4 max-lg:mt-2">
          {renderStatus()}
        </div>
      </div>
>>>>>>> 77aedeb ( segunda tentativa resposividade)
    </div>
  )
} 