import { useQuery } from '@tanstack/react-query'

interface NFTData {
  tokenId: string
  name: string
  description: string
  image: string
  imageHttp: string
  owner: string
  metadata: any
  attributes: any[]
  contractAddress: string
  chainId: number
  lastUpdated: Date
  createdAt: Date
}

interface NFTOwner {
  tokenId: string
  owner: string
}

interface APIResponse<T> {
  success: boolean
  data: T
  source: 'cache' | 'thirdweb' | 'stale_cache'
  cached_at: Date
  warning?: string
}

// Hook para dados completos do NFT
export function useNFTData(tokenId: string | null) {
  return useQuery<APIResponse<NFTData>>({
    queryKey: ['nft', tokenId],
    queryFn: async () => {
      if (!tokenId) throw new Error('Token ID is required')
      
      const response = await fetch(`/api/nft/${tokenId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFT ${tokenId}`)
      }
      
      return response.json()
    },
    enabled: !!tokenId && tokenId !== '0',
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook para owner do NFT (mais dinâmico)
export function useNFTOwner(tokenId: string | null) {
  return useQuery<APIResponse<NFTOwner>>({
    queryKey: ['nft-owner', tokenId],
    queryFn: async () => {
      if (!tokenId) throw new Error('Token ID is required')
      
      const response = await fetch(`/api/nft/${tokenId}/owner`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFT ${tokenId} owner`)
      }
      
      return response.json()
    },
    enabled: !!tokenId && tokenId !== '0',
    staleTime: 2 * 60 * 1000, // 2 minutos (owner muda mais frequentemente)
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 1000,
  })
}

// Hook combinado para usar quando precisar de ambos
export function useNFTComplete(tokenId: string | null) {
  const nftQuery = useNFTData(tokenId)
  const ownerQuery = useNFTOwner(tokenId)
  
  return {
    nft: nftQuery.data?.data,
    owner: ownerQuery.data?.data?.owner,
    isLoading: nftQuery.isLoading || ownerQuery.isLoading,
    isError: nftQuery.isError || ownerQuery.isError,
    error: nftQuery.error || ownerQuery.error,
    // Informações de cache
    nftSource: nftQuery.data?.source,
    ownerSource: ownerQuery.data?.source,
    nftCachedAt: nftQuery.data?.cached_at,
    ownerCachedAt: ownerQuery.data?.cached_at,
    // Warnings
    hasWarning: !!(nftQuery.data?.warning || ownerQuery.data?.warning),
    warnings: [nftQuery.data?.warning, ownerQuery.data?.warning].filter(Boolean),
    // Refetch functions
    refetchNFT: nftQuery.refetch,
    refetchOwner: ownerQuery.refetch,
    refetchAll: () => {
      nftQuery.refetch()
      ownerQuery.refetch()
    }
  }
}

// Hook para múltiplos NFTs (batch)
export function useNFTBatch(tokenIds: string[]) {
  return useQuery({
    queryKey: ['nft-batch', tokenIds.sort().join(',')],
    queryFn: async () => {
      const promises = tokenIds.map(tokenId => 
        fetch(`/api/nft/${tokenId}`).then(res => res.json())
      )
      
      const results = await Promise.all(promises)
      return results
    },
    enabled: tokenIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}

// Utility para invalidar cache
export function useInvalidateNFTCache() {
  const queryClient = useQueryClient()
  
  return {
    invalidateNFT: (tokenId: string) => {
      queryClient.invalidateQueries({ queryKey: ['nft', tokenId] })
      queryClient.invalidateQueries({ queryKey: ['nft-owner', tokenId] })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['nft'] })
      queryClient.invalidateQueries({ queryKey: ['nft-owner'] })
    }
  }
}

// Para usar no React Query Provider
import { useQueryClient } from '@tanstack/react-query' 