'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles } from 'lucide-react'

const BADGE_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean geometric shapes, bold typography' },
  { value: 'retro', label: 'Retro', description: 'Vintage design, classic typography' },
  { value: 'national', label: 'National', description: 'Official emblematic, heraldic elements' },
  { value: 'urban', label: 'Urban', description: 'Street art influences, metropolitan design' },
  { value: 'classic', label: 'Classic', description: 'Timeless design, traditional sports aesthetics' }
]

const TEAMS = [
  'Flamengo',
  'Corinthians', 
  'Palmeiras',
  'Santos',
  'Vasco da Gama'
]

interface BadgeControlsProps {
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  badgeName: string
  setBadgeName: (name: string) => void
  badgeNumber: string
  setBadgeNumber: (number: string) => void
  badgeStyle: string
  setBadgeStyle: (style: string) => void
  onGenerate: (imageUrl: string, blob: Blob) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
}

export function BadgeControls({
  selectedTeam,
  setSelectedTeam,
  badgeName,
  setBadgeName,
  badgeNumber,
  setBadgeNumber,
  badgeStyle,
  setBadgeStyle,
  onGenerate,
  isGenerating,
  setIsGenerating
}: BadgeControlsProps) {
  const [error, setError] = useState<string>('')

  const handleGenerate = async () => {
    if (!selectedTeam || !badgeName || !badgeNumber) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/badges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: selectedTeam,
          badge_name: badgeName,
          badge_number: badgeNumber,
          style: badgeStyle
        })
      })

      const data = await response.json()

      if (data.success && data.image_url) {
        // Download da imagem para criar blob
        const imageResponse = await fetch(data.image_url)
        const blob = await imageResponse.blob()
        
        onGenerate(data.image_url, blob)
      } else {
        setError(data.error || 'Erro na geração do badge')
      }
    } catch (err) {
      console.error('Erro na geração:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Configurações do Badge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção do Time */}
        <div className="space-y-2">
          <Label htmlFor="team">Time *</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="cyber-input">
              <SelectValue placeholder="Selecione um time" />
            </SelectTrigger>
            <SelectContent>
              {TEAMS.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nome do Badge */}
        <div className="space-y-2">
          <Label htmlFor="badgeName">Nome do Badge *</Label>
          <Input
            id="badgeName"
            placeholder="Ex: CHAMPION, LEGEND, MVP"
            value={badgeName}
            onChange={(e) => setBadgeName(e.target.value.toUpperCase())}
            className="cyber-input"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Máximo 15 caracteres
          </p>
        </div>

        {/* Número do Badge */}
        <div className="space-y-2">
          <Label htmlFor="badgeNumber">Número *</Label>
          <Input
            id="badgeNumber"
            placeholder="Ex: 1, 10, 99"
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            className="cyber-input"
            maxLength={3}
          />
          <p className="text-xs text-muted-foreground">
            Máximo 3 dígitos
          </p>
        </div>

        {/* Estilo do Badge */}
        <div className="space-y-2">
          <Label htmlFor="style">Estilo</Label>
          <Select value={badgeStyle} onValueChange={setBadgeStyle}>
            <SelectTrigger className="cyber-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BADGE_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <div>
                    <div className="font-medium">{style.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {style.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botão de Geração */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedTeam || !badgeName || !badgeNumber}
          className="w-full cyber-button"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Badge...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Badge
            </>
          )}
        </Button>

        {/* Erro */}
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Informações */}
        <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-400 text-sm">
            💡 <strong>Dica:</strong> Badges são ideais para representar conquistas, 
            títulos e momentos especiais do time.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 