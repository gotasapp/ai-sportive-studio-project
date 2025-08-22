'use client'

import React, { useState } from 'react'
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react'
import { useWeb3 } from '@/lib/useWeb3'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Hash, Wallet, AlertTriangle, CheckCircle } from 'lucide-react'

interface UserPaidBatchMintProps {
  trigger: React.ReactNode
  nftName: string
  metadataUri: string
  collection: string
  disabled?: boolean
}

export function UserPaidBatchMint({ 
  trigger, 
  nftName, 
  metadataUri,
  collection,
  disabled = false 
}: UserPaidBatchMintProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(3)
  const [txHash, setTxHash] = useState<string>('')
  const [isComplete, setIsComplete] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string>('')
  
  const account = useActiveAccount()
  const chain = useActiveWalletChain()
  const { mintEditionWithMetadata } = useWeb3()

  const isConnected = !!account
  const isOnCorrectChain = chain?.id === 88888 // CHZ Mainnet

    const handleClose = () => {
    setOpen(false)
    setTxHash('')
    setIsComplete(false)
    setQuantity(3)
    setMintError('')
  }

  const estimatedGasCost = `~${(0.02 * quantity).toFixed(3)} POL`

  const handleMintNFT = async () => {
    if (!account) {
      setMintError('Please connect your wallet first')
      return
    }

    if (!isOnCorrectChain) {
      setMintError('Please switch to CHZ Mainnet network')
      return
    }

    setIsMinting(true)
    setMintError('')

    try {
      console.log('🎯 Starting user-paid mint:')
      console.log('📦 NFT Name:', nftName)
      console.log('👤 To:', account.address)
      console.log('🔢 Quantity:', quantity)
      console.log('💳 User pays gas')

      // Create metadata for the NFT
      const nftName_unique = `${nftName} #${Date.now()}`
      const nftDescription = `User-minted NFT from ${collection} collection. Original: ${nftName}`
      
      const attributes = [
        { trait_type: 'Collection', value: collection },
        { trait_type: 'Original Name', value: nftName },
        { trait_type: 'Minted By', value: account.address },
        { trait_type: 'Timestamp', value: new Date().toISOString() }
      ]

      // Create a minimal valid PNG image (1x1 transparent pixel)
      const pngBytes = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 55, 110, 249, 36, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 96, 0, 0, 0, 2, 0, 1, 229, 39, 222, 218, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
      ]);
      const placeholderImageBlob = new Blob([pngBytes], { type: 'image/png' })
      const imageFile = new File([placeholderImageBlob], `${nftName_unique}.png`, { type: 'image/png' })

      // Mint using Edition contract (ERC1155) - Direct mint, no claim conditions needed
      const result = await mintEditionWithMetadata(
        nftName_unique,
        nftDescription,
        imageFile,
        "0", // Token ID (0 for first edition)
        quantity, // Use the selected quantity
        attributes
      )

      console.log('✅ User-paid mint successful:', result)
      setTxHash(result.transactionHash)
      setIsComplete(true)

    } catch (error: any) {
      console.error('❌ User-paid mint failed:', error)
      setMintError(error.message || 'Minting failed')
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-black border border-white/20">
                 <DialogHeader>
           <DialogTitle className="text-white flex items-center gap-2">
             <Hash className="w-5 h-5 text-[#FF0052]" />
             Mint Collection (ERC1155)
           </DialogTitle>
         </DialogHeader>

        <div className="space-y-6">
          {/* Collection Info */}
          <div className="space-y-2">
            <Label className="text-white/80">Collection to Mint</Label>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white font-medium">{nftName}</p>
              <p className="text-white/60 text-sm">{collection} Collection</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Quantity</Label>
              <Badge variant="outline" className="text-[#FF0052] border-[#FF0052]/30">
                {quantity} Copies
              </Badge>
            </div>
            <Slider
              value={[quantity]}
              onValueChange={(value) => setQuantity(value[0])}
              max={20}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-white/60">
              <span>1 NFT</span>
              <span>20 NFTs</span>
            </div>
          </div>

          {/* Gas Cost Estimate */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Estimated Gas Cost: {estimatedGasCost}</span>
            </div>
            <p className="text-orange-300/80 text-xs mt-1">
              User pays transaction fees directly
            </p>
          </div>

          {/* Network Warning */}
          {!isOnCorrectChain && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Wrong Network</span>
              </div>
              <p className="text-red-300/80 text-xs mt-1">
                Please switch to Polygon Amoy Testnet
              </p>
            </div>
          )}

                     {/* Transaction Success */}
           {isComplete && txHash && (
             <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
               <div className="flex items-center gap-2 text-green-400">
                 <CheckCircle className="w-4 h-4" />
                 <span className="text-sm font-medium">Mint Successful!</span>
               </div>
               <p className="text-green-300/80 text-xs mt-1">
                 {quantity} copies minted successfully
               </p>
               <a
                 href={`https://amoy.polygonscan.com/tx/${txHash}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-xs mt-2"
               >
                 <span>View on Explorer</span>
                 <ExternalLink className="w-3 h-3" />
               </a>
             </div>
           )}

           {/* Error Display */}
           {mintError && (
             <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
               <div className="flex items-center gap-2 text-red-400">
                 <AlertTriangle className="w-4 h-4" />
                 <span className="text-sm font-medium">Mint Failed</span>
               </div>
               <p className="text-red-300/80 text-xs mt-1">
                 {mintError}
               </p>
             </div>
           )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-white/20 text-white/80 hover:bg-white/5"
            >
              Cancel
            </Button>
            
                                      {isConnected && isOnCorrectChain ? (
               <Button
                 onClick={handleMintNFT}
                 disabled={isMinting || isComplete}
                 className="flex-1 bg-[#FF0052] hover:bg-[#FF0052]/80 text-white disabled:opacity-50"
               >
                 {isMinting ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     <span>Minting...</span>
                   </div>
                 ) : isComplete ? (
                   'Mint Complete'
                 ) : (
                   `Mint ${quantity} Copies`
                 )}
               </Button>
             ) : (
               <Button disabled className="flex-1 bg-[#FF0052]/50 text-white/50">
                 {!isConnected 
                   ? 'Connect Wallet' 
                   : !isOnCorrectChain 
                     ? 'Wrong Network'
                     : 'Ready to Mint'
                 }
               </Button>
             )}
          </div>

                     {/* Info Footer */}
           <div className="text-xs text-white/60 space-y-1">
             <p>• User pays gas fees directly (no backend wallet)</p>
             <p>• Network: Polygon Amoy Testnet</p>
             <p>• Contract: {process.env.NEXT_PUBLIC_EDITION_AMOY_TESTNET?.slice(0, 8)}... (Edition ERC1155)</p>
             <p className="text-orange-400">• Note: This mints {quantity} copies of the same edition</p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 