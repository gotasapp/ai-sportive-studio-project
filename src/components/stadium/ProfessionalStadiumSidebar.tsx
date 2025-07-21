'use client'

import React, { useRef } from 'react'
import { 
  Upload, X, Building, Users, Eye, Camera, Zap, Cloud, Sunset,
  FileImage, Settings, MessageSquare, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// NEW TYPE: Aligning with the data structure from the parent component
interface ApiStadium {
  id: string;
  name: string;
  previewImage: string | null;
}

const SPORTS_OPTIONS = [
  { id: 'soccer', name: 'Soccer', description: 'Soccer stadium' },
  { id: 'basketball', name: 'Basketball', description: 'Basketball arena' },
  { id: 'nfl', name: 'American Football', description: 'NFL stadium' }
]

const VIEW_OPTIONS = [
  { id: 'external', name: 'External View', description: 'Stadium exterior view' },
  { id: 'internal', name: 'Internal View', description: 'Stadium interior view' }
]

const GENERATION_STYLES = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'dramatic', label: 'Dramatic' }
]

const PERSPECTIVES = [
  { id: 'external', label: 'External' },
  { id: 'internal', label: 'Internal' },
  { id: 'mixed', label: 'Mixed' }
]

const ATMOSPHERES = [
  { id: 'packed', label: 'Packed' },
  { id: 'half_full', label: 'Half Full' },
  { id: 'empty', label: 'Empty' }
]

const TIME_OPTIONS = [
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
  { id: 'sunset', label: 'Sunset' }
]

const WEATHER_OPTIONS = [
  { id: 'clear', label: 'Clear' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'cloudy', label: 'Cloudy' }
]

interface ProfessionalStadiumSidebarProps {
  availableStadiums: ApiStadium[] // Use the new type here
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedSections, setExpandedSections] = React.useState({
    vision: false,
    prompt: false,
    template: true,
    style: true,
    perspective: true,
    atmosphere: true,
    time: true,
    weather: true,
    settings: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const SectionHeader = ({ 
    title, 
    section, 
    icon: Icon, 
    required = false,
    badge,
    onClick,
    expanded
  }: { 
    title: string
    section: keyof typeof expandedSections
    icon: React.ComponentType<any>
    required?: boolean
    badge?: string
    onClick?: () => void
    expanded?: boolean
  }) => (
    <button
      onClick={onClick || (() => toggleSection(section))}
      className="w-full flex items-center justify-between p-3 hover:bg-[#333333]/30 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#ADADAD]" />
        <span className="text-sm font-medium text-[#FDFDFD]">{title}</span>
        {required && <span className="text-[#A20131] text-xs"></span>}
        {/* Remover badge do SectionHeader */}
        {/* {badge && (
          <Badge variant="secondary" className="text-xs bg-transparent text-[#ADADAD] border-[#333333]" style={{ borderWidth: '0.5px', borderColor: '#333333' }}>
            {badge}
          </Badge>
        )} */}
      </div>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-[#ADADAD] group-hover:text-[#FDFDFD]" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[#ADADAD] group-hover:text-[#FDFDFD]" />
      )}
    </button>
  )

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* CONTEÚDO ROLÁVEL */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start justify-between">
                <p className="text-sm text-red-400 flex-1">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetError}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* NEW: Stadium Template Selection */}
          <div className="space-y-2">
            <SectionHeader 
              title="Select Template" 
              section="template" 
              icon={Building}
              required
            />
            <Select
              value={selectedStadium}
              onValueChange={setSelectedStadium}
              disabled={availableStadiums.length === 0}
            >
              <SelectTrigger className="w-full bg-transparent border-none text-[#FDFDFD]">
                <SelectValue placeholder="Select a stadium template..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1C] border-none text-[#FDFDFD] shadow-lg">
                {availableStadiums.length > 0 ? (
                  availableStadiums.map((stadium) => (
                    <SelectItem key={stadium.id} value={stadium.id} className="focus:bg-[#A20131]/20">
                      {stadium.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Loading stadiums...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Generation Style */}
          <div className="space-y-2">
            <SectionHeader 
              title="Style" 
              section="style" 
              icon={Camera}
              badge={GENERATION_STYLES.find(s => s.id === generationStyle)?.label}
            />
            <select
              value={generationStyle}
              onChange={(e) => setGenerationStyle(e.target.value)}
              className={cn(
                "w-full px-3 py-2 cyber-select text-sm transition-colors pointer-events-auto relative",
                generationStyle ? "text-[#707070]" : "text-[#FDFDFD]"
              )}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              {GENERATION_STYLES.map((style) => (
                <option key={style.id} value={style.id} className="bg-[#1C1C1C] text-[#FDFDFD]">
                  {style.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#ADADAD] mt-2">
              Selected: {GENERATION_STYLES.find(s => s.id === generationStyle)?.label} style
            </p>
          </div>

          {/* Perspective */}
          <div className="space-y-2">
            <SectionHeader 
              title="Perspective" 
              section="perspective" 
              icon={Eye}
              badge={PERSPECTIVES.find(p => p.id === perspective)?.label}
            />
            <select
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              className={cn(
                "w-full px-3 py-2 cyber-select text-sm transition-colors pointer-events-auto relative",
                perspective ? "text-[#707070]" : "text-[#FDFDFD]"
              )}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              {PERSPECTIVES.map((persp) => (
                <option key={persp.id} value={persp.id} className="bg-[#1C1C1C] text-[#FDFDFD]">
                  {persp.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#ADADAD] mt-2">
              Selected: {PERSPECTIVES.find(p => p.id === perspective)?.label} perspective
            </p>
          </div>

          {/* Atmosphere */}
          <div className="space-y-2">
            <SectionHeader 
              title="Atmosphere" 
              section="atmosphere" 
              icon={Users}
              badge={ATMOSPHERES.find(a => a.id === atmosphere)?.label}
            />
            <select
              value={atmosphere}
              onChange={(e) => setAtmosphere(e.target.value)}
              className={cn(
                "w-full px-3 py-2 cyber-select text-sm transition-colors pointer-events-auto relative",
                atmosphere ? "text-[#707070]" : "text-[#FDFDFD]"
              )}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              {ATMOSPHERES.map((atm) => (
                <option key={atm.id} value={atm.id} className="bg-[#1C1C1C] text-[#FDFDFD]">
                  {atm.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#ADADAD] mt-2">
              Selected: {ATMOSPHERES.find(a => a.id === atmosphere)?.label} atmosphere
            </p>
          </div>

          {/* Time of Day */}
          <div className="space-y-2">
            <SectionHeader 
              title="Time of Day" 
              section="time" 
              icon={Sunset}
              badge={TIME_OPTIONS.find(t => t.id === timeOfDay)?.label}
            />
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className={cn(
                "w-full px-3 py-2 cyber-select text-sm transition-colors pointer-events-auto relative",
                timeOfDay ? "text-[#707070]" : "text-[#FDFDFD]"
              )}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time.id} value={time.id} className="bg-[#1C1C1C] text-[#FDFDFD]">
                  {time.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#ADADAD] mt-2">
              Selected: {TIME_OPTIONS.find(t => t.id === timeOfDay)?.label} time
            </p>
          </div>

          {/* Weather */}
          <div className="space-y-2">
            <SectionHeader 
              title="Weather" 
              section="weather" 
              icon={Cloud}
              badge={WEATHER_OPTIONS.find(w => w.id === weather)?.label}
            />
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className={cn(
                "w-full px-3 py-2 cyber-select text-sm transition-colors pointer-events-auto relative",
                weather ? "text-[#707070]" : "text-[#FDFDFD]"
              )}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              {WEATHER_OPTIONS.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#1C1C1C] text-[#FDFDFD]">
                  {w.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#ADADAD] mt-2">
              Selected: {WEATHER_OPTIONS.find(w => w.id === weather)?.label} weather
            </p>
          </div>

          {/* Upload Image */}
          <div className="space-y-2">
            <SectionHeader 
              title="Upload Image" 
              section="vision" 
              icon={FileImage}
              badge={referenceImage ? "Active" : undefined}
              onClick={() => setExpandedSections(prev => ({ ...prev, vision: !prev.vision }))}
              expanded={expandedSections.vision}
            />
            {expandedSections.vision && (
              <div
                className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-[#333333] rounded-lg text-center cursor-pointer hover:border-[#A20131] hover:bg-[#A20131]/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={onFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                />
                <FileImage className="w-6 h-6 text-[#ADADAD] mb-2" />
                <p className="text-sm font-medium text-[#FDFDFD] mb-1">Upload Reference</p>
                <p className="text-xs text-[#ADADAD]">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <SectionHeader 
              title="Custom Prompt" 
              section="prompt" 
              icon={Sparkles}
              badge={customPrompt ? "Added" : undefined}
              onClick={() => setExpandedSections(prev => ({ ...prev, prompt: !prev.prompt }))}
              expanded={expandedSections.prompt}
            />
            {expandedSections.prompt && (
              <div>
                <label className="block text-xs font-medium text-[#ADADAD] mb-1">
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., a futuristic stadium on Mars, with neon lights..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 cyber-select text-[#FDFDFD] text-sm placeholder-[#ADADAD] transition-colors resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-[#ADADAD]">
                    Custom instructions for AI generation
                  </p>
                  <span className="text-xs text-[#ADADAD]">
                    {customPrompt.length}/200
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Generation Cost */}
          {generationCost && (
            <div className="space-y-2">
              <SectionHeader 
                title="Generation Cost" 
                section="settings" 
                icon={Zap}
              />
              <CardContent className="p-4">
                <div className="p-2 cyber-select">
                  <div className="text-xs text-[#ADADAD]">Estimated Cost</div>
                  <div className="text-sm font-medium text-[#A20131]">${generationCost.toFixed(3)}</div>
                </div>
              </CardContent>
            </div>
          )}
        </div> {/* Fecha o flex-1 overflow-y-auto */}
      </div> {/* Fecha o h-full flex flex-col */}
    </TooltipProvider>
  )
} 