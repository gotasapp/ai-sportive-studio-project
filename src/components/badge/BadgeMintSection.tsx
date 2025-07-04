'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useActiveAccount } from 'thirdweb/react'
import { Award, Upload, Coins, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface BadgeMintSectionProps {
  generatedImageBlob: Blob | null
  teamName: string
  badgeName: string
  badgeNumber: string
  style: string
}

export function BadgeMintSection({
  generatedImageBlob,
  teamName,
  badgeName,
  badgeNumber,
  style
}: BadgeMintSectionProps) {
  const account = useActiveAccount()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string>('')
  const [isMinting, setIsMinting] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)
  const [mintError, setMintError] = useState<string>('')

  const saveBadgeToDB = async () => {
    if (!generatedImageBlob) {
      setSaveError('Nenhuma imagem disponível para upload')
      return
    }

    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      // Upload para Cloudinary
      const formData = new FormData()
      formData.append('file', generatedImageBlob)
      formData.append('upload_preset', 'jersey_upload')

      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dxkdcgrkl/image/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro no upload para Cloudinary')
      }

      const uploadData = await uploadResponse.json()

      // Salvar no MongoDB Atlas
      const badgeData = {
        teamName,
        badgeName,
        badgeNumber,
        style,
        imageUrl: uploadData.secure_url,
        cloudinaryId: uploadData.public_id,
        createdAt: new Date().toISOString(),
        type: 'badge'
      }

      const saveResponse = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeData)
      })

      if (!saveResponse.ok) {
        throw new Error('Erro ao salvar no banco de dados')
      }

      setSaveSuccess(true)
      console.log('Badge salvo com sucesso:', uploadData.secure_url)

    } catch (error) {
      console.error('Erro ao salvar badge:', error)
      setSaveError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMint = async () => {
    if (!generatedImageBlob || !account) {
      setMintError('Conecte sua carteira e gere um badge primeiro')
      return
    }

    setIsMinting(true)
    setMintError('')
    setMintSuccess(false)

    try {
      // Upload para IPFS via Engine API
      const formData = new FormData()
      formData.append('file', generatedImageBlob, `badge_${teamName}_${badgeName}_${badgeNumber}.png`)

      const ipfsResponse = await fetch('/api/engine/ipfs', {
        method: 'POST',
        body: formData
      })

      if (!ipfsResponse.ok) {
        throw new Error('Erro no upload IPFS')
      }

      const ipfsData = await ipfsResponse.json()

      // Fazer mint via Engine API
      const mintData = {
        contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
        recipientAddress: account.address,
        metadata: {
          name: `${teamName} Badge - ${badgeName} #${badgeNumber}`,
          description: `Badge NFT ${style} para ${teamName} - ${badgeName} #${badgeNumber}`,
          image: ipfsData.ipfsHash,
          attributes: [
            { trait_type: 'Team', value: teamName },
            { trait_type: 'Badge Name', value: badgeName },
            { trait_type: 'Badge Number', value: badgeNumber },
            { trait_type: 'Style', value: style },
            { trait_type: 'Type', value: 'Badge' }
          ]
        }
      }

      const mintResponse = await fetch('/api/engine/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mintData)
      })

      if (!mintResponse.ok) {
        throw new Error('Erro no mint NFT')
      }

      const mintResult = await mintResponse.json()
      setMintSuccess(true)
      console.log('Badge NFT mintado com sucesso:', mintResult)

    } catch (error) {
      console.error('Erro no mint:', error)
      setMintError(error instanceof Error ? error.message : 'Erro no mint')
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          Mint NFT Badge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Conexão */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Carteira:</span>
            <Badge variant={account ? "default" : "destructive"}>
              {account ? "Conectada" : "Desconectada"}
            </Badge>
          </div>
          {account && (
            <p className="text-xs text-muted-foreground truncate">
              {account.address}
            </p>
          )}
        </div>

        {/* Informações do Badge */}
        {generatedImageBlob && (
          <div className="space-y-3 p-3 rounded-md bg-muted/20 border border-border/20">
            <h4 className="text-sm font-medium">Badge Pronto</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">{teamName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{badgeName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Número:</span>
                <p className="font-medium">#{badgeNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estilo:</span>
                <p className="font-medium">{style}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar no DB */}
        <div className="space-y-2">
          <Button
            onClick={saveBadgeToDB}
            disabled={!generatedImageBlob || isSaving}
            className="w-full cyber-button"
            variant="outline"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvo!
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Salvar Badge
              </>
            )}
          </Button>

          {saveSuccess && (
            <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-xs">
                ✅ Badge salvo no banco de dados!
              </p>
            </div>
          )}

          {saveError && (
            <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">❌ {saveError}</p>
            </div>
          )}
        </div>

        {/* Botão Mint NFT */}
        <div className="space-y-2">
          <Button
            onClick={handleMint}
            disabled={!generatedImageBlob || !account || isMinting}
            className="w-full cyber-button"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mintando NFT...
              </>
            ) : mintSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                NFT Mintado!
              </>
            ) : (
              <>
                <Award className="w-4 h-4 mr-2" />
                Mint Badge NFT
              </>
            )}
          </Button>

          {mintSuccess && (
            <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-xs">
                🎉 Badge NFT mintado com sucesso!
              </p>
            </div>
          )}

          {mintError && (
            <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">❌ {mintError}</p>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-400 text-xs">
            💡 <strong>NFT Badge:</strong> Seus badges são únicos e verificáveis na blockchain. 
            Represente suas conquistas digitalmente!
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 