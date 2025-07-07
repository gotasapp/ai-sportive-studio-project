'use client'

import React, { useRef } from 'react'
import { 
  Upload, X, Building, Users, Eye, Camera, Zap, Cloud, Sunset,
  FileImage, Settings, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
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
    badge
  }: { 
    title: string
    section: keyof typeof expandedSections
    icon: React.ComponentType<any>
    required?: boolean
    badge?: string
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 hover:bg-[#333333]/30 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#ADADAD]" />
        <span className="text-sm font-medium text-[#FDFDFD]">{title}</span>
        {required && <span className="text-[#A20131] text-xs">*</span>}
        {badge && (
          <Badge variant="secondary" className="text-xs bg-[#A20131]/20 text-[#A20131] border-[#A20131]/30">
            {badge}
          </Badge>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="h-4 w-4 text-[#ADADAD] group-hover:text-[#FDFDFD]" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[#ADADAD] group-hover:text-[#FDFDFD]" />
      )}
    </button>
  )

  return (
    <TooltipProvider>
      <div className="space-y-4">
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

        {/* Upload Image */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Upload Image" 
              section="vision" 
              icon={FileImage}
              badge={referenceImage ? "Active" : undefined}
            />
          </CardHeader>
          {expandedSections.vision && (
            <CardContent className="p-3 pt-0 space-y-3">
              {!referenceImage ? (
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
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-full h-24 object-cover rounded-lg border border-[#333333]"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearReference}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 h-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-[#ADADAD] mb-1">Sport</label>
                      <div className="grid grid-cols-1 gap-1">
                        {SPORTS_OPTIONS.map(sport => (
                          <button
                            key={sport.id}
                            onClick={() => setSelectedSport(sport.id)}
                            className={cn(
                              "p-2 rounded-lg border text-left transition-all duration-200",
                              selectedSport === sport.id
                                ? "border-[#A20131] bg-[#A20131]/10 text-[#A20131]"
                                : "border-[#333333] bg-[#333333]/20 text-[#ADADAD] hover:border-[#ADADAD] hover:text-[#FDFDFD]"
                            )}
                          >
                            <div className="text-xs font-medium">{sport.name}</div>
                            <div className="text-xs opacity-70">{sport.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#ADADAD] mb-1">View</label>
                      <div className="grid grid-cols-1 gap-1">
                        {VIEW_OPTIONS.map(view => (
                          <button
                            key={view.id}
                            onClick={() => setSelectedView(view.id)}
                            className={cn(
                              "p-2 rounded-lg border text-left transition-all duration-200",
                              selectedView === view.id
                                ? "border-[#A20131] bg-[#A20131]/10 text-[#A20131]"
                                : "border-[#333333] bg-[#333333]/20 text-[#ADADAD] hover:border-[#ADADAD] hover:text-[#FDFDFD]"
                            )}
                          >
                            <div className="text-xs font-medium">{view.name}</div>
                            <div className="text-xs opacity-70">{view.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Custom Prompt */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Custom Prompt" 
              section="prompt" 
              icon={MessageSquare}
              badge={customPrompt ? "Added" : undefined}
            />
          </CardHeader>
          {expandedSections.prompt && (
            <CardContent className="p-3 pt-0 space-y-2">
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
                  className="w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-[#FDFDFD] text-sm placeholder-[#ADADAD] focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors resize-none"
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
            </CardContent>
          )}
        </Card>

        {/* Stadium Template */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Template" 
              section="template" 
              icon={Building}
              required={!isVisionMode}
              badge={selectedStadium || undefined}
            />
          </CardHeader>
          {expandedSections.template && (
            <CardContent className="p-4 pt-0">
              <select
                value={selectedStadium}
                onChange={(e) => setSelectedStadium(e.target.value)}
                disabled={isVisionMode}
                className={cn(
                  "w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-sm",
                  "focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors",
                  "pointer-events-auto relative",
                  selectedStadium && selectedStadium !== "custom_only" ? "text-[#707070]" : "text-[#FDFDFD]",
                  isVisionMode && "opacity-50 cursor-not-allowed"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <option value="custom_only" className="bg-[#14101e] text-[#FDFDFD]">
                  {isVisionMode ? 'Template disabled (Vision Mode)' : 'No Template (Custom)'}
                </option>
                {availableStadiums.map((stadium) => (
                  <option key={stadium.id} value={stadium.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {stadium.name}
                  </option>
                ))}
              </select>
              {isVisionMode && (
                <p className="text-xs text-[#ADADAD] mt-2">
                  Template auto-detected from reference image
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Generation Style */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Style" 
              section="style" 
              icon={Camera}
              badge={GENERATION_STYLES.find(s => s.id === generationStyle)?.label}
            />
          </CardHeader>
          {expandedSections.style && (
            <CardContent className="p-4 pt-0">
              <select
                value={generationStyle}
                onChange={(e) => setGenerationStyle(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-sm focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors pointer-events-auto relative",
                  generationStyle ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {GENERATION_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {style.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#ADADAD] mt-2">
                Selected: {GENERATION_STYLES.find(s => s.id === generationStyle)?.label} style
              </p>
            </CardContent>
          )}
        </Card>

        {/* Perspective */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Perspective" 
              section="perspective" 
              icon={Eye}
              badge={PERSPECTIVES.find(p => p.id === perspective)?.label}
            />
          </CardHeader>
          {expandedSections.perspective && (
            <CardContent className="p-4 pt-0">
              <select
                value={perspective}
                onChange={(e) => setPerspective(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-sm focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors pointer-events-auto relative",
                  perspective ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {PERSPECTIVES.map((persp) => (
                  <option key={persp.id} value={persp.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {persp.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#ADADAD] mt-2">
                Selected: {PERSPECTIVES.find(p => p.id === perspective)?.label} perspective
              </p>
            </CardContent>
          )}
        </Card>

        {/* Atmosphere */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Atmosphere" 
              section="atmosphere" 
              icon={Users}
              badge={ATMOSPHERES.find(a => a.id === atmosphere)?.label}
            />
          </CardHeader>
          {expandedSections.atmosphere && (
            <CardContent className="p-4 pt-0">
              <select
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-sm focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors pointer-events-auto relative",
                  atmosphere ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {ATMOSPHERES.map((atm) => (
                  <option key={atm.id} value={atm.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {atm.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#ADADAD] mt-2">
                Selected: {ATMOSPHERES.find(a => a.id === atmosphere)?.label} atmosphere
              </p>
            </CardContent>
          )}
        </Card>

        {/* Time of Day */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Time of Day" 
              section="time" 
              icon={Sunset}
              badge={TIME_OPTIONS.find(t => t.id === timeOfDay)?.label}
            />
          </CardHeader>
          {expandedSections.time && (
            <CardContent className="p-4 pt-0">
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-sm focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors pointer-events-auto relative",
                  timeOfDay ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time.id} value={time.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {time.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#ADADAD] mt-2">
                Selected: {TIME_OPTIONS.find(t => t.id === timeOfDay)?.label} time
              </p>
            </CardContent>
          )}
        </Card>

        {/* Weather */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Weather" 
              section="weather" 
              icon={Cloud}
              badge={WEATHER_OPTIONS.find(w => w.id === weather)?.label}
            />
          </CardHeader>
          {expandedSections.weather && (
            <CardContent className="p-4 pt-0">
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-[#14101e] border border-[#333333] rounded-lg text-sm focus:border-[#A20131] focus:ring-1 focus:ring-[#A20131] transition-colors pointer-events-auto relative",
                  weather ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {w.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#ADADAD] mt-2">
                Selected: {WEATHER_OPTIONS.find(w => w.id === weather)?.label} weather
              </p>
            </CardContent>
          )}
        </Card>

        {/* Generation Cost */}
        {generationCost && (
          <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
            <CardContent className="p-4">
              <div className="p-2 bg-[#14101e] rounded-lg border border-[#333333]">
                <div className="text-xs text-[#ADADAD]">Estimated Cost</div>
                <div className="text-sm font-medium text-[#A20131]">${generationCost.toFixed(3)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
} 