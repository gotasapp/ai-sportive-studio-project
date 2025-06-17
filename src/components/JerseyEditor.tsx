'use client'

import React, { useState, useEffect } from 'react'
import { Upload, ChevronLeft, ChevronRight, Zap, Gamepad2, Globe, Crown, Palette } from 'lucide-react'
import Header from './Header.jsx'
import { Dalle3Service } from '../lib/services/dalle3-service'
import { Dalle3Request } from '../types'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

const MARKETPLACE_ITEMS = [
  { id: 1, number: '10', price: '0.5 ETH', trending: true },
  { id: 2, number: '23', price: '0.3 ETH', trending: false },
  { id: 3, number: '07', price: '0.8 ETH', trending: true },
  { id: 4, number: '11', price: '0.4 ETH', trending: false },
  { id: 5, number: '99', price: '1.2 ETH', trending: true },
  { id: 6, number: '88', price: '0.6 ETH', trending: false }
]

export default function JerseyEditor() {
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('JEFF')
  const [playerNumber, setPlayerNumber] = useState<string>('10')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<boolean>(false)
  const [generationCost, setGenerationCost] = useState<number | null>(null)
  const [royalties, setRoyalties] = useState<number>(10)
  const [editionSize, setEditionSize] = useState<number>(100)
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null)

  const generateContent = async () => {
    if (!selectedTeam) {
      setError('Selecione um time')
      return
    }

    if (!playerName || !playerNumber) {
      setError('Preencha o nome e número do jogador')
      return
    }

    setIsLoading(true)
    setError(null)
    setGenerationCost(null)

    try {
      const request: Dalle3Request = {
        team_name: selectedTeam,
        player_name: playerName,
        player_number: playerNumber,
        quality: quality
      };

      const result = await Dalle3Service.generateJersey(request);

      if (result.success && result.image_base64) {
        const imageUrl = Dalle3Service.base64ToImageUrl(result.image_base64);
        setGeneratedImage(imageUrl);
        setGenerationCost(result.cost_usd || null);
        
        // Convert base64 to blob for minting
        const base64Data = result.image_base64.replace(/^data:image\/[a-z]+;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        setGeneratedImageBlob(blob);
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
    setGeneratedImageBlob(null);
    setError(null);
    setGenerationCost(null);
  };

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await Dalle3Service.getAvailableTeams();
        if (teams.length > 0) {
          setAvailableTeams(teams);
          setSelectedTeam(teams[0]); // Selecionar o primeiro time automaticamente
        } else {
          // Times padrão se a API não retornar nenhum
          const defaultTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo'];
          setAvailableTeams(defaultTeams);
          setSelectedTeam(defaultTeams[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar times:', err);
        // Times padrão em caso de erro
        const defaultTeams = ['Flamengo', 'Palmeiras', 'Vasco da Gama', 'Corinthians', 'São Paulo'];
        setAvailableTeams(defaultTeams);
        setSelectedTeam(defaultTeams[0]);
      }
    };

    const checkApiStatus = async () => {
      try {
        const status = await Dalle3Service.checkHealth();
        setApiStatus(status);
      } catch (err) {
        console.error('Erro ao verificar status da API:', err);
        setApiStatus(false);
      }
    };

    loadTeams();
    checkApiStatus();
  }, []);

  return (
    <div className="min-h-screen" style={{
      background: '#000518',
      backgroundImage: `
        radial-gradient(ellipse at top left, #000720 0%, transparent 40%),
        radial-gradient(ellipse at top right, #000924 0%, transparent 40%),
        radial-gradient(ellipse at bottom left, #000720 0%, transparent 40%),
        radial-gradient(ellipse at bottom right, #000A29 0%, transparent 40%),
        radial-gradient(ellipse at center, #00081D 0%, transparent 60%),
        radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.03) 0%, transparent 50%)
      `
    }}>
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column - AI Generation */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Generation Card */}
            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <h2 className="text-xl font-bold text-white mb-6">AI Generation</h2>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-8 mb-6 text-center cyber-card">
                  <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Upload image or enter text</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="file-upload"
                    accept="image/*"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    Choose file
                  </label>
                </div>

                {/* Style Filters */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_FILTERS.map((style) => {
                      const IconComponent = style.icon;
                      return (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`style-button ${selectedStyle === style.id ? 'active' : ''} px-4 py-3 rounded-lg flex items-center space-x-2 transition-all`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm font-medium">{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team Selection */}
                <div className="space-y-4 mb-6">
                  <label className="text-sm font-medium text-gray-300">Team</label>
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="cyber-input w-full px-4 py-3 rounded-lg"
                  >
                    <option value="">Select Team</option>
                    {availableTeams.map((team) => (
                      <option key={team} value={team} className="bg-gray-800">
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Player Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="cyber-input w-full px-4 py-3 rounded-lg"
                      placeholder="JEFF"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Number</label>
                    <input
                      type="text"
                      value={playerNumber}
                      onChange={(e) => setPlayerNumber(e.target.value)}
                      className="cyber-input w-full px-4 py-3 rounded-lg"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Royalties</span>
                    <span className="text-cyan-400 font-semibold">{royalties}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={royalties}
                    onChange={(e) => setRoyalties(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Gas fee</span>
                    <span className="text-white">0.22</span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateContent}
                  disabled={isLoading || !selectedTeam}
                  className="cyber-button w-full py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate Jersey'}
                </button>
              </div>
            </div>

            {/* Mint NFT Card */}
            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <h2 className="text-xl font-bold text-white mb-6">Mint NFT</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Edition Size</span>
                      <span className="text-cyan-400 font-semibold">{editionSize}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      value={editionSize}
                      onChange={(e) => setEditionSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Gas Fee</span>
                    <span className="text-white">0.02 CHZ</span>
                  </div>

                  <button 
                    className="cyber-button w-full py-4 rounded-lg font-semibold"
                    disabled={!generatedImage}
                  >
                    {generatedImage ? 'Mint NFT' : 'Generate First'}
                  </button>

                  {/* Status */}
                  <div className="pt-6 border-t border-gray-700">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm text-gray-300">
                          API Status: {apiStatus ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-sm text-gray-300">
                          DALL-E 3: {apiStatus ? 'Ready' : 'Offline'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Status: AI Generation Ready
                      </div>
                      
                      {generationCost && (
                        <div className="text-xs text-gray-400">
                          Last generation: ${generationCost.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Jersey Preview + Marketplace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Jersey Preview - MAIOR */}
            <div className="gradient-border">
              <div className="gradient-border-content p-8">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Jersey Preview</h3>
                
                {/* Jersey Display Container - Preview MAIOR */}
                <div className="flex justify-center">
                  <div className="relative w-96 h-[28rem] rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)',
                    border: '2px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    
                    {isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-cyan-400 text-xl font-semibold">Generating your jersey...</p>
                        <div className="mt-4 w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <span className="text-red-400 text-3xl">⚠</span>
                          </div>
                          <p className="text-red-400 mb-6 text-center text-lg">{error}</p>
                          <button 
                            onClick={() => setError(null)}
                            className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {generatedImage && !isLoading && !error && (
                      <div className="absolute inset-0 p-6">
                        <img 
                          src={generatedImage} 
                          alt="Generated Jersey" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {/* NFT Frame Effect */}
                        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                        
                        {/* NFT Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 rounded-b-lg">
                          <div className="text-white">
                            <p className="font-bold text-2xl">{playerName} #{playerNumber}</p>
                            <p className="text-cyan-400 text-lg">{selectedTeam}</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-sm text-gray-300">Style: {selectedStyle}</span>
                              <span className="text-sm text-gray-300">Quality: {quality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!generatedImage && !isLoading && !error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        <div className="text-center">
                          {/* Jersey Placeholder MAIOR */}
                          <div className="w-40 h-48 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                              <p className="text-sm text-gray-400">Jersey</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-lg">Your generated jersey will appear here</p>
                          <p className="text-cyan-400/70 text-sm mt-3">Perfect NFT proportions (4:5 ratio)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace - MENOR com CARROSSEL */}
            <div className="gradient-border">
              <div className="gradient-border-content p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Marketplace</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all"
                      onClick={() => {
                        const container = document.getElementById('marketplace-scroll');
                        if (container) container.scrollLeft -= 200;
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all"
                      onClick={() => {
                        const container = document.getElementById('marketplace-scroll');
                        if (container) container.scrollLeft += 200;
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Carrossel Horizontal */}
                <div 
                  id="marketplace-scroll"
                  className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {MARKETPLACE_ITEMS.concat(MARKETPLACE_ITEMS).map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex-shrink-0 group cursor-pointer">
                      <div className="marketplace-card rounded-lg p-3 w-36 transition-all duration-300 hover:scale-105">
                        {/* NFT Card MENOR com proporção 4:5 */}
                        <div className="aspect-[4/5] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden border border-cyan-400/20">
                          {item.trending && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          )}
                          
                          {/* Jersey Preview */}
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="text-4xl font-bold text-cyan-400/60">{item.number}</div>
                            
                            {/* Jersey shape outline */}
                            <div className="absolute inset-3 border border-dashed border-cyan-400/20 rounded"></div>
                            
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/10 via-transparent to-purple-400/10 rounded-lg"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 group-hover:text-cyan-400 transition-colors font-medium">
                            Jersey #{item.number}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold text-sm">{item.price}</span>
                            {item.trending && (
                              <span className="text-xs text-green-400 bg-green-400/10 px-1 py-0.5 rounded text-xs">
                                🔥
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Ver Mais */}
                <div className="mt-4 text-center">
                  <button className="px-4 py-2 border border-cyan-400/30 text-cyan-400 rounded-lg hover:border-cyan-400 hover:bg-cyan-400/10 transition-all text-sm">
                    View All NFTs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 