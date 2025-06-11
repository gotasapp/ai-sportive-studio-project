'use client'

import { useState, useEffect } from 'react'
import { Dalle3Service } from '@/lib/services/dalle3-service'
import { Dalle3Request, Dalle3Response } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type GenerationType = 'jersey' | 'stadium' | 'logo'
type StyleFilter = 'modern' | 'retro' | 'urban' | 'national' | 'classic'

interface StyleConfig {
  id: StyleFilter
  label: string
  emoji: string
  description: string
}

const STYLE_FILTERS: StyleConfig[] = [
  {
    id: 'modern',
    label: 'Moderno',
    emoji: '⚡',
    description: 'Design limpo e futurista'
  },
  {
    id: 'retro',
    label: 'Retrô',
    emoji: '📼',
    description: 'Estilo vintage anos 80/90'
  },
  {
    id: 'urban',
    label: 'Urbano',
    emoji: '🏙️',
    description: 'Streetwear e grafite'
  },
  {
    id: 'national',
    label: 'Nacional',
    emoji: '🇧🇷',
    description: 'Cores e símbolos nacionais'
  },
  {
    id: 'classic',
    label: 'Clássico',
    emoji: '👑',
    description: 'Tradicional e elegante'
  }
]

export default function JerseyEditor() {
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [playerNumber, setPlayerNumber] = useState<string>('')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [generationType, setGenerationType] = useState<GenerationType>('jersey')
  const [selectedStyle, setSelectedStyle] = useState<StyleFilter>('modern')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<boolean>(false)
  const [generationCost, setGenerationCost] = useState<number | null>(null)

  // Carrega times disponíveis e verifica API
  useEffect(() => {
    const loadData = async () => {
      const [teams, health] = await Promise.all([
        Dalle3Service.getAvailableTeams(),
        Dalle3Service.checkHealth()
      ]);
      
      setAvailableTeams(teams);
      setApiStatus(health);
    };

    loadData();
  }, []);

  const buildPrompt = (): string => {
    const basePrompts = {
      jersey: `A photorealistic back view of a professional soccer jersey on a white studio background, designed for jersey customization interfaces. The jersey is centered and fully visible, with a clean flat fit and realistic texture. At the top, display the player name "${playerName.toUpperCase()}" in bold uppercase letters. Below it, a large centered number "${playerNumber}". The jersey must exactly match the official home design of the "${selectedTeam}" team: use authentic team colors, patterns, sponsors, and jersey layout. Ensure high contrast between text and background for readability.`,
      
      stadium: `A spectacular aerial view of a football stadium for ${selectedTeam}, captured during golden hour with dramatic lighting. The stadium should be packed with fans wearing team colors, creating a sea of support. Include the surrounding cityscape and architectural details that reflect the team's identity and location.`,
      
      logo: `A professional sports logo design for ${selectedTeam}, suitable for official merchandise and branding. The logo should be circular or shield-shaped, featuring the team's iconic colors and symbols. Clean vector-style design on a transparent or white background, perfect for embroidery and printing.`
    }

    const styleModifiers = {
      modern: 'with a sleek, minimalist aesthetic, clean lines, vibrant colors, and contemporary design elements',
      retro: 'with vintage 1980s-1990s styling, aged textures, classic typography, and nostalgic color grading',
      urban: 'with street art influences, graffiti-style elements, bold urban typography, and edgy design',
      national: 'incorporating Brazilian national colors (green, yellow, blue), cultural symbols, and patriotic elements',
      classic: 'with timeless, elegant design, traditional patterns, premium materials, and sophisticated styling'
    }

    return `${basePrompts[generationType]} ${styleModifiers[selectedStyle]}. High quality, professional photography, 4K resolution.`
  }

  const generateContent = async () => {
    if (!selectedTeam) {
      setError('Selecione um time')
      return
    }

    if (generationType === 'jersey' && (!playerName || !playerNumber)) {
      setError('Para jerseys, preencha o nome e número do jogador')
      return
    }

    setIsLoading(true)
    setError(null)
    setGenerationCost(null)

    try {
      const request: Dalle3Request = {
        team_name: selectedTeam,
        player_name: playerName || 'PLAYER',
        player_number: playerNumber || '10',
        quality: quality
      };

      // Aqui substituiremos o prompt padrão pelo nosso prompt customizado
      // Por enquanto, vamos usar a API atual e depois modificaremos o backend
      const result = await Dalle3Service.generateJersey(request);

      if (result.success && result.image_base64) {
        const imageUrl = Dalle3Service.base64ToImageUrl(result.image_base64);
        setGeneratedImage(imageUrl);
        setGenerationCost(result.cost_usd || null);
      } else {
        setError(result.error || 'Erro desconhecido ao gerar conteúdo');
      }
    } catch (err) {
      console.error('Erro ao gerar conteúdo:', err);
      setError('Erro ao conectar com a API. Verifique se o servidor está rodando.');
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setSelectedTeam('');
    setPlayerName('');
    setPlayerNumber('');
    setGeneratedImage(null);
    setError(null);
    setGenerationCost(null);
  };

  const getTypeLabel = (type: GenerationType) => {
    const labels = {
      jersey: 'Jersey',
      stadium: 'Estádio', 
      logo: 'Logo/Emblema'
    }
    return labels[type]
  }

  const getTypeDescription = (type: GenerationType) => {
    const descriptions = {
      jersey: 'Gere camisas personalizadas com nome e número',
      stadium: 'Crie imagens épicas de estádios de futebol',
      logo: 'Desenvolva logos e emblemas profissionais'
    }
    return descriptions[type]
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        {/* Status da API */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-300">
                API DALL-E 3: {apiStatus ? 'Online' : 'Offline'}
              </span>
              {apiStatus && (
                <Badge variant="secondary" className="ml-auto">
                  {availableTeams.length} times disponíveis
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna da Esquerda - Customização */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">🎨 Gerador de Conteúdo Sports IA</CardTitle>
                <CardDescription className="text-gray-400">
                  Crie jerseys, estádios e logos usando inteligência artificial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Tabs para Tipo de Geração */}
                <Tabs value={generationType} onValueChange={(value) => setGenerationType(value as GenerationType)}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                    <TabsTrigger value="jersey" className="data-[state=active]:bg-purple-600">
                      👕 Jersey
                    </TabsTrigger>
                    <TabsTrigger value="stadium" className="data-[state=active]:bg-purple-600">
                      🏟️ Estádio
                    </TabsTrigger>
                    <TabsTrigger value="logo" className="data-[state=active]:bg-purple-600">
                      🏆 Logo
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={generationType} className="mt-4">
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">{getTypeLabel(generationType)}</h4>
                      <p className="text-sm text-gray-400">{getTypeDescription(generationType)}</p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Filtros de Estilo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">
                    Estilo Visual
                  </label>
                  <ToggleGroup 
                    type="single" 
                    value={selectedStyle} 
                    onValueChange={(value) => value && setSelectedStyle(value as StyleFilter)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {STYLE_FILTERS.map((style) => (
                      <ToggleGroupItem 
                        key={style.id}
                        value={style.id}
                        className="flex flex-col items-center p-3 h-auto data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                      >
                        <span className="text-lg mb-1">{style.emoji}</span>
                        <span className="text-xs font-medium">{style.label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <p className="text-xs text-gray-500 mt-2">
                    {STYLE_FILTERS.find(s => s.id === selectedStyle)?.description}
                  </p>
                </div>

                {/* Seleção de Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Time *
                  </label>
                  <select
                    className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    disabled={!apiStatus}
                  >
                    <option value="">Selecione um time</option>
                    {availableTeams.map(team => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campos específicos para Jersey */}
                {generationType === 'jersey' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">
                        Nome do Jogador *
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none placeholder:text-gray-500"
                        style={{ color: '#FFF' }}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        placeholder="Ex: GABRIEL, PEDRO, MARIO"
                        maxLength={15}
                        disabled={!apiStatus}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2">
                        Número do Jogador *
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none placeholder:text-gray-500"
                        style={{ color: '#FFF' }}
                        value={playerNumber}
                        onChange={(e) => setPlayerNumber(e.target.value)}
                        placeholder="Ex: 10, 7, 23"
                        maxLength={2}
                        pattern="[0-9]*"
                        disabled={!apiStatus}
                      />
                    </div>
                  </>
                )}

                {/* Qualidade */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Qualidade
                  </label>
                  <div className="flex gap-4 text-gray-300">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="standard"
                        checked={quality === 'standard'}
                        onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                        className="mr-2 h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                        disabled={!apiStatus}
                      />
                      <span className="text-sm">Standard ($0.04)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="hd"
                        checked={quality === 'hd'}
                        onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                        className="mr-2 h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                        disabled={!apiStatus}
                      />
                      <span className="text-sm">HD ($0.08)</span>
                    </label>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={generateContent}
                    disabled={isLoading || !selectedTeam || (generationType === 'jersey' && (!playerName || !playerNumber)) || !apiStatus}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
                  >
                    {isLoading ? '🎨 Gerando...' : `🚀 Gerar ${getTypeLabel(generationType)}`}
                  </Button>

                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={isLoading}
                  >
                    🔄 Limpar
                  </Button>
                </div>

                {/* Custo da Geração */}
                {generationCost && (
                  <Card className="bg-green-900/50 border-green-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <span className="text-green-300 text-sm">
                          💰 Custo da geração: ${generationCost.toFixed(3)}
                        </span>
                        <Badge variant="secondary" className="bg-green-800 text-green-300">
                          {quality === 'hd' ? 'HD' : 'Standard'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Erro */}
                {error && (
                  <Card className="bg-red-900/50 border-red-700">
                    <CardContent className="pt-6">
                      <p className="text-red-300 font-medium">❌ {error}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Informações */}
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-gray-200 mb-2">ℹ️ Informações:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• {generationType === 'jersey' ? 'Vista das costas com nome e número' : 
                              generationType === 'stadium' ? 'Visão aérea épica do estádio' :
                              'Logo profissional para merchandising'}</li>
                      <li>• Qualidade DALL-E 3 profissional</li>
                      <li>• Estilos personalizáveis</li>
                      <li>• Cores e padrões oficiais dos times</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita - Preview */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🖼️ {getTypeLabel(generationType)} Gerado
                  {selectedStyle && (
                    <Badge variant="secondary" className="bg-purple-900 text-purple-300">
                      {STYLE_FILTERS.find(s => s.id === selectedStyle)?.emoji} {STYLE_FILTERS.find(s => s.id === selectedStyle)?.label}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-96 bg-gray-900 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-gray-400">Gerando {getTypeLabel(generationType).toLowerCase()} com DALL-E 3...</p>
                    <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
                  </div>
                )}

                {!isLoading && !generatedImage && (
                  <div className="flex flex-col items-center justify-center h-96 bg-gray-900 rounded-lg border-2 border-dashed border-gray-700">
                    <div className="text-6xl mb-4">
                      {generationType === 'jersey' ? '👕' : generationType === 'stadium' ? '🏟️' : '🏆'}
                    </div>
                    <p className="text-gray-400 text-center">
                      Seu {getTypeLabel(generationType).toLowerCase()} aparecerá aqui
                    </p>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Selecione um time e configure as opções acima
                    </p>
                  </div>
                )}

                {generatedImage && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={generatedImage}
                        alt={`${getTypeLabel(generationType)} gerado`}
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = `${generationType}-${selectedTeam}-${selectedStyle}.png`;
                        link.click();
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      📥 Baixar Imagem
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 