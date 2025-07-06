'use client'

import React from 'react'
import { Upload, X, Zap, Gamepad2, Globe, Crown, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import StyleButton from '@/components/ui/StyleButton'

const STYLE_FILTERS = [
  { id: 'modern', label: 'Modern', icon: Zap },
  { id: 'retro', label: 'Retro', icon: Gamepad2 },
  { id: 'national', label: 'National', icon: Globe },
  { id: 'urban', label: 'Urban', icon: Palette },
  { id: 'classic', label: 'Classic', icon: Crown }
]

interface ProfessionalBadgeSidebarProps {
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
  selectedBadgeView: 'logo' | 'emblem'
  setSelectedBadgeView: (view: 'logo' | 'emblem') => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearReference: () => void
  generationCost?: number | null
  error: string | null
  onResetError: () => void
}

export default function ProfessionalBadgeSidebar({
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
  selectedBadgeView,
  setSelectedBadgeView,
  onFileUpload,
  onClearReference,
  generationCost,
  error,
  onResetError
}: ProfessionalBadgeSidebarProps) {
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

      {/* Style Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
            Badge Style
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {STYLE_FILTERS.map((filter) => (
            <StyleButton
              key={filter.id}
              onClick={() => setSelectedStyle(filter.id)}
              isActive={selectedStyle === filter.id}
            >
              <filter.icon className="w-4 h-4 mr-1" />
              <span className="text-xs">{filter.label}</span>
            </StyleButton>
          ))}
        </div>
      </div>

      {/* Vision Reference Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
            Reference Image (Optional)
          </h3>
        </div>
        
        {!isVisionMode ? (
          <div className="border-2 border-dashed border-[#333333] rounded-lg p-6 text-center hover:border-[#A20131] transition-colors cursor-pointer bg-[#111011]/50">
            <input
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              className="hidden"
              id="badge-vision-upload"
            />
            <label htmlFor="badge-vision-upload" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-4xl text-[#ADADAD]">📎</div>
                <p className="text-[#ADADAD] text-sm">Upload badge reference</p>
                <p className="text-xs text-[#ADADAD]/70">AI will analyze and enhance your design</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={referenceImage!} 
                alt="Reference" 
                className="w-full h-32 object-cover rounded-lg border border-[#333333]" 
              />
              <button
                onClick={onClearReference}
                className="absolute top-2 right-2 bg-[#A20131] hover:bg-[#A20131]/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#FDFDFD]">Badge View</Label>
              <div className="grid grid-cols-2 gap-2">
                <StyleButton
                  onClick={() => setSelectedBadgeView('logo')}
                  isActive={selectedBadgeView === 'logo'}
                >
                  Logo
                </StyleButton>
                <StyleButton
                  onClick={() => setSelectedBadgeView('emblem')}
                  isActive={selectedBadgeView === 'emblem'}
                >
                  Emblem
                </StyleButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Badge Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
            Badge Details
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-[#FDFDFD] block mb-2">Badge Name</Label>
            <input 
              type="text" 
              value={badgeName} 
              onChange={(e) => setBadgeName(e.target.value)} 
              className="w-full px-4 py-3 rounded-lg bg-[#111011] border border-[#333333] text-[#FDFDFD] focus:border-[#A20131] focus:outline-none" 
              placeholder="CHAMPION" 
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-[#FDFDFD] block mb-2">Custom Prompt (Optional)</Label>
            <Textarea 
              value={customPrompt} 
              onChange={(e) => setCustomPrompt(e.target.value)} 
              className="min-h-[80px] bg-[#111011] border-[#333333] text-[#FDFDFD] focus:border-[#A20131]" 
              placeholder="Additional requirements for your badge design..."
              rows={3}
            />
            <p className="text-xs text-[#ADADAD]/70 mt-1">This will be added to the generation prompt</p>
          </div>
        </div>
      </div>

      {/* Quality Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-[#FDFDFD]">Image Quality</Label>
        <div className="grid grid-cols-2 gap-2">
          <StyleButton
            onClick={() => setQuality('standard')}
            isActive={quality === 'standard'}
          >
            <span className="text-xs">Standard</span>
          </StyleButton>
          <StyleButton
            onClick={() => setQuality('hd')}
            isActive={quality === 'hd'}
          >
            <span className="text-xs">HD</span>
          </StyleButton>
        </div>
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