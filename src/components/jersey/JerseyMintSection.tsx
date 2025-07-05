'use client'

import React from 'react'
import { Wallet, Zap, Upload, ExternalLink, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTransactionUrl } from '../../lib/utils'

interface JerseyMintSectionProps {
  // Wallet & Network
  isConnected: boolean
  address?: string
  chainId?: number
  isOnSupportedChain: boolean
  isOnChzChain: boolean
  isOnPolygonChain: boolean
  
  // Image & IPFS
  generatedImage: string | null
  ipfsUrl: string | null
  isUploadingToIPFS: boolean
  ipfsError: string | null
  onUploadToIPFS: () => void
  
  // Minting
  canMintLegacy: boolean
  canMintGasless: boolean
  isMinting: boolean
  mintError: string | null
  mintSuccess: string | null
  mintStatus: 'idle' | 'pending' | 'success' | 'error'
  transactionHash: string | null
  onMintLegacy: () => void
  onMintGasless: () => void
  
  // Admin
  isUserAdmin: boolean
  
  // Jersey Info
  selectedTeam: string
  playerName: string
  playerNumber: string
  royalties: number
  editionSize: number
  setRoyalties: (value: number) => void
  setEditionSize: (value: number) => void
}

export default function JerseyMintSection({
  isConnected,
  address,
  chainId,
  isOnSupportedChain,
  isOnChzChain,
  isOnPolygonChain,
  generatedImage,
  ipfsUrl,
  isUploadingToIPFS,
  ipfsError,
  onUploadToIPFS,
  canMintLegacy,
  canMintGasless,
  isMinting,
  mintError,
  mintSuccess,
  mintStatus,
  transactionHash,
  onMintLegacy,
  onMintGasless,
  isUserAdmin,
  selectedTeam,
  playerName,
  playerNumber,
  royalties,
  editionSize,
  setRoyalties,
  setEditionSize
}: JerseyMintSectionProps) {
  
  const getChainName = () => {
    if (isOnChzChain) return 'CHZ Chain'
    if (isOnPolygonChain) return 'Polygon'
    return 'Unknown Network'
  }

  const getMintStatusColor = () => {
    switch (mintStatus) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getMintStatusIcon = () => {
    switch (mintStatus) {
      case 'success': return <Check className="w-4 h-4" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      case 'pending': return <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      default: return null
    }
  }

  if (!generatedImage) {
    return (
      <div className="w-full max-w-md bg-gray-900/30 border border-gray-700 rounded-xl p-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6 text-gray-600" />
          </div>
          <div className="space-y-1">
            <div className="text-gray-400 font-medium">Generate jersey first</div>
            <div className="text-gray-500 text-sm">
              Create your jersey before minting as NFT
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Wallet Status */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Wallet Status</span>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          {isConnected && (
            <>
              <div className="text-xs text-gray-500 truncate">
                {address}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network</span>
                <span className={`text-xs ${isOnSupportedChain ? 'text-green-400' : 'text-yellow-400'}`}>
                  {getChainName()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* IPFS Upload Section */}
      {!ipfsUrl && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Upload className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Upload to IPFS</span>
          </div>
          
          <Button
            onClick={onUploadToIPFS}
            disabled={isUploadingToIPFS}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isUploadingToIPFS ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload to IPFS</span>
              </div>
            )}
          </Button>
          
          {ipfsError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 text-sm">{ipfsError}</div>
            </div>
          )}
        </div>
      )}

      {/* IPFS Success */}
      {ipfsUrl && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Uploaded to IPFS</span>
          </div>
          <div className="text-xs text-gray-400 truncate">{ipfsUrl}</div>
        </div>
      )}

      {/* Mint Configuration */}
      {ipfsUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Royalties (%)</label>
              <input
                type="number"
                value={royalties}
                onChange={(e) => setRoyalties(Number(e.target.value))}
                min="0"
                max="25"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Edition Size</label>
              <input
                type="number"
                value={editionSize}
                onChange={(e) => setEditionSize(Number(e.target.value))}
                min="1"
                max="10000"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mint Buttons */}
      {ipfsUrl && (
        <div className="space-y-3">
          {/* Gasless Mint (Admin Only) */}
          {isUserAdmin && (
            <Button
              onClick={onMintGasless}
              disabled={!canMintGasless || isMinting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isMinting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Minting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Gasless Mint (Admin)</span>
                </div>
              )}
            </Button>
          )}

          {/* Legacy Mint */}
          <Button
            onClick={onMintLegacy}
            disabled={!canMintLegacy || isMinting}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          >
            {isMinting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Minting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Mint NFT</span>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Mint Status */}
      {mintStatus !== 'idle' && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
          <div className={`flex items-center space-x-2 ${getMintStatusColor()}`}>
            {getMintStatusIcon()}
            <span className="font-medium">
              {mintStatus === 'pending' && 'Minting in progress...'}
              {mintStatus === 'success' && 'Mint successful!'}
              {mintStatus === 'error' && 'Mint failed'}
            </span>
          </div>

          {mintSuccess && (
            <div className="mt-2 text-green-400 text-sm">{mintSuccess}</div>
          )}

          {mintError && (
            <div className="mt-2 text-red-400 text-sm">{mintError}</div>
          )}

          {transactionHash && (
            <div className="mt-3">
              <a
                href={getTransactionUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 text-sm"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View Transaction</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Network Warning */}
      {isConnected && !isOnSupportedChain && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Unsupported Network</span>
          </div>
          <div className="text-yellow-300 text-sm mt-1">
            Please switch to CHZ Chain or Polygon to mint NFTs
          </div>
        </div>
      )}
    </div>
  )
} 