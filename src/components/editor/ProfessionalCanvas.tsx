'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, 
  Loader2, AlertCircle, CheckCircle, Eye, Move,
  Grid3X3, Layers, Image as ImageIcon, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { isAdmin } from '@/lib/admin-config'
import { useIsMobile } from '@/hooks/use-mobile'
import Image from 'next/image';

// Importando os novos componentes profissionais
import ProfessionalEditorLayout from '@/components/layouts/ProfessionalEditorLayout'
import ProfessionalSidebar from '@/components/editor/ProfessionalSidebar'

interface ProfessionalCanvasProps {
  generatedImage: string | null
  isLoading: boolean
  error: string | null
  onResetError: () => void
  playerName?: string
  playerNumber?: string
  selectedTeam?: string
  selectedStyle?: string
  quality?: 'standard' | 'hd'
  referenceImage?: string | null
  isVisionMode?: boolean
}

export default function ProfessionalCanvas({
  generatedImage,
  isLoading,
  error,
  onResetError,
  playerName,
  playerNumber,
  selectedTeam,
  selectedStyle,
  quality,
  referenceImage,
  isVisionMode
}: ProfessionalCanvasProps) {
  const isMobile = useIsMobile()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)
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
      link.download = `jersey-${selectedTeam || 'custom'}-${playerName || 'player'}-${playerNumber || '00'}.png`
      link.click()
    }
  }

  // Enhanced touch and mouse handling for mobile
  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!generatedImage) return

    e.preventDefault()
    setIsDragging(true)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const startX = clientX - pan.x
    const startY = clientY - pan.y

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const moveX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const moveY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      setPan({
        x: moveX - startX,
        y: moveY - startY
      })
    }

    const handleEnd = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMove as EventListener)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove as EventListener)
      document.removeEventListener('touchend', handleEnd)
    }

    document.addEventListener('mousemove', handleMove as EventListener)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false })
    document.addEventListener('touchend', handleEnd)
  }

  // Pinch-to-zoom for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture detected
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      )
      
      let lastDistance = distance

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          e.preventDefault()
          const touch1 = e.touches[0]
          const touch2 = e.touches[1]
          const newDistance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
          )
          
          const scale = newDistance / lastDistance
          setZoom(prev => Math.min(Math.max(prev * scale, 0.5), 3))
          lastDistance = newDistance
        }
      }

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    } else {
      handleInteractionStart(e)
    }
  }

  const renderPlaceholder = () => (
    <div className="flex-1 flex items-center justify-center bg-[#14101e] rounded-lg">
      <div className="text-center text-[#444444] p-4">
        <ImageIcon className="w-24 h-24 mx-auto mb-4 max-lg:w-16 max-lg:h-16" />
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2 max-lg:text-base">
          Jersey Preview
        </h3>
        <p className="text-sm text-[#ADADAD] max-lg:text-xs max-lg:px-2">
          Your generated jersey will appear here once created.
        </p>
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center rounded-lg">
      <div className="text-center p-4">
        <div className="w-16 h-16 mx-auto mb-4 relative max-lg:w-12 max-lg:h-12 max-lg:mb-2">
          <Loader2 className="w-16 h-16 text-[#A20131] animate-spin max-lg:w-12 max-lg:h-12" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-[#A20131]/20 rounded-full max-lg:w-12 max-lg:h-12"></div>
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2 max-lg:text-base max-lg:mb-1">
          Generating Jersey...
        </h3>
        <p className="text-sm text-[#ADADAD] mb-4 max-lg:text-xs max-lg:mb-2 max-lg:px-2">
          {isVisionMode ? 'Analyzing reference image and generating design...' : 'Creating your custom jersey design...'}
        </p>
        <div className="flex items-center justify-center gap-2 max-lg:gap-1">
          <div className="w-2 h-2 bg-[#A20131] rounded-full animate-pulse max-lg:w-1.5 max-lg:h-1.5"></div>
          <div className="w-2 h-2 bg-[#A20131] rounded-full animate-pulse max-lg:w-1.5 max-lg:h-1.5" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#A20131] rounded-full animate-pulse max-lg:w-1.5 max-lg:h-1.5" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )

  const renderError = () => (
    <div className="flex-1 flex items-center justify-center rounded-lg">
      <div className="text-center max-w-md p-4 max-lg:max-w-xs">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center max-lg:w-12 max-lg:h-12 max-lg:mb-2">
          <AlertCircle className="w-8 h-8 text-red-400 max-lg:w-6 max-lg:h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2 max-lg:text-base max-lg:mb-1">
          Generation Failed
        </h3>
        <p className="text-sm text-red-400 mb-4 max-lg:text-xs max-lg:mb-2">
          {error}
        </p>
        <Button
          onClick={onResetError}
          variant="outline"
          className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 max-lg:text-xs max-lg:px-3 max-lg:py-1.5"
        >
          Try Again
        </Button>
      </div>
    </div>
  )

  const renderImage = () => (
    <div className="flex-1 flex flex-col">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#333333]/20 border-b border-[#333333] max-lg:px-2 max-lg:py-1">
        <div className="flex items-center gap-2 max-lg:gap-1">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 max-lg:text-xs max-lg:px-1.5 max-lg:py-0.5">
            <CheckCircle className="w-2.5 h-2.5 mr-1 max-lg:w-2 max-lg:h-2 max-lg:mr-0.5" />
            Generated
          </Badge>
          <span className="text-xs text-[#ADADAD] max-lg:text-[10px] max-lg:truncate max-lg:max-w-24">
            {selectedTeam} • {playerName} #{playerNumber}
          </span>
        </div>
        
        <div className="flex items-center gap-2 max-lg:gap-1">
          <TooltipProvider>
            <div className="flex items-center gap-1 max-lg:gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 max-lg:p-1 max-lg:h-auto"
                  >
                    <ZoomOut className="h-3.5 w-3.5 max-lg:h-3 max-lg:w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom Out</p>
                </TooltipContent>
              </Tooltip>

              <span className="text-xs text-[#ADADAD] min-w-[3rem] text-center max-lg:text-[10px] max-lg:min-w-[2rem]">
                {Math.round(zoom * 100)}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 max-lg:p-1 max-lg:h-auto"
                  >
                    <ZoomIn className="h-3.5 w-3.5 max-lg:h-3 max-lg:w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom In</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetView}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 max-lg:p-1 max-lg:h-auto"
                  >
                    <RotateCcw className="h-3.5 w-3.5 max-lg:h-3 max-lg:w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset View</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-[#333333] mx-1 max-lg:hidden" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    className={cn(
                      "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 max-lg:hidden",
                      showGrid && "bg-[#A20131]/20 text-[#A20131]"
                    )}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Grid</p>
                </TooltipContent>
              </Tooltip>

              {isVisionMode && referenceImage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReference(!showReference)}
                      className={cn(
                        "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 max-lg:hidden",
                        showReference && "bg-[#A20131]/20 text-[#A20131]"
                      )}
                    >
                      <Layers className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Reference</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <div className="w-px h-4 bg-[#333333] mx-1 max-lg:hidden" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 max-lg:p-1 max-lg:h-auto"
                  >
                    <Download className="h-3.5 w-3.5 max-lg:h-3 max-lg:w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Image</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#14101e] cursor-move"
        onMouseDown={handleInteractionStart as any}
        onTouchStart={handleTouchStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Grid Background - Desktop only */}
        {showGrid && (
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none max-lg:hidden"
            style={{
              backgroundImage: `
                linear-gradient(to right, #333 1px, transparent 1px),
                linear-gradient(to bottom, #333 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* Reference Image Overlay */}
        {showReference && referenceImage && (
          <div className="absolute top-4 right-4 w-24 h-24 md:w-32 md:h-32 border border-[#333333] rounded-lg overflow-hidden opacity-50 max-lg:inset-0 max-lg:w-auto max-lg:h-auto max-lg:opacity-30">
            <Image
              src={referenceImage}
              alt="Reference"
              fill
              className="object-cover max-lg:object-contain"
            />
          </div>
        )}

        {/* Main Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <Image
            ref={imageRef}
            src={generatedImage!}
            alt="Generated Jersey"
            width={512}
            height={512}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl w-[400px] h-[400px] max-lg:w-[280px] max-lg:h-[280px]"
            draggable={false}
          />
        </div>

        {/* Mobile Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2 max-lg:flex max-lg:bg-black/50 max-lg:backdrop-blur-sm max-lg:rounded-lg max-lg:p-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="bg-black/50 backdrop-blur-sm text-[#ADADAD] hover:text-[#FDFDFD] p-2 h-auto max-lg:bg-transparent"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="bg-black/50 backdrop-blur-sm text-[#ADADAD] hover:text-[#FDFDFD] p-2 h-auto max-lg:bg-transparent"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="bg-black/50 backdrop-blur-sm text-[#ADADAD] hover:text-[#FDFDFD] p-2 h-auto max-lg:bg-transparent"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  if (isLoading) return renderLoading()
  if (error) return renderError()
  if (!generatedImage) return renderPlaceholder()
  return renderImage()
} 