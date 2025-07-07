'use client'

import React from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StadiumInfo } from '@/lib/services/stadium-service'

const SPORTS_OPTIONS = [
  { id: 'soccer', name: 'Soccer', description: 'Soccer stadium' },
  { id: 'basketball', name: 'Basketball', description: 'Basketball arena' },
  { id: 'nfl', name: 'American Football', description: 'NFL stadium' }
]

const VIEW_OPTIONS = [
  { id: 'external', name: 'External View', description: 'Stadium exterior view' },
  { id: 'internal', name: 'Internal View', description: 'Stadium interior view' }
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
  selectedSport: string
  setSelectedSport: (sport: string) => void
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
  selectedSport,
  setSelectedSport,
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
          <div className="space-y-3">
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
            
            {/* Sport Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#ADADAD]">Sport</Label>
              <select 
                value={selectedSport} 
                onChange={(e) => setSelectedSport(e.target.value)} 
                className="w-full px-3 py-2 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] text-sm focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {SPORTS_OPTIONS.map((sport) => (
                  <option key={sport.id} value={sport.id} className="bg-[#111011] text-[#FDFDFD]">
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#ADADAD]">View</Label>
              <select 
                value={selectedView} 
                onChange={(e) => setSelectedView(e.target.value)} 
                className="w-full px-3 py-2 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] text-sm focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {VIEW_OPTIONS.map((view) => (
                  <option key={view.id} value={view.id} className="bg-[#111011] text-[#FDFDFD]">
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
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

      {/* Stadium Template Selector */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Stadium Template</Label>
        <select 
          value={selectedStadium} 
          onChange={(e) => setSelectedStadium(e.target.value)} 
          disabled={isVisionMode}
          className={`w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none pointer-events-auto relative ${
            isVisionMode ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ 
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
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

      {/* Generation Style */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Generation Style</Label>
        <select 
          value={generationStyle} 
          onChange={(e) => setGenerationStyle(e.target.value)} 
          className="w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <option value="realistic">Realistic</option>
          <option value="cinematic">Cinematic</option>
          <option value="dramatic">Dramatic</option>
        </select>
      </div>

      {/* Perspective */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Perspective</Label>
        <select 
          value={perspective} 
          onChange={(e) => setPerspective(e.target.value)} 
          className="w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <option value="external">External</option>
          <option value="internal">Internal</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {/* Atmosphere */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Atmosphere</Label>
        <select 
          value={atmosphere} 
          onChange={(e) => setAtmosphere(e.target.value)} 
          className="w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <option value="packed">Packed</option>
          <option value="half_full">Half Full</option>
          <option value="empty">Empty</option>
        </select>
      </div>

      {/* Time of Day */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Time of Day</Label>
        <select 
          value={timeOfDay} 
          onChange={(e) => setTimeOfDay(e.target.value)} 
          className="w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <option value="day">Day</option>
          <option value="night">Night</option>
          <option value="sunset">Sunset</option>
        </select>
      </div>

      {/* Weather */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Weather</Label>
        <select 
          value={weather} 
          onChange={(e) => setWeather(e.target.value)} 
          className="w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none pointer-events-auto relative"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <option value="clear">Clear</option>
          <option value="dramatic">Dramatic</option>
          <option value="cloudy">Cloudy</option>
        </select>
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