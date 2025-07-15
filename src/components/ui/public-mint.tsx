'use client'

import React, { useState } from 'react'
import { 
  useActiveAccount, 
  useSendTransaction,
  useActiveWallet
} from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Wallet,
  Zap
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

  const { mutate: sendTransaction } = useSendTransaction()

  const resetState = () => {
    setStatus('idle')
    setError(null)
    setTransactionHash(null)
    setIpfsUrl(null)
  }

  const handleMint = async () => {
    if (!account || !wallet) {
      setError('Conecte sua carteira primeiro')
      return
    }

    try {
      resetState()
      setStatus('uploading')

      // 1. Upload da imagem para IPFS
      console.log('📤 Uploading image to IPFS...')
      const formData = new FormData()
      formData.append('file', imageBlob, 'nft-image.png')

      const uploadResponse = await fetch('/api/ipfs-upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload da imagem')
      }

      const { ipfsUrl: imageUrl } = await uploadResponse.json()
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

      // 4. Preparar contrato
      const contract = getContract({
        client,
        chain: polygonAmoy,
        address: NFT_CONTRACT_ADDRESS
      })

      // 5. Preparar transação de mint usando a assinatura correta
      console.log('📝 Preparing mint transaction...')
      const transaction = prepareContractCall({
        contract,
        method: "function mintTo(address to, string uri)",
        params: [account.address, metadataUri]
      })

      console.log('🚀 Sending mint transaction...')

      // 6. Enviar transação
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

  const getExplorerUrl = (hash: string) => {
    return `https://amoy.polygonscan.com/tx/${hash}`
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'uploading':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Fazendo upload para IPFS...',
          color: 'bg-blue-500'
        }
      case 'minting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Mintando NFT...',
          color: 'bg-purple-500'
        }
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'NFT mintado com sucesso!',
          color: 'bg-green-500'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Erro no mint',
          color: 'bg-red-500'
        }
      default:
        return {
          icon: <Zap className="h-4 w-4" />,
          text: 'Mint Público',
          color: 'bg-[#A20131]'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const isLoading = status === 'uploading' || status === 'minting'
  const isDisabled = disabled || isLoading || !account

  return (
    <Card className="cyber-card">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Mint Público</h3>
          <Badge variant="outline" className="cyber-border">
            Usuário paga Gas
          </Badge>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${statusInfo.color}`}>
            {statusInfo.icon}
          </div>
          <span className="text-sm text-gray-300">{statusInfo.text}</span>
        </div>

        {/* NFT Info */}
        <div className="space-y-2 p-3 bg-black/20 rounded-lg cyber-border">
          <p className="text-sm text-gray-400">Nome: <span className="text-white">{name}</span></p>
          <p className="text-sm text-gray-400">Rede: <span className="text-white">Polygon Amoy</span></p>
          <p className="text-sm text-gray-400">Contrato: <span className="text-white">NFT Collection</span></p>
        </div>

        {/* Connection Status */}
        {!account ? (
          <div className="flex items-center space-x-2 text-yellow-400">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">Conecte sua carteira para mintar</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Carteira conectada</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Erro:</span>
            </div>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        )}

        {/* Success Display */}
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
              NFT mintado com sucesso na blockchain!
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleMint}
          disabled={isDisabled}
          className="w-full cyber-button"
          size="lg"
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
              <span>Mint NFT</span>
            </div>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          Mint público: você paga o gas, nft vai para sua carteira
        </p>
      </CardContent>
    </Card>
  )
} 