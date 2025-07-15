'use client'

import React, { useState } from 'react'
import { 
  useActiveAccount, 
  useSendTransaction,
  useActiveWallet
} from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Wallet,
  Zap,
  Hash
} from 'lucide-react'
import { client } from '@/lib/client'
import { polygonAmoy } from "thirdweb/chains"

// Endereço do contrato NFT
const NFT_CONTRACT_ADDRESS = "0xfF973a4aFc5A96DEc81366461A461824c4f80254"

interface PublicMintProps {
  imageBlob: Blob
  name: string
  description: string
  attributes?: Array<{ trait_type: string; value: string }>
  disabled?: boolean
  onSuccess?: (result: { transactionHash: string }) => void
  onError?: (error: string) => void
}

export function PublicMint({
  imageBlob,
  name,
  description,
  attributes = [],
  disabled = false,
  onSuccess,
  onError
}: PublicMintProps) {
  const account = useActiveAccount()
  const wallet = useActiveWallet()
  const [status, setStatus] = useState<'idle' | 'uploading' | 'minting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [open, setOpen] = useState(false)

  const { mutate: sendTransaction } = useSendTransaction()

  const resetState = () => {
    setStatus('idle')
    setError(null)
    setTransactionHash(null)
    setIpfsUrl(null)
  }

  const getExplorerUrl = (hash: string) => {
    return `https://amoy.polygonscan.com/tx/${hash}`
  }

  const handleMint = async () => {
    if (!account) {
      setError('Conecte sua wallet primeiro')
      return
    }

    if (!imageBlob) {
      setError('Imagem não encontrada')
      return
    }

    setStatus('uploading')
    setError(null)

    try {
      // 1. Upload image to IPFS
      console.log('📤 Uploading image to IPFS...')
      const imageFormData = new FormData()
      imageFormData.append('file', new File([imageBlob], `${name}.png`, { type: 'image/png' }))

      const imageResponse = await fetch('/api/ipfs-upload', {
        method: 'POST',
        body: imageFormData
      })

      if (!imageResponse.ok) {
        throw new Error('Falha no upload da imagem')
      }

      const { ipfsUrl: imageUrl } = await imageResponse.json()
      setIpfsUrl(imageUrl)
      console.log('✅ Image uploaded:', imageUrl)

      // 2. Criar metadata completa
      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes: attributes || []
      }

      // 3. Upload metadata para IPFS
      console.log('📤 Uploading metadata to IPFS...')
      const metadataResponse = await fetch('/api/ipfs-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: metadata,
          type: 'metadata'
        })
      })

      if (!metadataResponse.ok) {
        throw new Error('Falha no upload dos metadados')
      }

      const { ipfsUrl: metadataUri } = await metadataResponse.json()
      console.log('✅ Metadata uploaded:', metadataUri)

      setStatus('minting')

      // 4. Preparar contrato diretamente para mint
      console.log('🚀 Preparing mint transaction...')
      const contract = getContract({
        client,
        chain: polygonAmoy,
        address: NFT_CONTRACT_ADDRESS
      })

      // 5. Preparar transação simples usando mintTo
      console.log('📝 Preparing direct mint...')
      const transaction = prepareContractCall({
        contract,
        method: "function mintTo(address to, string uri)",
        params: [account.address, metadataUri]
      })

      console.log('🚀 Sending mint transaction...')

      // 6. Enviar transação diretamente (usuário paga gas)
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('✅ Mint successful!', result)
          setTransactionHash(result.transactionHash)
          setStatus('success')
          onSuccess?.({ 
            transactionHash: result.transactionHash 
          })
        },
        onError: (error) => {
          console.error('❌ Mint failed:', error)
          setError(error.message || 'Falha no mint')
          setStatus('error')
          onError?.(error.message || 'Falha no mint')
        }
      })

    } catch (error: any) {
      console.error('❌ Error during mint process:', error)
      setError(error.message || 'Erro desconhecido')
      setStatus('error')
      onError?.(error.message || 'Erro desconhecido')
    }
  }

  const isLoading = status === 'uploading' || status === 'minting'
  const isDisabled = disabled || isLoading || !account

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isDisabled}
          variant="outline"
          className="h-10 px-4 text-sm font-medium transition-all duration-200 bg-[#A20131]/10 border-[#A20131]/30 text-[#A20131] hover:bg-[#A20131]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span>Mint Batch</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mint NFT Batch</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* NFT Info */}
          <div className="p-3 bg-gray-900/20 border border-gray-700/20 rounded-lg">
            <h3 className="text-sm font-medium text-white">{name}</h3>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Quantidade:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full p-2 bg-gray-900/50 border border-gray-700/30 rounded-md text-white"
              disabled={isLoading}
            />
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Erro</span>
              </div>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          )}

          {status === 'success' && transactionHash && (
            <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Sucesso!</span>
                </div>
                <a
                  href={getExplorerUrl(transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                >
                  <span>Ver no Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-sm text-green-300 mt-1">
                {quantity} NFT{quantity > 1 ? 's' : ''} mintado{quantity > 1 ? 's' : ''} com sucesso!
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleMint}
            disabled={isDisabled}
            className="w-full h-12 bg-[#A20131] hover:bg-[#A20131]/90 text-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {status === 'uploading' ? 'Fazendo Upload...' : 'Mintando...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Mint {quantity} NFT{quantity > 1 ? 's' : ''}</span>
              </div>
            )}
          </Button>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center">
            Mint público: você paga a gas, nft vai para sua carteira
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 