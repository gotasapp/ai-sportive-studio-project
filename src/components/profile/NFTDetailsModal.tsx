'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Copy, 
  ExternalLink, 
  User, 
  Calendar, 
  Hash,
  Tag,
  Wallet,
  Image as ImageIcon,
  Trophy,
  Shield,
  Globe,
  Loader2
} from 'lucide-react'
import { useActiveWalletChain } from 'thirdweb/react'

interface NFTDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  tokenId: string
  nft?: {
    id: string
    name: string
    imageUrl: string
    price?: string
    status: 'owned' | 'listed' | 'sold' | 'created'
    createdAt: string
    collection: 'jerseys' | 'stadiums' | 'badges'
  }
}

function convertIpfsToHttp(ipfsUrl: string): string {
  if (!ipfsUrl) return ''
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  return ipfsUrl
}

export function NFTDetailsModal({ 
  isOpen, 
  onClose, 
  tokenId, 
  nft 
}: NFTDetailsModalProps) {
  const chain = useActiveWalletChain()
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      owned: { variant: 'default' as const, color: 'bg-[#A20131]/20 text-[#A20131]' },
      listed: { variant: 'secondary' as const, color: 'bg-[#FDFDFD]/20 text-[#FDFDFD]' },
      sold: { variant: 'outline' as const, color: 'bg-[#FDFDFD]/10 text-[#FDFDFD]/70' },
      created: { variant: 'default' as const, color: 'bg-[#A20131]/20 text-[#A20131]' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.owned
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getCollectionIcon = (collection: string) => {
    switch (collection) {
      case 'jerseys': return <ImageIcon className="h-4 w-4" />
      case 'stadiums': return <Trophy className="h-4 w-4" />
      case 'badges': return <Shield className="h-4 w-4" />
      default: return <ImageIcon className="h-4 w-4" />
    }
  }

  const getExplorerUrl = (chainId: number, tokenId: string) => {
    switch (chainId) {
      case 80002: // Polygon Amoy
        return `https://amoy.polygonscan.com/token/0xfF973a4aFc5A96DEc81366461A461824c4f80254?a=${tokenId}`
      case 137: // Polygon Mainnet
        return `https://polygonscan.com/token/0xfF973a4aFc5A96DEc81366461A461824c4f80254?a=${tokenId}`
      case 88888: // CHZ Mainnet
        return `https://scan.chiliz.com/token/0x3db78Cf4543cff5c4f514bcDA5a56c3234d5EC78?a=${tokenId}`
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#14101e] border-[#FDFDFD]/20 text-[#FDFDFD] max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD] flex items-center gap-2">
            {nft && getCollectionIcon(nft.collection)}
            {nft?.name || `NFT #${tokenId}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-[#FDFDFD]/10">
              <img 
                src={convertIpfsToHttp(nft?.imageUrl || '')}
                alt={nft?.name || `NFT #${tokenId}`}
                className="w-full h-full object-cover"
              />
              {nft?.status && (
                <div className="absolute top-3 right-3">
                  {getStatusBadge(nft.status)}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
                onClick={() => copyToClipboard(tokenId, 'Token ID')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedText === 'Token ID' ? 'Copied!' : 'Copy ID'}
              </Button>
              
              {chain && getExplorerUrl(chain.id, tokenId) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
                  onClick={() => window.open(getExplorerUrl(chain.id, tokenId), '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explorer
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Basic Info */}
              <Card className="bg-transparent border-[#FDFDFD]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#FDFDFD] text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Token ID
                    </span>
                    <span className="text-[#FDFDFD] font-mono">#{tokenId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Network
                    </span>
                    <span className="text-[#FDFDFD]">
                      {chain?.name || 'Unknown'}
                    </span>
                  </div>

                  {nft?.collection && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Collection
                      </span>
                      <span className="text-[#FDFDFD] capitalize">{nft.collection}</span>
                    </div>
                  )}

                  {nft?.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Price
                      </span>
                      <span className="text-[#A20131] font-medium">{nft.price} CHZ</span>
                    </div>
                  )}

                  {nft?.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </span>
                      <span className="text-[#FDFDFD]">
                        {new Date(nft.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card className="bg-transparent border-[#FDFDFD]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#FDFDFD] text-lg">Technical</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#FDFDFD]/70">Contract</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#FDFDFD] font-mono text-sm">
                        0xfF97...8254
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard('0xfF973a4aFc5A96DEc81366461A461824c4f80254', 'Contract')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#FDFDFD]/70">Chain ID</span>
                    <span className="text-[#FDFDFD] font-mono">{chain?.id || 'Unknown'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#FDFDFD]/70">Token Standard</span>
                    <span className="text-[#FDFDFD]">ERC-721</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 