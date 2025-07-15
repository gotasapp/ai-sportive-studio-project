'use client'

import React, { useRef } from 'react'
import { 
  Upload, Zap, Gamepad2, Globe, Crown, Palette, 
  FileImage, X, Settings, Sparkles, User, Hash,
  ChevronDown, ChevronUp, Info, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'retro', label: 'Retro', icon: Gamepad2, color: 'bg-purple-500/20 text-purple-400' },
  { id: 'national', label: 'National', icon: Globe, color: 'bg-green-500/20 text-green-400' },
  { id: 'urban', label: 'Urban', icon: Palette, color: 'bg-orange-500/20 text-orange-400' },
  { id: 'classic', label: 'Classic', icon: Crown, color: 'bg-yellow-500/20 text-yellow-400' }
]

const SPORTS_OPTIONS = [
  { id: 'soccer', name: 'Soccer', description: 'Professional soccer jersey' },
  { id: 'basketball', name: 'Basketball', description: 'NBA/Basketball jersey' },
  { id: 'nfl', name: 'American Football', description: 'NFL jersey' }
]

const VIEW_OPTIONS = [
  { id: 'back', name: 'Back View', description: 'Jersey back with player name/number' },
  { id: 'front', name: 'Front View', description: 'Jersey front with logo/badge' }
]

interface ProfessionalSidebarProps {
  // Team Selection
  availableTeams: string[]
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  
  // Player Details
  playerName: string
  setPlayerName: (name: string) => void
  playerNumber: string
  setPlayerNumber: (number: string) => void
  
  // Style & Quality
  selectedStyle: string
  setSelectedStyle: (style: string) => void
  quality: 'standard' | 'hd'
  setQuality: (quality: 'standard' | 'hd') => void
  
  // Vision AI
  isVisionMode: boolean
  referenceImage: string | null
  selectedSport: string
  setSelectedSport: (sport: string) => void
  selectedView: string
  setSelectedView: (view: string) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearReference: () => void
  
  // Custom Prompt
  customPrompt: string
  setCustomPrompt: (prompt: string) => void
  
  // Status
  generationCost: number | null
  error: string | null
  onResetError: () => void
}

export default function ProfessionalSidebar({
  availableTeams,
  selectedTeam,
  setSelectedTeam,
  playerName,
  setPlayerName,
  playerNumber,
  setPlayerNumber,
  selectedStyle,
  setSelectedStyle,
  quality,
  setQuality,
  isVisionMode,
  referenceImage,
  selectedSport,
  setSelectedSport,
  selectedView,
  setSelectedView,
  onFileUpload,
  onClearReference,
  customPrompt,
  setCustomPrompt,
  generationCost,
  error,
  onResetError
}: ProfessionalSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedSections, setExpandedSections] = React.useState({
    vision: false,
    team: true,
    style: true,
    player: true,
    settings: false,
    prompt: false
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
      className="SectionHeader w-full flex items-center justify-between p-3 hover:bg-[#333333]/30 rounded-[2px] transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#ADADAD]" />
        <span className="text-sm font-medium text-[#FDFDFD]">{title}</span>
        {required && <span className="text-[#A20131] text-xs"></span>}
        {badge && (
          <Badge variant="secondary" className="text-xs bg-transparent text-[#ADADAD] border-[#333333]" style={{ borderWidth: '0.5px', borderColor: '#333333' }}>
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
      <div className="ProfessionalSidebar space-y-4">

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[2px]">
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

        {/* Team Selection */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Team" 
              section="team" 
              icon={Globe}
              required={!isVisionMode}
              badge={selectedTeam || undefined}
            />
          </CardHeader>
          {expandedSections.team && (
            <CardContent className="CardContent p-4 pt-0">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                disabled={isVisionMode}
                className={cn(
                  "w-full px-3 py-2 cyber-select text-sm rounded-[2px]",
                  "transition-colors",
                  "pointer-events-auto relative", 
                  selectedTeam ? "text-[#707070]" : "text-[#FDFDFD]",
                  isVisionMode && "opacity-50 cursor-not-allowed"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <option value="" className="bg-[#14101e] text-[#FDFDFD]">
                  Select a team...
                </option>
                {availableTeams.map((team) => (
                  <option key={team} value={team} className="bg-[#14101e] text-[#FDFDFD]">
                    {team}
                  </option>
                ))}
              </select>
              {isVisionMode && (
                <p className="text-xs text-[#ADADAD] mt-2">
                  Team auto-detected from reference image
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Style Selection */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Style" 
              section="style" 
              icon={Palette}
              badge={STYLE_FILTERS.find(s => s.id === selectedStyle)?.label}
            />
          </CardHeader>
          {expandedSections.style && (
            <CardContent className="CardContent p-4 pt-0">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 cyber-select text-sm rounded-[2px] transition-colors pointer-events-auto relative", 
                  selectedStyle ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {STYLE_FILTERS.map((style) => (
                  <option key={style.id} value={style.id} className="bg-[#14101e] text-[#FDFDFD]">
                    {style.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#ADADAD] mt-2">
                Selected: {STYLE_FILTERS.find(s => s.id === selectedStyle)?.label} style
              </p>
            </CardContent>
          )}
        </Card>

        {/* Player Details */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Player" 
              section="player" 
              icon={User}
              required
              badge={playerName && playerNumber ? `${playerName} #${playerNumber}` : undefined}
            />
          </CardHeader>
          {expandedSections.player && (
            <CardContent className="CardContent p-3 pt-0 space-y-2">
              <div>
                <label className="block text-xs font-medium text-[#ADADAD] mb-1">
                  Player Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADADAD]" />
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    placeholder="JEFF"
                    maxLength={12}
                    className={cn(
                      "w-full pl-10 pr-3 py-2 cyber-select text-sm rounded-[2px] placeholder-[#ADADAD] transition-colors", 
                      playerName ? "text-[#707070]" : "text-[#FDFDFD]"
                    )}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[#ADADAD] mb-1">
                  Jersey Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADADAD]" />
                  <input
                    type="text"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value)}
                    placeholder="10"
                    maxLength={2}
                    className={cn(
                      "w-full pl-10 pr-3 py-2 cyber-select text-sm rounded-[2px] placeholder-[#ADADAD] transition-colors", 
                      playerNumber ? "text-[#707070]" : "text-[#FDFDFD]"
                    )}
                  />
                </div>
              </div>
              <p className="text-xs text-[#ADADAD]">Name: max 12 chars • Number: 1-99</p>
            </CardContent>
          )}
        </Card>

        {/* Upload Image */}
        <Card className="cyber-card-upload-jersey border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Upload Image" 
              section="vision" 
              icon={FileImage}
              badge={referenceImage ? "Active" : undefined}
            />
          </CardHeader>
          {expandedSections.vision && (
            <CardContent className="CardContent p-3 pt-0 space-y-3">
              {!referenceImage ? (
                                  <div
                    className="upload-area flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-[#333333] rounded-[2px] text-center cursor-pointer hover:border-[#A20131] hover:bg-[#A20131]/5 transition-colors"
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
                      className="w-full h-24 object-cover rounded-[2px] border border-[#333333]"
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
                      <div className="sport-view-buttons grid grid-cols-1 gap-1">
                        {SPORTS_OPTIONS.map(sport => (
                          <button
                            key={sport.id}
                            onClick={() => setSelectedSport(sport.id)}
                            className={cn(
                              "p-2 rounded-[2px] border text-left transition-all duration-200",
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
                       <div className="sport-view-buttons grid grid-cols-1 gap-1">
                        {VIEW_OPTIONS.map(view => (
                          <button
                            key={view.id}
                            onClick={() => setSelectedView(view.id)}
                            className={cn(
                              "p-2 rounded-[2px] border text-left transition-all duration-200",
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
            <CardContent className="CardContent p-3 pt-0 space-y-2">
              <div>
                <label className="block text-xs font-medium text-[#ADADAD] mb-1">
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., make it more colorful, add special patterns, vintage style..."
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
            </CardContent>
          )}
        </Card>

        {/* Quality Settings - HIDDEN: Moved to Admin Panel Moderation */}
        {/* 
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Quality" 
              section="settings" 
              icon={Settings}
              badge={quality.toUpperCase()}
            />
          </CardHeader>
          {expandedSections.settings && (
            <CardContent className="CardContent p-3 pt-0">
              <div className="quality-buttons grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuality('standard')}
                  className={cn(
                    "p-2 rounded-[2px] border transition-colors",
                    quality === 'standard' 
                      ? 'border-[#A20131] bg-[#A20131]/10 text-[#A20131]' 
                      : 'border-[#333333] bg-[#333333]/20 text-[#ADADAD] hover:border-[#ADADAD]'
                  )}
                >
                  <span className="font-semibold text-sm">STANDARD</span>
                </button>
                <button
                  onClick={() => setQuality('hd')}
                  className={cn(
                    "p-2 rounded-[2px] border transition-colors",
                    quality === 'hd'
                      ? 'border-[#A20131] bg-[#A20131]/10 text-[#A20131]' 
                      : 'border-[#333333] bg-[#333333]/20 text-[#ADADAD] hover:border-[#ADADAD]'
                  )}
                >
                  <span className="font-semibold text-sm">HD</span>
                </button>
              </div>
              {generationCost && (
                <div className="mt-3 p-2 rounded-[2px] bg-[#333333]/20 border border-[#333333]">
                  <div className="flex justify-between items-center text-xs">
                    <span className='text-gray-400'>Generation Cost:</span>
                    <span className="text-white font-mono">{generationCost.toFixed(2)} Credits</span>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
        */}
      </div>
    </TooltipProvider>
  )
} 