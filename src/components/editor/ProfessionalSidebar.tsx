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
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()
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
      className={cn(
        "w-full flex items-center justify-between hover:bg-[#333333]/30 rounded-[2px] transition-colors group",
        isMobile ? "p-2" : "p-3"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("text-[#ADADAD]", isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <span className={cn(
          "font-medium text-[#FDFDFD]",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {title}
        </span>
        {required && <span className="text-[#A20131] text-xs"></span>}
        {badge && (
          <Badge 
            variant="secondary" 
            className={cn(
              "bg-transparent text-[#ADADAD] border-[#333333]",
              isMobile ? "text-xs px-1 py-0 h-4" : "text-xs"
            )}
            style={{ borderWidth: '0.5px', borderColor: '#333333' }}
          >
            {badge}
          </Badge>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className={cn(
          "text-[#ADADAD] group-hover:text-[#FDFDFD]",
          isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
        )} />
      ) : (
        <ChevronDown className={cn(
          "text-[#ADADAD] group-hover:text-[#FDFDFD]",
          isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
        )} />
      )}
    </button>
  )

  return (
    <TooltipProvider>
      <div className={cn("space-y-3", isMobile && "space-y-2")}>

        {/* Error Display */}
        {error && (
          <div className={cn(
            "bg-red-500/10 border border-red-500/30 rounded-[2px]",
            isMobile ? "p-2" : "p-3"
          )}>
            <div className="flex items-start justify-between">
              <p className={cn(
                "text-red-400 flex-1",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {error}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetError}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
              >
                <X className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3")} />
              </Button>
            </div>
          </div>
        )}

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
            <CardContent className={cn("pt-0 space-y-3", isMobile ? "p-2" : "p-3")}>
              {!referenceImage ? (
                <div
                  className={cn(
                    "flex flex-col items-center justify-center w-full border-2 border-dashed border-[#333333] rounded-[2px] text-center cursor-pointer hover:border-[#A20131] hover:bg-[#A20131]/5 transition-colors",
                    isMobile ? "p-3" : "p-4"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={onFileUpload}
                    accept="image/png, image/jpeg, image/webp"
                  />
                  <FileImage className={cn(
                    "text-[#ADADAD] mb-2",
                    isMobile ? "w-5 h-5" : "w-6 h-6"
                  )} />
                  <p className={cn(
                    "font-medium text-[#FDFDFD] mb-1",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    Upload Reference
                  </p>
                  <p className={cn(
                    "text-[#ADADAD]",
                    isMobile ? "text-xs" : "text-xs"
                  )}>
                    {isMobile ? "PNG, JPG, WEBP" : "PNG, JPG, WEBP up to 10MB"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={cn(
                    "relative rounded-[2px] overflow-hidden border border-[#333333]",
                    isMobile ? "h-24" : "h-32"
                  )}>
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearReference}
                      className="absolute top-1 right-1 text-white hover:text-red-400 hover:bg-red-500/20 p-1 h-auto"
                    >
                      <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    </Button>
                  </div>
                  
                  {/* Sport & View Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className={cn(
                        "text-[#ADADAD] font-medium",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        Sport
                      </label>
                      <select
                        value={selectedSport}
                        onChange={(e) => setSelectedSport(e.target.value)}
                        className={cn(
                          "cyber-input w-full bg-transparent border border-[#333333] text-[#FDFDFD] rounded-[2px] focus:border-[#A20131] focus:outline-none",
                          isMobile ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                        )}
                      >
                        {SPORTS_OPTIONS.map(sport => (
                          <option key={sport.id} value={sport.id} className="bg-[#1a1a1a] text-[#FDFDFD]">
                            {sport.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className={cn(
                        "text-[#ADADAD] font-medium",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        View
                      </label>
                      <select
                        value={selectedView}
                        onChange={(e) => setSelectedView(e.target.value)}
                        className={cn(
                          "cyber-input w-full bg-transparent border border-[#333333] text-[#FDFDFD] rounded-[2px] focus:border-[#A20131] focus:outline-none",
                          isMobile ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                        )}
                      >
                        {VIEW_OPTIONS.map(view => (
                          <option key={view.id} value={view.id} className="bg-[#1a1a1a] text-[#FDFDFD]">
                            {view.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Team Selection */}
        <Card className="cyber-card border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Team Selection" 
              section="team" 
              icon={Settings}
              badge={selectedTeam || undefined}
            />
          </CardHeader>
          {expandedSections.team && (
            <CardContent className={cn("pt-0", isMobile ? "p-2" : "p-3")}>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className={cn(
                  "cyber-input w-full bg-transparent border border-[#333333] text-[#FDFDFD] rounded-[2px] focus:border-[#A20131] focus:outline-none",
                  isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
                )}
              >
                <option value="" className="bg-[#1a1a1a] text-[#FDFDFD]">Select a team...</option>
                {availableTeams.map(team => (
                  <option key={team} value={team} className="bg-[#1a1a1a] text-[#FDFDFD]">
                    {team.charAt(0).toUpperCase() + team.slice(1)}
                  </option>
                ))}
              </select>
            </CardContent>
          )}
        </Card>

        {/* Player Details */}
        <Card className="cyber-card border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Player Details" 
              section="player" 
              icon={User}
              required={true}
              badge={playerName && playerNumber ? "Ready" : undefined}
            />
          </CardHeader>
          {expandedSections.player && (
            <CardContent className={cn("pt-0 space-y-3", isMobile ? "p-2 space-y-2" : "p-3")}>
              <div className="space-y-1">
                <label className={cn(
                  "text-[#ADADAD] font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Player Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className={cn(
                    "cyber-input w-full bg-transparent border border-[#333333] text-[#FDFDFD] placeholder:text-[#666666] rounded-[2px] focus:border-[#A20131] focus:outline-none",
                    isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
                  )}
                />
              </div>
              
              <div className="space-y-1">
                <label className={cn(
                  "text-[#ADADAD] font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Jersey Number
                </label>
                <input
                  type="text"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  placeholder="00"
                  maxLength={2}
                  className={cn(
                    "cyber-input w-full bg-transparent border border-[#333333] text-[#FDFDFD] placeholder:text-[#666666] rounded-[2px] focus:border-[#A20131] focus:outline-none",
                    isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
                  )}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Style Selection */}
        <Card className="cyber-card border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Style & Quality" 
              section="style" 
              icon={Sparkles}
              badge={selectedStyle || undefined}
            />
          </CardHeader>
          {expandedSections.style && (
            <CardContent className={cn("pt-0 space-y-4", isMobile ? "p-2 space-y-3" : "p-3")}>
              {/* Style Grid */}
              <div className="space-y-2">
                <label className={cn(
                  "text-[#ADADAD] font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Jersey Style
                </label>
                <div className={cn(
                  "grid gap-2",
                  isMobile ? "grid-cols-2" : "grid-cols-3"
                )}>
                  {STYLE_FILTERS.map(style => {
                    const Icon = style.icon
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-[2px] border transition-all duration-200",
                          isMobile ? "p-2" : "p-3",
                          selectedStyle === style.id
                            ? "border-[#A20131] bg-[#A20131]/10"
                            : "border-[#333333] hover:border-[#A20131]/50 hover:bg-[#A20131]/5"
                        )}
                      >
                        <Icon className={cn(
                          selectedStyle === style.id ? "text-[#A20131]" : "text-[#ADADAD]",
                          isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
                        )} />
                        <span className={cn(
                          "font-medium",
                          isMobile ? "text-xs" : "text-sm",
                          selectedStyle === style.id ? "text-[#A20131]" : "text-[#FDFDFD]"
                        )}>
                          {style.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quality Selection */}
              <div className="space-y-2">
                <label className={cn(
                  "text-[#ADADAD] font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Image Quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setQuality('standard')}
                    className={cn(
                      "flex flex-col items-center rounded-[2px] border transition-all duration-200",
                      isMobile ? "p-2" : "p-3",
                      quality === 'standard'
                        ? "border-[#A20131] bg-[#A20131]/10"
                        : "border-[#333333] hover:border-[#A20131]/50"
                    )}
                  >
                    <span className={cn(
                      "font-medium",
                      isMobile ? "text-xs" : "text-sm",
                      quality === 'standard' ? "text-[#A20131]" : "text-[#FDFDFD]"
                    )}>
                      Standard
                    </span>
                    <span className={cn(
                      "text-[#ADADAD]",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      $0.04
                    </span>
                  </button>
                  <button
                    onClick={() => setQuality('hd')}
                    className={cn(
                      "flex flex-col items-center rounded-[2px] border transition-all duration-200",
                      isMobile ? "p-2" : "p-3",
                      quality === 'hd'
                        ? "border-[#A20131] bg-[#A20131]/10"
                        : "border-[#333333] hover:border-[#A20131]/50"
                    )}
                  >
                    <span className={cn(
                      "font-medium",
                      isMobile ? "text-xs" : "text-sm",
                      quality === 'hd' ? "text-[#A20131]" : "text-[#FDFDFD]"
                    )}>
                      HD
                    </span>
                    <span className={cn(
                      "text-[#ADADAD]",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      $0.08
                    </span>
                  </button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Custom Prompt */}
        <Card className="cyber-card border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Custom Prompt" 
              section="prompt" 
              icon={MessageSquare}
              badge={customPrompt ? "Added" : undefined}
            />
          </CardHeader>
          {expandedSections.prompt && (
            <CardContent className={cn("pt-0", isMobile ? "p-2" : "p-3")}>
              <div className="space-y-2">
                <label className={cn(
                  "text-[#ADADAD] font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Additional Instructions
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific details about colors, patterns, or design elements..."
                  rows={isMobile ? 3 : 4}
                  className={cn(
                    "cyber-input w-full bg-transparent border border-[#333333] text-[#FDFDFD] placeholder:text-[#666666] rounded-[2px] focus:border-[#A20131] focus:outline-none resize-none",
                    isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
                  )}
                />
                <p className={cn(
                  "text-[#666666]",
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  Optional: Describe specific elements you want in the jersey design
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Cost Display */}
        {generationCost && (
          <div className={cn(
            "p-3 bg-[#333333]/20 border border-[#333333] rounded-[2px] text-center",
            isMobile && "p-2"
          )}>
            <p className={cn(
              "text-[#ADADAD]",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Estimated Cost: <span className="text-[#A20131] font-medium">${generationCost.toFixed(3)}</span>
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
} 