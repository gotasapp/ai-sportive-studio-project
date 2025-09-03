'use client'

import React from 'react'
import { Upload, Zap, Gamepad2, Globe, Crown, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

interface JerseyControlsProps {
  availableTeams: string[]
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  playerName: string
  setPlayerName: (name: string) => void
  playerNumber: string
  setPlayerNumber: (number: string) => void
  quality: 'standard' | 'hd'
  setQuality: (quality: 'standard' | 'hd') => void
  selectedStyle: string
  setSelectedStyle: (style: string) => void
  onGenerate: () => void
  isLoading: boolean
  error: string | null
  apiStatus: boolean
  generationCost: number | null
}

export default function JerseyControls({
  availableTeams,
  selectedTeam,
  setSelectedTeam,
  playerName,
  setPlayerName,
  playerNumber,
  setPlayerNumber,
  quality,
  setQuality,
  selectedStyle,
  setSelectedStyle,
  onGenerate,
  isLoading,
  error,
  apiStatus,
  generationCost
}: JerseyControlsProps) {
  return (
    <div className="w-full max-w-md space-y-6">
      {/* API Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-400">
          API Status: {apiStatus ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Team Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Team <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
        >
          <option value="">Select a team...</option>
          {availableTeams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      {/* Player Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Player Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
          placeholder="JEFF"
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          maxLength={12}
        />
      </div>

      {/* Player Number */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Player Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={playerNumber}
          onChange={(e) => setPlayerNumber(e.target.value)}
          placeholder="10"
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          maxLength={2}
        />
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">Jersey Style</label>
        <div className="grid grid-cols-2 gap-3">
          {STYLE_FILTERS.map((style) => {
            const IconComponent = style.icon
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                  selectedStyle === style.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{style.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quality Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">Quality</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setQuality('standard')}
            className={`p-3 rounded-xl border transition-all duration-200 ${
              quality === 'standard'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="text-sm font-medium">Standard</div>
            <div className="text-xs opacity-70">Fast generation</div>
          </button>
          <button
            onClick={() => setQuality('hd')}
            className={`p-3 rounded-xl border transition-all duration-200 ${
              quality === 'hd'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="text-sm font-medium">HD</div>
            <div className="text-xs opacity-70">High quality</div>
          </button>
        </div>
      </div>

      {/* Generation Cost */}
      {generationCost && (
        <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-4">
          <div className="text-sm text-gray-400">Generation Cost</div>
          <div className="text-lg font-bold text-white">${generationCost.toFixed(3)}</div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={!selectedTeam || !playerName || !playerNumber || isLoading}
        className="w-full py-3 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Generating...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Generate Jersey</span>
          </div>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}
    </div>
  )
} 