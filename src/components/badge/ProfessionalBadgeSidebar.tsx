'use client'

import React, { useRef } from 'react'
import { 
  Upload, X, Zap, Gamepad2, Globe, Crown, Palette,
  FileImage, Settings, MessageSquare, ChevronDown, ChevronUp, User, Hash, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// NEW TYPE DEFINITION
interface ApiBadge {
  id: string;
  name: string;
  previewImage: string | null;
}

const SPORTS_OPTIONS = [
  { id: 'soccer', name: 'Soccer', description: 'Soccer badge' },
  { id: 'basketball', name: 'Basketball', description: 'Basketball badge' },
  { id: 'nfl', name: 'American Football', description: 'NFL badge' }
]

const VIEW_OPTIONS = [
  { id: 'logo', name: 'Logo View', description: 'Badge logo design' },
  { id: 'emblem', name: 'Emblem View', description: 'Badge emblem design' }
]

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern' },
  { id: 'retro', label: 'Retro' },
  { id: 'national', label: 'National' },
  { id: 'urban', label: 'Urban' },
  { id: 'classic', label: 'Classic' }
]

interface ProfessionalBadgeSidebarProps {
  availableBadges: ApiBadge[];
  selectedBadge: string;
  setSelectedBadge: (badge: string) => void;
  badgeName: string
  setBadgeName: (name: string) => void
  selectedStyle: string
  setSelectedStyle: (style: string) => void
  customPrompt: string
  setCustomPrompt: (prompt: string) => void
  quality: 'standard' | 'hd'
  setQuality: (quality: 'standard' | 'hd') => void
  isVisionMode: boolean
  referenceImage: string | null
  selectedSport: string
  setSelectedSport: (sport: string) => void
  selectedBadgeView: 'logo' | 'emblem'
  setSelectedBadgeView: (view: 'logo' | 'emblem') => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearReference: () => void
  generationCost?: number | null
  error: string | null
  onResetError: () => void
}

export default function ProfessionalBadgeSidebar({
  availableBadges = [], // Default para array vazio
  selectedBadge,
  setSelectedBadge,
  badgeName,
  setBadgeName,
  selectedStyle,
  setSelectedStyle,
  customPrompt,
  setCustomPrompt,
  quality,
  setQuality,
  isVisionMode,
  referenceImage,
  selectedSport,
  setSelectedSport,
  selectedBadgeView,
  setSelectedBadgeView,
  onFileUpload,
  onClearReference,
  generationCost,
  error,
  onResetError
}: ProfessionalBadgeSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedSections, setExpandedSections] = React.useState({
    vision: false,
    prompt: false,
    template: true,
    details: true,
    style: true,
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

        {/* NEW: Badge Template Selection */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Select Template" 
              section="template" 
              icon={Award}
              required
            />
          </CardHeader>
          {expandedSections.template && (
            <CardContent className="p-3 pt-2">
              <Select
                value={selectedBadge}
                onValueChange={setSelectedBadge}
                disabled={!availableBadges || availableBadges.length === 0}
              >
                <SelectTrigger className="w-full bg-transparent border-[rgba(169,169,169,0.2)] text-[#FDFDFD]">
                  <SelectValue placeholder="Select a badge template..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1C] border-[rgba(169,169,169,0.2)] text-[#FDFDFD] shadow-lg">
                  <SelectItem value="custom_only" className="focus:bg-[#A20131]/20">
                    No Template (Custom Generation)
                  </SelectItem>
                  {(availableBadges || []).map((badge) => (
                    <SelectItem key={badge.id} value={badge.id} className="focus:bg-[#A20131]/20">
                      {badge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          )}
        </Card>

        {/* Badge Details */}
        <Card className="bg-[#333333]/20 border-[#333333] shadow-lg">
          <CardHeader className="p-0">
            <SectionHeader 
              title="Badge Details" 
              section="details" 
              icon={User}
              required
              badge={badgeName ? badgeName : undefined}
            />
          </CardHeader>
          {expandedSections.details && (
            <CardContent className="p-3 pt-0 space-y-2">
              <div>
                <label className="block text-xs font-medium text-[#ADADAD] mb-1">
                  Badge Name <span className="text-[#A20131]">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADADAD]" />
                  <input
                    type="text"
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value.toUpperCase())}
                    placeholder="CHAMPION"
                    maxLength={15}
                    className={cn(
                      "w-full pl-10 pr-3 py-2 cyber-select text-sm placeholder-[#ADADAD] transition-colors",
                      badgeName ? "text-[#707070]" : "text-[#FDFDFD]"
                    )}
                  />
                </div>
              </div>
              <p className="text-xs text-[#ADADAD]">Name: max 15 characters</p>
            </CardContent>
          )}
        </Card>
        
        {/* Badge Style */}
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
            <CardContent className="p-4 pt-0">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 cyber-select text-sm transition-colors pointer-events-auto relative",
                  selectedStyle ? "text-[#707070]" : "text-[#FDFDFD]"
                )}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {STYLE_FILTERS.map((style) => (
                  <option key={style.id} value={style.id} className="bg-[#1C1C1C] text-[#FDFDFD]">
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

        {/* Upload Image */}
        <Card className="cyber-card-upload-badge border-[#333333] shadow-lg">
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
                            onClick={() => setSelectedBadgeView(view.id as 'logo' | 'emblem')}
                            className={cn(
                              "p-2 rounded-lg border text-left transition-all duration-200",
                              selectedBadgeView === view.id
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
                  placeholder="e.g., add golden elements, vintage style, medieval theme..."
                  rows={3}
                  maxLength={200}
                  className={cn(
                    "w-full px-3 py-2 cyber-select text-sm placeholder-[#ADADAD] transition-colors resize-none",
                    customPrompt ? "text-[#707070]" : "text-[#FDFDFD]"
                  )}
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
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQuality('standard')}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200 text-center pointer-events-auto relative",
                    quality === 'standard'
                      ? "border-[#A20131] bg-[#A20131]/10 text-[#A20131]"
                      : "border-[#333333] bg-[#333333]/20 text-[#ADADAD] hover:border-[#ADADAD] hover:text-[#FDFDFD]"
                  )}
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10,
                    position: 'relative'
                  }}
                >
                  <div className="text-sm font-medium">Standard</div>
                  <div className="text-xs opacity-70">Fast generation</div>
                </button>
                <button
                  onClick={() => setQuality('hd')}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200 text-center pointer-events-auto relative",
                    quality === 'hd'
                      ? "border-[#A20131] bg-[#A20131]/10 text-[#A20131]"
                      : "border-[#333333] bg-[#333333]/20 text-[#ADADAD] hover:border-[#ADADAD] hover:text-[#FDFDFD]"
                  )}
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10,
                    position: 'relative'
                  }}
                >
                  <div className="text-sm font-medium">HD</div>
                  <div className="text-xs opacity-70">High quality</div>
                </button>
              </div>
              {generationCost && (
                <div className="mt-3 p-2 cyber-select">
                  <div className="text-xs text-[#ADADAD]">Estimated Cost</div>
                  <div className="text-sm font-medium text-[#A20131]">${generationCost.toFixed(3)}</div>
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