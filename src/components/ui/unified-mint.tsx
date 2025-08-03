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
  ExternalLink 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UnifiedMintProps {
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
  onPublicMint: (quantity: number) => Promise<void>
  onGaslessMint: (quantity: number) => Promise<void>
  
  // Loading states
  isMinting: boolean
  mintStatus: 'idle' | 'pending' | 'success' | 'error'
  mintSuccess?: string | null
  mintError?: string | null
  transactionHash?: string | null
}

export function UnifiedMint({
  imageBlob,
  metadata,
  isConnected,
  isUserAdmin,
  userAddress,
  onPublicMint,
  onGaslessMint,
  isMinting,
  mintStatus,
  mintSuccess,
  mintError,
  transactionHash
}: UnifiedMintProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [mintType, setMintType] = useState<'public' | 'gasless'>('public')

  const handleMint = async () => {
    try {
      if (mintType === 'gasless' && isUserAdmin) {
        await onGaslessMint(quantity)
      } else {
        await onPublicMint(quantity)
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Mint failed:', error)
    }
  }

  const canMint = imageBlob && metadata.name && isConnected
  const maxQuantity = 100

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
      
      <DialogContent className="sm:max-w-[425px] bg-[#0B0B0F] border-[#FDFDFD]/20">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD]">Mint NFT Collection</DialogTitle>
          <DialogDescription className="text-[#ADADAD]">
            Create NFTs with the same metadata. Choose quantity (1-{maxQuantity}) and mint type.
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
              <p className="text-[#ADADAD] text-sm">{metadata.description}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right text-[#FDFDFD]">
              Quantity
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
              />
              <p className="text-xs text-[#ADADAD] mt-1">
                All NFTs will have identical metadata
              </p>
            </div>
          </div>

          {/* Mint Type Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-[#FDFDFD]">
              Type
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
                Public (Pay Gas)
              </Badge>
              
              {isUserAdmin && (
                <Badge 
                  variant={mintType === 'gasless' ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer px-3 py-1",
                    mintType === 'gasless' 
                      ? "bg-[#A20131] text-white" 
                      : "bg-transparent border-[#FDFDFD]/20 text-[#ADADAD] hover:bg-[#A20131]/10"
                  )}
                  onClick={() => setMintType('gasless')}
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  Gasless (Admin)
                </Badge>
              )}
            </div>
          </div>

          {/* Mint Info */}
          <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#FDFDFD]/10">
            <div className="flex justify-between text-sm">
              <span className="text-[#ADADAD]">Contract Type:</span>
              <span className="text-[#FDFDFD]">OpenEditionERC721</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#ADADAD]">Total to Mint:</span>
              <span className="text-[#FDFDFD]">{quantity} NFT{quantity > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#ADADAD]">Gas Fee:</span>
              <span className="text-[#FDFDFD]">
                {mintType === 'gasless' ? 'Free (Admin)' : 'Paid by user'}
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
                {mintStatus === 'pending' && 'Minting in progress...'}
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
              View Transaction
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
            Cancel
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
                Minting...
              </>
            ) : (
              <>
                {mintType === 'gasless' ? (
                  <Rocket className="w-4 h-4 mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Mint {quantity} NFT{quantity > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}