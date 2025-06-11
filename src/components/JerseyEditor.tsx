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
      const request: ImageGenerationRequest = {
        model_id: "corinthians_2022", 
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to connect to the API. Details: ${errorMessage}`);
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
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">AI Sports Content Generator</CardTitle>
                <CardDescription className="text-gray-400">
                  Create jerseys, stadiums, and logos using artificial intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        <span className="text-2xl">{style.emoji}</span>
                        <span className="font-semibold">{style.label}</span>
                        <span className="text-xs">{style.description}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <Card className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                  <CardContent className="p-0">
                    <div className="space-y-4">
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

                      <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Image Quality</label>
                        <ToggleGroup type="single" value={quality} onValueChange={(value: 'standard' | 'hd') => value && setQuality(value)} className="grid grid-cols-2 gap-2">
                           <ToggleGroupItem value="standard" className="data-[state=on]:bg-purple-600">Standard</ToggleGroupItem>
                           <ToggleGroupItem value="hd" className="data-[state=on]:bg-purple-600">HD (More expensive)</ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            <div className="flex space-x-4">
                <Button onClick={generateContent} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {isLoading ? 'Generating...' : 'Generate Content'}
                </Button>
                <Button onClick={resetForm} variant="outline" className="w-full text-white border-gray-600 hover:bg-gray-700">Clear</Button>
            </div>
          </div>

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