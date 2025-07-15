'use client'

import React from 'react'
import { Rocket, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicMint } from '@/components/ui/public-mint'
import { cn } from '@/lib/utils'

interface SimpleActionBarProps {
  // Generation
  onGenerate: () => void
  isLoading: boolean
  canGenerate: boolean
  
  // NFT Data
  generatedImageBlob?: Blob
  nftName?: string
  nftDescription?: string
  collection?: string
  nftAttributes?: Array<{ trait_type: string; value: string }>
  
  // Connection
  isConnected: boolean
  isMinting?: boolean
}

export default function SimpleActionBar({
  onGenerate,
  isLoading,
  canGenerate,
  generatedImageBlob,
  nftName,
  nftDescription,
  collection,
  nftAttributes,
  isConnected,
  isMinting = false,
}: SimpleActionBarProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={!canGenerate || isLoading}
        className={cn(
          "h-12 px-6 text-base font-medium transition-all duration-200",
          "bg-[#A20131] hover:bg-[#A20131]/90 text-white",
          "disabled:opacity-50 disabled:cursor-not-allowed w-full"
        )}
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Rocket className="w-5 h-5" />
          )}
          <span>{isLoading ? 'Generating...' : 'Generate NFT'}</span>
        </div>
      </Button>

      {/* Mint Button - Only show when image is generated */}
      {isConnected && generatedImageBlob && nftName && (
        <PublicMint
          name={nftName}
          description={nftDescription || `AI-generated ${collection || 'NFT'} created with CHZ Fan Token Studio`}
          imageBlob={generatedImageBlob}
          attributes={nftAttributes || [
            { trait_type: 'Generator', value: 'AI Sports NFT' },
            { trait_type: 'Collection', value: collection || 'General' },
            { trait_type: 'Type', value: 'Public Mint' }
          ]}
          disabled={isMinting}
        />
      )}
    </div>
  )
} 