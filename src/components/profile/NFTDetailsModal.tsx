'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Trophy,
  Shield,
  DollarSign
} from 'lucide-react'
import { useActiveWalletChain } from 'thirdweb/react'
import { normalizeIpfsUri, convertIpfsToHttp } from '@/lib/utils';

interface NFTDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  tokenId: string
  contractAddress?: string
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

interface NFTData {
  tokenId: string
  name: string
  description: string
  imageUrl: string
  attributes: Array<{ trait_type: string; value: string }>
  owner: string
  creator?: string
  contractAddress: string
  chainId: number
  createdAt: string
  lastUpdated: string
  cached: boolean
  source: 'cache' | 'thirdweb' | 'fallback'
}

// Use global convertIpfsToHttp from utils

export function NFTDetailsModal({ 
  isOpen, 
  onClose, 
  tokenId, 
        contractAddress,
  nft 
}: NFTDetailsModalProps) {
  const chain = useActiveWalletChain()
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [nftData, setNftData] = useState<NFTData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNFTData = useCallback(async () => {
    if (!tokenId) return

    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔄 Loading NFT data for token ${tokenId}...`)

      // Primeiro, tentar a API otimizada
      const response = await fetch(`/api/nft/${tokenId}`)
      const result = await response.json()

      if (result.success) {
        console.log(`✅ NFT data loaded from API (source: ${result.source})`)
        
        // Mapear campos de imagem da API para o formato esperado pelo modal
        let imageUrl = result.data.imageHttp || result.data.image || result.data.imageUrl || ''
        
        // USAR A MESMA LÓGICA DO MARKETPLACE: sempre usar o imageUrl diretamente
        // O marketplace funciona, então vamos usar a mesma estratégia
        
        const mappedData = {
          ...result.data,
          imageUrl: imageUrl
        }
        
        console.log(`🖼️ Image mapping for token ${tokenId}:`)
        console.log(`- API imageHttp: ${result.data.imageHttp}`)
        console.log(`- API image: ${result.data.image}`)
        console.log(`- API imageUrl: ${result.data.imageUrl}`)
        console.log(`- Final imageUrl: ${imageUrl}`)
        
        console.log('🎯 Attributes debug:', {
          hasAttributes: !!mappedData.attributes,
          attributesLength: mappedData.attributes?.length || 0,
          attributes: mappedData.attributes,
          fullData: mappedData
        });
        
        setNftData(mappedData)
        return
      }

      // Fallback: se a API falhar, criar dados básicos do NFT que já temos
      console.log(`⚠️ API failed, using fallback data for token ${tokenId}`)
      
      const fallbackData: NFTData = {
        tokenId,
        name: nft?.name || `NFT #${tokenId}`,
        description: `This is ${nft?.name || `NFT #${tokenId}`} from the ${nft?.collection || 'CHZ'} collection.`,
        imageUrl: nft?.imageUrl || '',
        attributes: [],
        owner: 'Unknown',
        contractAddress: nftData?.contractAddress || contractAddress || '',
        chainId: 80002,
        createdAt: nft?.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        cached: false,
        source: 'fallback'
      }

      setNftData(fallbackData)
      console.log(`✅ Using fallback data for NFT ${tokenId}`)

    } catch (error: any) {
      console.error('❌ Error loading NFT data:', error)
      
      // Último fallback: sempre mostrar algo
      const emergencyFallback: NFTData = {
        tokenId,
        name: nft?.name || `NFT #${tokenId}`,
        description: 'Failed to load detailed information for this NFT.',
        imageUrl: nft?.imageUrl || '',
        attributes: [],
        owner: 'Unknown',
        contractAddress: nftData?.contractAddress || contractAddress || '',
        chainId: 80002,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        cached: false,
        source: 'fallback'
      }
      
      setNftData(emergencyFallback)
      console.log(`🚨 Using emergency fallback for NFT ${tokenId}`)
    } finally {
      setIsLoading(false)
    }
  }, [tokenId, nft])

  // Load NFT data when modal opens
  useEffect(() => {
    if (isOpen && tokenId) {
      loadNFTData()
    }
  }, [isOpen, tokenId, loadNFTData])

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

  const getExplorerUrl = (chainId: number, tokenId: string): string => {
    switch (chainId) {
      case 80002: // Polygon Amoy
        return `https://amoy.polygonscan.com/token/${contractAddress}?a=${tokenId}`
      case 137: // Polygon Mainnet
        return `https://polygonscan.com/token/${contractAddress}?a=${tokenId}`
      case 88888: // CHZ Mainnet
        return `https://scan.chiliz.com/token/${contractAddress}?a=${tokenId}`
      default:
        return `https://amoy.polygonscan.com/token/${contractAddress}?a=${tokenId}` // fallback
    }
  }

  const hasExplorerSupport = (chainId: number): boolean => {
    return [80002, 137, 88888].includes(chainId)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  const displayData = nftData || nft

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#14101e] border-[#FDFDFD]/20 text-[#FDFDFD] max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[#FDFDFD] flex items-center gap-2">
            {displayData && getCollectionIcon((displayData as any).collection || 'jerseys')}
            {displayData?.name || `NFT #${tokenId}`}
            {nftData?.cached && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Cached
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-[#FDFDFD]/70">
            View detailed information about this NFT including basic details and attributes.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#A20131] mx-auto mb-4" />
              <p className="text-[#FDFDFD]/70">Loading NFT details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button 
                onClick={loadNFTData}
                variant="outline"
                className="border-[#FDFDFD]/20 text-[#FDFDFD] hover:bg-[#FDFDFD]/10"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left Column - Image */}
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-[#FDFDFD]/10">
                {(displayData?.imageUrl || nftData?.imageUrl) ? (
                  <img
                    key={displayData?.imageUrl || nftData?.imageUrl || ''}
                    src={(() => {
                      const imageUrl = displayData?.imageUrl || nftData?.imageUrl || '';
                      // Se já é URL do Cloudinary, usar diretamente
                      if (imageUrl.includes('cloudinary.com')) {
                        return imageUrl;
                      }
                      // Caso contrário, normalizar IPFS com gateways múltiplos
                      return convertIpfsToHttp(imageUrl);
                    })()}
                    alt={displayData?.name || `NFT #${tokenId}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    onError={e => { 
                      // Fallback para placeholder inline SVG (não causa loop)
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTQxMDFlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5GVCBJbWFnZTwvdGV4dD48L3N2Zz4='; 
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Loading NFT...</div>
                )}
                {(displayData as any)?.status && (
                  <div className="absolute top-3 right-3">
                    {getStatusBadge((displayData as any).status)}
                  </div>
                )}
              </div>

              {/* Copy ID e Explorer */}
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
                
                {chain && hasExplorerSupport(chain.id) && (
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

                    {(displayData as any)?.collection && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Collection
                        </span>
                        <span className="text-[#FDFDFD] capitalize">{(displayData as any).collection}</span>
                      </div>
                    )}

                    {(displayData as any)?.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Price
                        </span>
                        <span className="text-[#A20131] font-semibold">{(displayData as any).price}</span>
                      </div>
                    )}

                    {nftData?.owner && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Owner
                        </span>
                        <span className="text-[#FDFDFD] font-mono text-sm">
                          {nftData.owner.slice(0, 6)}...{nftData.owner.slice(-4)}
                        </span>
                      </div>
                    )}

                    {nftData?.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#FDFDFD]/70 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Created
                        </span>
                        <span className="text-[#FDFDFD] text-sm">
                          {formatDate(nftData.createdAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Attributes - Debug Version */}
                <Card className="bg-transparent border-[#FDFDFD]/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#FDFDFD] text-lg">Attributes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nftData?.attributes && nftData.attributes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {nftData.attributes.map((attr, index) => (
                          <div key={index} className="bg-[#FDFDFD]/5 rounded-lg p-3">
                            <div className="text-[#FDFDFD]/60 text-xs uppercase tracking-wide">
                              {attr.trait_type}
                            </div>
                            <div className="text-[#FDFDFD] font-medium mt-1">
                              {attr.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#FDFDFD]/50">
                        <div className="text-sm">
                          {!nftData ? 'Loading attributes...' : 
                           !nftData.attributes ? 'No attributes property found' :
                           nftData.attributes.length === 0 ? 'No attributes available' :
                           'Unknown attributes state'}
                        </div>
                        {nftData && (
                          <div className="text-xs mt-2 text-gray-400">
                            Debug: hasAttributes={!!nftData.attributes}, length={nftData.attributes?.length || 0}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 