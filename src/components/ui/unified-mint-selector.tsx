'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Wallet, 
  Rocket, 
  Hash, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnifiedMintSelectorProps {
  // Image data
  imageBlob?: Blob
  metadata: {
    name: string
    description: string
    attributes: Array<{ trait_type: string; value: string }>
  }
  
  // User state
  isConnected: boolean
  isUserAdmin: boolean
  userAddress?: string
  
  // Mint functions
  onMintSingle?: () => Promise<void>  // NFT Collection (ERC721)
  onMintBatch?: (quantity: number) => Promise<void>  // NFT Drop (ERC721A)
  onMintGasless?: () => Promise<void>  // Admin gasless (optional)
  
  // Loading states
  isMinting: boolean
  mintStatus: 'idle' | 'pending' | 'success' | 'error'
  mintSuccess?: string | null
  mintError?: string | null
  transactionHash?: string | null
}

export function UnifiedMintSelector({
  imageBlob,
  metadata,
  isConnected,
  isUserAdmin,
  userAddress,
  onMintSingle,
  onMintBatch,
  onMintGasless,
  isMinting,
  mintStatus,
  mintSuccess,
  mintError,
  transactionHash
}: UnifiedMintSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [mintType, setMintType] = useState<'public' | 'gasless'>('public')

  const handleMint = async () => {
    try {
      if (mintType === 'gasless' && isUserAdmin && onMintGasless) {
        await onMintGasless()
      } else if (quantity === 1 && onMintSingle) {
        await onMintSingle()
      } else if (quantity > 1 && onMintBatch) {
        await onMintBatch(quantity)
      } else {
        throw new Error('Mint function not available')
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Mint failed:', error)
    }
  }

  const canMint = imageBlob && metadata.name && isConnected
  const maxQuantity = 100

  // Determinar qual contrato será usado
  const getContractInfo = () => {
    if (mintType === 'gasless') {
      return {
        type: 'NFT Collection (ERC721)',
        description: 'Gasless mint via admin wallet'
      }
    } else {
      return {
        type: 'NFT Drop (ERC721A)',
        description: 'Public mint enabled - works with any wallet'
      }
    }
  }

  const contractInfo = getContractInfo()

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!canMint || isMinting}
          className={cn(
            "h-12 px-6 text-base font-medium transition-all duration-200",
            "bg-gradient-to-r from-[#A20131] to-[#C41E3A]",
            "hover:from-[#8B0120] hover:to-[#A20131]",
            "text-white border-0 shadow-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "max-lg:h-10 max-lg:px-4 max-lg:text-sm max-lg:w-full"
          )}
        >
          <div className="flex items-center gap-2 max-lg:gap-1.5">
            {isMinting ? (
              <Loader2 className="w-5 h-5 animate-spin max-lg:w-4 max-lg:h-4" />
            ) : (
              <Hash className="w-5 h-5 max-lg:w-4 max-lg:h-4" />
            )}
            <span>Mint NFT</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-[#0B0B0F] border-[#FDFDFD]/20">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD]">Smart Mint System</DialogTitle>
          <DialogDescription className="text-[#ADADAD]">
            Sistema inteligente que escolhe o contrato ideal baseado na quantidade.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Collection Preview */}
          <div className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#FDFDFD]/10">
            {imageBlob && (
              <img 
                src={URL.createObjectURL(imageBlob)} 
                alt={metadata.name}
                className="w-12 h-12 object-cover rounded-md"
              />
            )}
            <div>
              <h4 className="text-[#FDFDFD] font-medium">{metadata.name}</h4>
              <p className="text-[#ADADAD] text-sm line-clamp-2">{metadata.description}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right text-[#FDFDFD]">
              Quantidade
            </Label>
            <div className="col-span-3">
              <Input
                id="quantity"
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-[#1A1A1A] border-[#FDFDFD]/20 text-[#FDFDFD]"
                disabled={mintType === 'gasless'} // Gasless sempre 1
              />
              <p className="text-xs text-[#ADADAD] mt-1">
                {quantity === 1 ? 'NFT única' : `${quantity} NFTs com mesma imagem`}
              </p>
            </div>
          </div>

          {/* Contract Info - Dynamic */}
          <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#FDFDFD]/10">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-[#FDFDFD]">Contrato Selecionado</span>
            </div>
            <div className="text-xs text-[#ADADAD] space-y-1">
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="text-[#FDFDFD] font-mono">{contractInfo.type}</span>
              </div>
              <div className="text-[#ADADAD]">{contractInfo.description}</div>
            </div>
          </div>

          {/* Mint Type Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-[#FDFDFD]">
              Tipo
            </Label>
            <div className="col-span-3 flex gap-2">
              <Badge 
                variant={mintType === 'public' ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer px-3 py-1",
                  mintType === 'public' 
                    ? "bg-[#A20131] text-white" 
                    : "bg-transparent border-[#FDFDFD]/20 text-[#ADADAD] hover:bg-[#A20131]/10"
                )}
                onClick={() => setMintType('public')}
              >
                <Wallet className="w-3 h-3 mr-1" />
                Público (Paga Gas)
              </Badge>
              
              {isUserAdmin && onMintGasless && (
                <Badge 
                  variant={mintType === 'gasless' ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer px-3 py-1",
                    mintType === 'gasless' 
                      ? "bg-[#A20131] text-white" 
                      : "bg-transparent border-[#FDFDFD]/20 text-[#ADADAD] hover:bg-[#A20131]/10"
                  )}
                  onClick={() => {
                    setMintType('gasless')
                    setQuantity(1) // Gasless sempre 1
                  }}
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  Gasless (Admin)
                </Badge>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#FDFDFD]/10">
            <div className="flex justify-between text-sm">
              <span className="text-[#ADADAD]">Total a Mintar:</span>
              <span className="text-[#FDFDFD]">{quantity} NFT{quantity > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#ADADAD]">Taxa de Gas:</span>
              <span className="text-[#FDFDFD]">
                {mintType === 'gasless' ? 'Grátis (Admin)' : 'Pago pelo usuário'}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#ADADAD]">Estratégia:</span>
              <span className="text-[#FDFDFD] text-xs">
                {quantity === 1 || mintType === 'gasless' ? 'Mint Direto' : 'Lazy Mint + Claim'}
              </span>
            </div>
          </div>

          {/* Status Display */}
          {mintStatus !== 'idle' && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg border",
              mintStatus === 'success' && "bg-green-500/10 border-green-500/30",
              mintStatus === 'error' && "bg-red-500/10 border-red-500/30",
              mintStatus === 'pending' && "bg-yellow-500/10 border-yellow-500/30"
            )}>
              {mintStatus === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />}
              {mintStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
              {mintStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
              
              <span className={cn(
                "text-sm",
                mintStatus === 'success' && "text-green-400",
                mintStatus === 'error' && "text-red-400",
                mintStatus === 'pending' && "text-yellow-400"
              )}>
                {mintStatus === 'pending' && 'Mintando...'}
                {mintStatus === 'success' && mintSuccess}
                {mintStatus === 'error' && mintError}
              </span>
            </div>
          )}

          {/* Transaction Link */}
          {transactionHash && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://amoy.polygonscan.com/tx/${transactionHash}`, '_blank')}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Transação
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            className="flex-1 bg-transparent border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMint}
            disabled={!canMint || isMinting || !userAddress}
            className={cn(
              "flex-1 bg-gradient-to-r from-[#A20131] to-[#C41E3A]",
              "hover:from-[#8B0120] hover:to-[#A20131]",
              "text-white border-0"
            )}
          >
            {isMinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mintando...
              </>
            ) : (
              <>
                {mintType === 'gasless' ? (
                  <Rocket className="w-4 h-4 mr-2" />
                ) : quantity === 1 ? (
                  <Wallet className="w-4 h-4 mr-2" />
                ) : (
                  <Hash className="w-4 h-4 mr-2" />
                )}
                Mintar {quantity} NFT{quantity > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}