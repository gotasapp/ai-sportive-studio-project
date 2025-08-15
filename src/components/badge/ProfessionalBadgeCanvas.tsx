'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, 
  Loader2, AlertCircle, CheckCircle, Eye, Move,
  Grid3X3, Layers, Shield, Zap, Gamepad2, Globe, Crown, Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import Image from 'next/image';

interface ProfessionalBadgeCanvasProps {
  generatedImage: string | null
  isLoading: boolean
  error: string | null
  onResetError: () => void
  badgeName: string
  selectedStyle: string
  quality: 'standard' | 'hd'
  customPrompt: string
  referenceImage: string | null
  isVisionMode: boolean
  isAnalyzing: boolean
}

export default function ProfessionalBadgeCanvas({
  generatedImage,
  isLoading,
  error,
  onResetError,
  badgeName,
  selectedStyle,
  quality,
  customPrompt,
  referenceImage,
  isVisionMode,
  isAnalyzing
}: ProfessionalBadgeCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleDownload = () => {
    if (generatedImage && imageRef.current) {
      const link = document.createElement('a')
      link.href = generatedImage
      link.download = `badge-${badgeName || 'custom'}-${selectedStyle}.png`
      link.click()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (generatedImage) {
      setIsDragging(true)
      const startX = e.clientX - pan.x
      const startY = e.clientY - pan.y

      const handleMouseMove = (e: MouseEvent) => {
        setPan({
          x: e.clientX - startX,
          y: e.clientY - startY
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  const getStyleIcon = () => {
    switch (selectedStyle) {
      case 'modern': return <Zap className="w-3 h-3" />
      case 'retro': return <Gamepad2 className="w-3 h-3" />
      case 'national': return <Globe className="w-3 h-3" />
      case 'urban': return <Palette className="w-3 h-3" />
      case 'classic': return <Crown className="w-3 h-3" />
      default: return <Shield className="w-3 h-3" />
    }
  }

  const renderPlaceholder = () => (
    <div className="flex-1 flex items-center justify-center bg-[#14101e]">
      <div className="text-center text-[#444444]">
        <Shield className="w-24 h-24 mx-auto" />
        <h3 className="mt-4 text-lg font-semibold text-[#FDFDFD]">Badge Preview</h3>
        <p className="mt-1 text-sm text-[#ADADAD]">
          Your generated badge will appear here once created.
        </p>
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <Loader2 className="w-16 h-16 text-[#FF0052] animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-[#FF0052]/20 rounded-full"></div>
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">
          {isAnalyzing ? 'Analyzing Badge Reference...' : 'Generating Badge...'}
        </h3>
        <p className="text-sm text-[#ADADAD] mb-4">
          {isAnalyzing 
            ? 'Our AI is analyzing your reference image to understand the design elements and style...'
            : isVisionMode 
              ? 'Creating your badge based on the reference image...' 
              : 'Creating your custom badge design...'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#FF0052] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[#FF0052] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#FF0052] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )

  const renderError = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">
          Generation Failed
        </h3>
        <p className="text-sm text-red-400 mb-4">
          {error}
        </p>
        <Button
          onClick={onResetError}
          variant="outline"
          className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
        >
          Try Again
        </Button>
      </div>
    </div>
  )

  const renderImage = () => (
    <div className="flex-1 flex flex-col">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#333333]/20 border-b border-[#333333]">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            <CheckCircle className="w-2.5 h-2.5 mr-1" />
            Generated
          </Badge>
          <span className="text-xs text-[#ADADAD]">
            {badgeName} • {selectedStyle} • {quality.toUpperCase()}
          </span>
          {isVisionMode && (
            <Badge variant="outline" className="bg-[#FF0052]/10 text-[#FF0052] border-[#FF0052]/30">
              Vision Enhanced
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom Out</p>
                </TooltipContent>
              </Tooltip>

              <span className="text-xs text-[#ADADAD] min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom In</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#14101e] cursor-move"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : generatedImage ? 'grab' : 'default' }}
      >
        {/* Grid Overlay */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #333333 1px, transparent 1px),
                linear-gradient(to bottom, #333333 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* Reference Image */}
        {showReference && referenceImage && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            }}
          >
            <Image
              src={referenceImage}
              alt="Reference"
              width={400}
              height={600}
              className="max-w-full max-h-full object-contain opacity-30 border-2 border-[#FF0052]/50 rounded-lg"
            />
          </div>
        )}

        {/* Generated Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <Image
            ref={imageRef}
            src={generatedImage || ''}
            alt="Generated Badge"
            width={400}
            height={600}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-[#333333]"
            draggable={false}
          />
        </div>

        {/* Pan/Zoom Instructions */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center gap-2 text-xs text-[#ADADAD]">
            <Move className="w-3 h-3" />
            <span>Drag to pan • Scroll to zoom</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="h-full mt-[10px] m-[10px] mb-0 bg-[#111011]/40 border-[#333333] shadow-xl max-w-4xl mx-auto">
      <CardContent className="p-[1px] pb-0 h-full flex flex-col">
        {error ? renderError() : isLoading ? renderLoading() : generatedImage ? renderImage() : renderPlaceholder()}
      </CardContent>
    </Card>
  )
} 