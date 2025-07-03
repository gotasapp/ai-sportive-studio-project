'use client'

import React from 'react'
import { Upload, Zap, Building, Eye, Camera, Sunset, Cloud, Users, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StadiumInfo } from '@/lib/services/stadium-service'

const STADIUM_STYLE_FILTERS = [
  { id: 'realistic', label: 'Realistic', icon: Eye },
  { id: 'cinematic', label: 'Cinematic', icon: Camera },
  { id: 'dramatic', label: 'Dramatic', icon: Zap }
]

const STADIUM_PERSPECTIVE_FILTERS = [
  { id: 'external', label: 'External', icon: Building },
  { id: 'internal', label: 'Internal', icon: Users },
  { id: 'mixed', label: 'Mixed', icon: Eye }
]

const STADIUM_ATMOSPHERE_FILTERS = [
  { id: 'packed', label: 'Packed', icon: Users },
  { id: 'half_full', label: 'Half Full', icon: Users },
  { id: 'empty', label: 'Empty', icon: Building }
]

const STADIUM_TIME_FILTERS = [
  { id: 'day', label: 'Day', icon: Zap },
  { id: 'night', label: 'Night', icon: Building },
  { id: 'sunset', label: 'Sunset', icon: Sunset }
]

const STADIUM_WEATHER_FILTERS = [
  { id: 'clear', label: 'Clear', icon: Zap },
  { id: 'dramatic', label: 'Dramatic', icon: Cloud },
  { id: 'cloudy', label: 'Cloudy', icon: Cloud }
]

interface StadiumControlsProps {
  // Stadium reference
  availableStadiums: StadiumInfo[]
  selectedStadium: string
  setSelectedStadium: (stadium: string) => void
  referenceType: string
  setReferenceType: (type: string) => void
  
  // Generation parameters
  generationStyle: string
  setGenerationStyle: (style: string) => void
  perspective: string
  setPerspective: (perspective: string) => void
  atmosphere: string
  setAtmosphere: (atmosphere: string) => void
  timeOfDay: string
  setTimeOfDay: (time: string) => void
  weather: string
  setWeather: (weather: string) => void
  quality: string
  setQuality: (quality: string) => void
  
  // Custom inputs
  customPrompt: string
  setCustomPrompt: (prompt: string) => void
  customReferenceFile: File | null
  customReferencePreview: string
  onCustomFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  
  // Generation
  onGenerate: () => void
  isGenerating: boolean
  error: string
  apiStatus: boolean
  generationCost: number | null
}

export default function StadiumControls({
  availableStadiums,
  selectedStadium,
  setSelectedStadium,
  referenceType,
  setReferenceType,
  generationStyle,
  setGenerationStyle,
  perspective,
  setPerspective,
  atmosphere,
  setAtmosphere,
  timeOfDay,
  setTimeOfDay,
  weather,
  setWeather,
  quality,
  setQuality,
  customPrompt,
  setCustomPrompt,
  customReferenceFile,
  customReferencePreview,
  onCustomFileChange,
  onGenerate,
  isGenerating,
  error,
  apiStatus,
  generationCost
}: StadiumControlsProps) {
  return (
    <div className="w-full max-w-md space-y-6">
      {/* API Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${apiStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-400">
          API Status: {apiStatus ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Stadium Selection */}
      <div className="space-y-2">
        <Label className="text-white">Stadium Reference</Label>
        <Select value={selectedStadium} onValueChange={setSelectedStadium}>
          <SelectTrigger className="w-full bg-gray-800/50 border-gray-600 text-white">
            <SelectValue placeholder="Select stadium..." />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="custom_only">Custom Only</SelectItem>
            {availableStadiums.map((stadium) => (
              <SelectItem key={stadium.id} value={stadium.id}>
                {stadium.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reference Type */}
      {selectedStadium !== 'custom_only' && (
        <div className="space-y-2">
          <Label className="text-white">Reference Type</Label>
          <Select value={referenceType} onValueChange={setReferenceType}>
            <SelectTrigger className="w-full bg-gray-800/50 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="atmosphere">Atmosphere</SelectItem>
              <SelectItem value="day_light">Day Light</SelectItem>
              <SelectItem value="night_lights">Night Lights</SelectItem>
              <SelectItem value="external_view">External View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Style Selection */}
      <div className="space-y-3">
        <Label className="text-white">Style</Label>
        <div className="grid grid-cols-1 gap-3">
          {STADIUM_STYLE_FILTERS.map((style) => {
            const IconComponent = style.icon
            return (
              <button
                key={style.id}
                onClick={() => setGenerationStyle(style.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                  generationStyle === style.id
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

      {/* Perspective */}
      <div className="space-y-3">
        <Label className="text-white">Perspective</Label>
        <div className="grid grid-cols-1 gap-3">
          {STADIUM_PERSPECTIVE_FILTERS.map((persp) => {
            const IconComponent = persp.icon
            return (
              <button
                key={persp.id}
                onClick={() => setPerspective(persp.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                  perspective === persp.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{persp.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Atmosphere */}
      <div className="space-y-3">
        <Label className="text-white">Atmosphere</Label>
        <div className="grid grid-cols-1 gap-3">
          {STADIUM_ATMOSPHERE_FILTERS.map((atm) => {
            const IconComponent = atm.icon
            return (
              <button
                key={atm.id}
                onClick={() => setAtmosphere(atm.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                  atmosphere === atm.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{atm.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time of Day */}
      <div className="space-y-3">
        <Label className="text-white">Time of Day</Label>
        <div className="grid grid-cols-1 gap-3">
          {STADIUM_TIME_FILTERS.map((time) => {
            const IconComponent = time.icon
            return (
              <button
                key={time.id}
                onClick={() => setTimeOfDay(time.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                  timeOfDay === time.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{time.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Weather */}
      <div className="space-y-3">
        <Label className="text-white">Weather</Label>
        <div className="grid grid-cols-1 gap-3">
          {STADIUM_WEATHER_FILTERS.map((w) => {
            const IconComponent = w.icon
            return (
              <button
                key={w.id}
                onClick={() => setWeather(w.id)}
                className={`p-3 rounded-xl border transition-all duration-200 flex items-center space-x-2 ${
                  weather === w.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{w.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quality Selection */}
      <div className="space-y-3">
        <Label className="text-white">Quality</Label>
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

      {/* Custom Prompt */}
      <div className="space-y-2">
        <Label className="text-white">Custom Prompt (Optional)</Label>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Add custom description for your stadium..."
          className="w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          rows={3}
        />
      </div>

      {/* Custom Reference Upload */}
      <div className="space-y-2">
        <Label className="text-white">Custom Reference Image (Optional)</Label>
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center hover:border-gray-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={onCustomFileChange}
            className="hidden"
            id="custom-reference-upload"
          />
          <label htmlFor="custom-reference-upload" className="cursor-pointer">
            {customReferencePreview ? (
              <div className="space-y-2">
                <img
                  src={customReferencePreview}
                  alt="Custom Reference"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-400">Click to change image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-400">Click to upload reference image</p>
              </div>
            )}
          </label>
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
        disabled={isGenerating}
        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Generating Stadium...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Generate Stadium</span>
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