'use client'

import React from 'react'
import { Wallet, Zap, Upload, ExternalLink, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTransactionUrl } from '../../lib/utils'
import { RequireWallet } from '@/components/RequireWallet'
import { toast } from 'sonner';
import { useEffect } from 'react';

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
  
  // Force Network (para teste)
  forceNetwork?: 'polygon-amoy' | 'chz'
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
  setEditionSize,
  forceNetwork
}: JerseyMintSectionProps) {
  
  const getChainName = () => {
    if (forceNetwork === 'polygon-amoy') return 'Polygon Amoy (Test)'
    if (forceNetwork === 'chz') return 'CHZ Chain (Test)'
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

  useEffect(() => {
    if (mintStatus === 'success' && mintSuccess) {
      toast.success('NFT minted successfully!');
    }
  }, [mintStatus, mintSuccess]);

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
      {/* Force Network Warning */}
      {forceNetwork && (
        <div className="bg-yellow-600/20 border border-yellow-500 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Test Mode Active</span>
          </div>
          <p className="text-yellow-100 text-xs mt-1">
            {forceNetwork === 'polygon-amoy' 
              ? 'Forcing mint to Polygon Amoy for marketplace testing'
              : 'Forcing mint to CHZ for testing'
            }
          </p>
        </div>
      )}

      {/* Network Status - Show only when connected */}
      {isConnected && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
          <div className="space-y-3">
            <div className="text-xs text-gray-500 truncate">
              {address}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Network</span>
              <span className={`text-xs ${forceNetwork ? 'text-yellow-400' : (isOnSupportedChain ? 'text-green-400' : 'text-red-400')}`}>
                {getChainName()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Jersey Info */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Jersey Details</div>
          <div className="space-y-1">
            <div className="text-white text-sm">{selectedTeam} {playerName} #{playerNumber}</div>
            <div className="text-gray-500 text-xs">Edition Size: {editionSize} | Royalties: {royalties}%</div>
          </div>
        </div>
      </div>

      {/* IPFS Upload Section */}
      {!ipfsUrl && (
        <RequireWallet
          title="Connect to Upload"
          message="Connect your wallet to upload your jersey image to IPFS storage."
          feature="IPFS upload"
        >
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
        </RequireWallet>
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
        <RequireWallet
          title="Connect to Mint NFT"
          message="Connect your wallet to mint your jersey as an NFT on the blockchain."
          feature="NFT minting"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Royalties (%)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={royalties}
                  onChange={(e) => setRoyalties(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Edition Size</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editionSize}
                  onChange={(e) => setEditionSize(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Mint Buttons */}
            <div className="space-y-3">
              {/* Legacy Mint (User Pays Gas) */}
              <Button
                onClick={onMintLegacy}
                disabled={!canMintLegacy || isMinting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50"
              >
                {isMinting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Minting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4" />
                    <span>
                      {forceNetwork === 'polygon-amoy' 
                        ? 'Mint on Polygon Amoy' 
                        : 'Mint NFT (User Pays Gas)'
                      }
                    </span>
                  </div>
                )}
              </Button>

              {/* Engine Gasless Mint (Admin Only) */}
              {isUserAdmin && canMintGasless && (
                <Button
                  onClick={onMintGasless}
                  disabled={isMinting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Engine Mint (Gasless)</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Mint Status */}
            {mintStatus !== 'idle' && (
              <div className="space-y-3">
                <div className={`flex items-center space-x-2 ${getMintStatusColor()}`}>
                  {getMintStatusIcon()}
                  <span className="text-sm font-medium">
                    {mintStatus === 'pending' && 'Minting in progress...'}
                    {mintStatus === 'success' && 'NFT minted successfully!'}
                    {mintStatus === 'error' && 'Mint failed'}
                  </span>
                </div>

                {mintError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="text-red-400 text-sm">{mintError}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </RequireWallet>
      )}
    </div>
  )
} 