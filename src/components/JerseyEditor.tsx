'use client'

import { useState, useEffect } from 'react'
import { Dalle3Service } from '@/lib/services/dalle3-service'
import { Dalle3Response, ImageGenerationRequest } from '@/types'
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
    label: 'Modern',
    emoji: '⚡',
    description: 'Clean and futuristic design'
  },
  {
    id: 'retro',
    label: 'Retro',
    emoji: '📼',
    description: 'Vintage 80s/90s style'
  },
  {
    id: 'urban',
    label: 'Urban',
    emoji: '🏙️',
    description: 'Streetwear and graffiti'
  },
  {
    id: 'national',
    label: 'National',
    emoji: '🇧🇷',
    description: 'National colors and symbols'
  },
  {
    id: 'classic',
    label: 'Classic',
    emoji: '👑',
    description: 'Traditional and elegant'
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
    // Estilos que modificam a aparência
    const styleModifiers = {
      modern: 'with a sleek, minimalist aesthetic, clean lines, and contemporary design elements',
      retro: 'with vintage 1980s styling, aged textures, and classic typography',
      urban: 'with street art influences, graffiti-style lettering, and edgy design',
      national: 'incorporating national colors (like green, yellow, blue for Brazil), cultural symbols, and patriotic elements',
      classic: 'with a timeless, elegant design, traditional patterns, and sophisticated styling'
    };

    // Prompt base para cada tipo de geração
    const basePrompts = {
      jersey: `A professional soccer jersey for the team "${selectedTeam}". The style is ${styleModifiers[selectedStyle]}. The jersey should have a photorealistic texture, with authentic team colors, official patterns, and sponsor logos. Use realistic lighting and high contrast for the text.

CRITICAL INSTRUCTIONS:
- The view MUST be the BACK of the jersey, perfectly centered and laid flat.
- The player name "${playerName.toUpperCase()}" MUST appear EXACTLY as written at the top.
- The number "${playerNumber}" MUST appear EXACTLY as written below the name.
- DO NOT show any human, mannequin, or hanger. The background MUST be a clean, neutral studio background.`,
      
      stadium: `A spectacular aerial view of a football stadium for ${selectedTeam}, captured during golden hour with dramatic lighting. The stadium should be packed with fans wearing team colors, creating a sea of support. The style is ${styleModifiers[selectedStyle]}. Include the surrounding cityscape and architectural details that reflect the team's identity and location.`,
      
      logo: `A professional sports logo or emblem for ${selectedTeam}. The style is ${styleModifiers[selectedStyle]}. The design should be clean, iconic, and suitable for official merchandise and branding. It must be on a clean white background.`
    };

    return `${basePrompts[generationType]} High quality, 4K resolution.`;
  }

  const generateContent = async () => {
    if (!selectedTeam) {
      setError('Please select a team')
      return
    }

    if (generationType === 'jersey' && (!playerName || !playerNumber)) {
      setError('For jerseys, please fill in the player name and number')
      return
    }

    setIsLoading(true)
    setError(null)
    setGenerationCost(null)

    try {
      // Temporariamente, vamos usar um request direto para o novo sistema
      const request: ImageGenerationRequest = {
        model_id: "corinthians_2022", // Hardcoded para o nosso teste
        player_name: playerName,
        player_number: playerNumber,
        quality: quality
      };

      const result = await Dalle3Service.generateImage(request);

      if (result.success && result.image_base64) {
        const imageUrl = Dalle3Service.base64ToImageUrl(result.image_base64);
        setGeneratedImage(imageUrl);
        setGenerationCost(result.cost_usd || null);
      } else {
        setError(result.error || 'Unknown error during generation');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Error connecting to the API. Please check if the server is running.');
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
      stadium: 'Stadium', 
      logo: 'Logo/Emblem'
    }
    return labels[type]
  }

  const getTypeDescription = (type: GenerationType) => {
    const descriptions = {
      jersey: 'Generate custom jerseys with name and number',
      stadium: 'Create epic images of football stadiums',
      logo: 'Develop professional logos and emblems'
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
                DALL-E 3 API: {apiStatus ? 'Online' : 'Offline'}
              </span>
              {apiStatus && (
                <Badge variant="secondary" className="ml-auto">
                  {availableTeams.length} teams available
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
                <CardTitle className="text-white">AI Sports Content Generator</CardTitle>
                <CardDescription className="text-gray-400">
                  Create jerseys, stadiums, and logos using artificial intelligence
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
                      🏟️ Stadium
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
                    Visual Style
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
                    Team Selection
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Choose the team for generation
                  </p>
                  <select 
                    value={selectedTeam} 
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="" disabled>Select a team...</option>
                    {availableTeams.map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>

                {/* Campos específicos para Jersey */}
                {generationType === 'jersey' && (
                  <div className="space-y-4 pt-4 border-t border-gray-700/50">
                    <h4 className="text-md font-semibold text-white">Jersey Parameters</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="playerName" className="block text-sm font-medium text-gray-400">Player Name</label>
                        <input
                          id="playerName"
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="e.g., RONALDO"
                          className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="playerNumber" className="block text-sm font-medium text-gray-400">Jersey Number</label>
                        <input
                          id="playerNumber"
                          type="text"
                          value={playerNumber}
                          onChange={(e) => setPlayerNumber(e.target.value)}
                          placeholder="e.g., 9"
                          className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualidade */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Image Quality</label>
                  <ToggleGroup type="single" value={quality} onValueChange={(value: 'standard' | 'hd') => value && setQuality(value)} className="grid grid-cols-2 gap-2">
                     <ToggleGroupItem value="standard" className="data-[state=on]:bg-purple-600">Standard</ToggleGroupItem>
                     <ToggleGroupItem value="hd" className="data-[state=on]:bg-purple-600">HD (More expensive)</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita - Resultado */}
          <div>
            <Card className="sticky top-8 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Generation Result</CardTitle>
                <CardDescription className="text-gray-400">The generated image will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
                  {isLoading ? (
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-2">Generating image... Please wait.</p>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-red-400">
                      <p className="font-semibold">Error generating image:</p>
                      <pre className="text-xs whitespace-pre-wrap">{error}</pre>
                    </div>
                  ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated content" className="rounded-lg w-full h-full object-contain" />
                  ) : (
                    <p>Awaiting your creation...</p>
                  )}
                </div>
                {generationCost && (
                  <div className="mt-4 text-center text-sm text-gray-400">
                    <p>Generation Cost: ~${generationCost.toFixed(4)} USD</p>
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