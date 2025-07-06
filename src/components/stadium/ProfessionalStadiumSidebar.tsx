'use client'

import React from 'react'
import { Upload, X, Building, Users, Eye, Camera, Zap, Cloud, Sunset } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import StyleButton from '@/components/ui/StyleButton'
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

interface ProfessionalStadiumSidebarProps {
  availableStadiums: StadiumInfo[]
  selectedStadium: string
  setSelectedStadium: (stadium: string) => void
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
  customPrompt: string
  setCustomPrompt: (prompt: string) => void
  isVisionMode: boolean
  referenceImage: string | null
  selectedView: string
  setSelectedView: (view: string) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearReference: () => void
  generationCost: number | null
  error: string | null
  onResetError: () => void
}

export default function ProfessionalStadiumSidebar({
  availableStadiums,
  selectedStadium,
  setSelectedStadium,
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
  customPrompt,
  setCustomPrompt,
  isVisionMode,
  referenceImage,
  selectedView,
  setSelectedView,
  onFileUpload,
  onClearReference,
  generationCost,
  error,
  onResetError
}: ProfessionalStadiumSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-red-300 text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={onResetError}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Vision Reference Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
            Stadium Reference
          </h3>
        </div>
        
        {!referenceImage ? (
          <div className="border-2 border-dashed border-[#333333] rounded-lg p-6 text-center hover:border-[#A20131] transition-colors cursor-pointer bg-[#111011]/50"
               onClick={() => document.getElementById('stadium-vision-upload')?.click()}>
            <Upload className="mx-auto h-8 w-8 text-[#ADADAD] mb-2" />
            <p className="text-sm text-[#ADADAD]">Click to upload stadium image</p>
            <p className="text-xs text-[#ADADAD]/70 mt-1">JPG, PNG, WebP up to 10MB</p>
          </div>
        ) : (
          <div className="relative">
            <img 
              src={referenceImage} 
              alt="Stadium Reference" 
              className="w-full h-32 object-cover rounded-lg border border-[#333333]" 
            />
            <button 
              onClick={onClearReference} 
              className="absolute top-2 right-2 bg-[#A20131] hover:bg-[#A20131]/80 text-white rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <input
          id="stadium-vision-upload"
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          className="hidden"
        />
      </div>

      {/* Stadium Template Selector */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Stadium Template</Label>
        <select 
          value={selectedStadium} 
          onChange={(e) => setSelectedStadium(e.target.value)} 
          disabled={isVisionMode}
          className={`w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none ${
            isVisionMode ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value="custom_only">
            {isVisionMode ? 'Template disabled (Vision Mode)' : 'No Template (Custom)'}
          </option>
          {availableStadiums.map((stadium) => (
            <option key={stadium.id} value={stadium.id}>
              {stadium.name}
            </option>
          ))}
        </select>
      </div>

      {/* View Selection for Vision Mode */}
      {isVisionMode && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-[#FDFDFD]">Stadium View</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedView('external')}
              className={`p-3 rounded-lg border transition-all ${
                selectedView === 'external'
                  ? 'border-[#A20131] bg-[#A20131]/10 text-[#A20131]'
                  : 'border-[#333333] bg-[#111011]/50 text-[#ADADAD]'
              }`}
            >
              <Building className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs">External</span>
            </button>
            <button
              onClick={() => setSelectedView('internal')}
              className={`p-3 rounded-lg border transition-all ${
                selectedView === 'internal'
                  ? 'border-[#A20131] bg-[#A20131]/10 text-[#A20131]'
                  : 'border-[#333333] bg-[#111011]/50 text-[#ADADAD]'
              }`}
            >
              <Users className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs">Internal</span>
            </button>
          </div>
        </div>
      )}

      {/* Generation Style */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Generation Style</Label>
        <div className="grid grid-cols-3 gap-2">
          {STADIUM_STYLE_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setGenerationStyle(filter.id)}
              isActive={generationStyle === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-1" />
              <span className="text-xs">{filter.label}</span>
            </StyleButton>
          ))}
        </div>
      </div>

      {/* Perspective */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Perspective</Label>
        <div className="grid grid-cols-3 gap-2">
          {STADIUM_PERSPECTIVE_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setPerspective(filter.id)}
              isActive={perspective === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-1" />
              <span className="text-xs">{filter.label}</span>
            </StyleButton>
          ))}
        </div>
      </div>

      {/* Atmosphere */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Atmosphere</Label>
        <div className="grid grid-cols-3 gap-2">
          {STADIUM_ATMOSPHERE_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setAtmosphere(filter.id)}
              isActive={atmosphere === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-1" />
              <span className="text-xs">{filter.label}</span>
            </StyleButton>
          ))}
        </div>
      </div>

      {/* Time of Day */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Time of Day</Label>
        <div className="grid grid-cols-3 gap-2">
          {STADIUM_TIME_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setTimeOfDay(filter.id)}
              isActive={timeOfDay === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-1" />
              <span className="text-xs">{filter.label}</span>
            </StyleButton>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Weather</Label>
        <div className="grid grid-cols-3 gap-2">
          {STADIUM_WEATHER_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setWeather(filter.id)}
              isActive={weather === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-1" />
              <span className="text-xs">{filter.label}</span>
            </StyleButton>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Custom Prompt (Optional)</Label>
        <Textarea 
          value={customPrompt} 
          onChange={(e) => setCustomPrompt(e.target.value)} 
          placeholder="e.g., a futuristic stadium on Mars"
          className="min-h-[80px] bg-[#111011] border-[#333333] text-[#FDFDFD] focus:border-[#A20131]"
        />
      </div>

      {/* Generation Cost */}
      {generationCost && (
        <div className="text-xs text-[#ADADAD] text-center">
          Est. cost: ${generationCost.toFixed(3)}
        </div>
      )}
    </div>
  )
} 