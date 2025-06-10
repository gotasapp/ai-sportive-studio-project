'use client'

import { useState, useEffect } from 'react'
import { Dalle3Service } from '@/lib/services/dalle3-service'
import { Dalle3Request, Dalle3Response } from '@/types'

export default function JerseyEditor() {
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [playerNumber, setPlayerNumber] = useState<string>('')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
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

  const generateJersey = async () => {
    if (!selectedTeam || !playerName || !playerNumber) {
      setError('Preencha todos os campos obrigatórios')
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

      console.log("Valores sendo enviados para a API:", request);

      const result = await Dalle3Service.generateJersey(request);

      if (result.success && result.image_base64) {
        const imageUrl = Dalle3Service.base64ToImageUrl(result.image_base64);
        setGeneratedImage(imageUrl);
        setGenerationCost(result.cost_usd || null);
      } else {
        setError(result.error || 'Erro desconhecido ao gerar jersey');
      }
    } catch (err) {
      console.error('Erro ao gerar jersey:', err);
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

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        {/* Status da API */}
        <div className="mb-4 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              API DALL-E 3: {apiStatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna da Esquerda - Customização */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                🎨 Gerador de Jersey DALL-E 3
              </h2>
              
              {/* Seleção de Time */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  className="w-full p-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
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

              {/* Nome do Jogador */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome do Jogador *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  placeholder="Ex: GABRIEL, PEDRO, MARIO"
                  maxLength={15}
                  disabled={!apiStatus}
                />
              </div>

              {/* Número do Jogador */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número do Jogador *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  placeholder="Ex: 10, 7, 23"
                  maxLength={2}
                  pattern="[0-9]*"
                  disabled={!apiStatus}
                />
              </div>

              {/* Qualidade */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Qualidade
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="standard"
                      checked={quality === 'standard'}
                      onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                      className="mr-2"
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
                      className="mr-2"
                      disabled={!apiStatus}
                    />
                    <span className="text-sm">HD ($0.08)</span>
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={generateJersey}
                  disabled={isLoading || !selectedTeam || !playerName || !playerNumber || !apiStatus}
                  className={`flex-1 py-3 px-4 rounded-lg text-white font-semibold transition-colors ${
                    isLoading || !selectedTeam || !playerName || !playerNumber || !apiStatus
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? '🎨 Gerando...' : '🚀 Gerar Jersey'}
                </button>

                <button
                  onClick={resetForm}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  🔄 Limpar
                </button>
              </div>

              {/* Custo da Geração */}
              {generationCost && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    💰 Custo da geração: ${generationCost.toFixed(3)}
                  </p>
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">❌ {error}</p>
                </div>
              )}

              {/* Informações */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Informações:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Vista das costas com nome e número</li>
                  <li>• Qualidade DALL-E 3 profissional</li>
                  <li>• Formato baseado em referências reais</li>
                  <li>• Cores e padrões oficiais dos times</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Preview */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                🖼️ Jersey Gerado
              </h3>
              
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Gerando jersey com DALL-E 3...</p>
                  <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
                </div>
              )}

              {generatedImage && !isLoading && (
                <div className="space-y-4">
                                     <div className="relative">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img
                       src={generatedImage}
                       alt="Jersey gerado"
                       className="w-full h-auto rounded-lg shadow-md"
                     />
                   </div>
                  
                  {/* Informações da geração */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">📋 Detalhes:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Time:</strong> {selectedTeam}</p>
                      <p><strong>Jogador:</strong> {playerName} #{playerNumber}</p>
                      <p><strong>Qualidade:</strong> {quality.toUpperCase()}</p>
                      <p><strong>Resolução:</strong> 1024x1024px</p>
                    </div>
                  </div>

                  {/* Botão de Download */}
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = `jersey_${selectedTeam.replace(' ', '_')}_${playerName}_${playerNumber}.png`;
                      link.click();
                    }}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📥 Baixar Jersey
                  </button>
                </div>
              )}

              {!generatedImage && !isLoading && (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🎽</div>
                    <p>Seu jersey aparecerá aqui</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 