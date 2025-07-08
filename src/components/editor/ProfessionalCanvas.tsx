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
<<<<<<< HEAD
    <div className="flex-1 flex items-center justify-center bg-[#14101e] rounded-lg">
      <div className="text-center text-[#444444] p-4">
        <ImageIcon className={cn(
          "mx-auto mb-4",
          isMobile ? "w-16 h-16" : "w-24 h-24"
        )} />
        <h3 className={cn(
          "font-semibold text-[#FDFDFD] mb-2",
          isMobile ? "text-base" : "text-lg"
        )}>
          Jersey Preview
        </h3>
        <p className={cn(
          "text-[#ADADAD]",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {isMobile 
            ? "Generated jersey appears here" 
            : "Your generated jersey will appear here once created."
          }
=======
    <div className="flex-1 flex items-center justify-center bg-[#14101e]">
      <div className="text-center text-[#444444]">
        <ImageIcon className="w-24 h-24 mx-auto lg:w-24 lg:h-24 max-lg:w-16 max-lg:h-16" />
        <h3 className="mt-4 text-lg font-semibold text-[#FDFDFD] lg:text-lg max-lg:text-base max-lg:mt-2">Jersey Preview</h3>
        <p className="mt-1 text-sm text-[#ADADAD] lg:text-sm max-lg:text-xs max-lg:px-4">
          Your generated jersey will appear here once created.
>>>>>>> 77aedeb ( segunda tentativa resposividade)
        </p>
      </div>
    </div>
  )

  const renderLoading = () => (
<<<<<<< HEAD
    <div className="flex-1 flex items-center justify-center rounded-lg">
      <div className="text-center p-4">
        <div className={cn(
          "mx-auto mb-4 relative",
          isMobile ? "w-12 h-12" : "w-16 h-16"
        )}>
          <Loader2 className={cn(
            "text-[#A20131] animate-spin",
            isMobile ? "w-12 h-12" : "w-16 h-16"
          )} />
          <div className={cn(
            "absolute inset-0 border-2 border-[#A20131]/20 rounded-full",
            isMobile ? "w-12 h-12" : "w-16 h-16"
          )}></div>
        </div>
        <h3 className={cn(
          "font-semibold text-[#FDFDFD] mb-2",
          isMobile ? "text-base" : "text-lg"
        )}>
          Generating...
        </h3>
        <p className={cn(
          "text-[#ADADAD] mb-4",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {isMobile 
            ? (isVisionMode ? 'Analyzing & generating...' : 'Creating design...')
            : (isVisionMode ? 'Analyzing reference image and generating design...' : 'Creating your custom jersey design...')
          }
=======
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative lg:w-16 lg:h-16 max-lg:w-12 max-lg:h-12 max-lg:mb-2">
          <Loader2 className="w-16 h-16 text-[#A20131] animate-spin lg:w-16 lg:h-16 max-lg:w-12 max-lg:h-12" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-[#A20131]/20 rounded-full lg:w-16 lg:h-16 max-lg:w-12 max-lg:h-12"></div>
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2 lg:text-lg max-lg:text-base max-lg:mb-1">
          Generating Jersey...
        </h3>
        <p className="text-sm text-[#ADADAD] mb-4 lg:text-sm max-lg:text-xs max-lg:mb-2 max-lg:px-4">
          {isVisionMode ? 'Analyzing reference image and generating design...' : 'Creating your custom jersey design...'}
>>>>>>> 77aedeb ( segunda tentativa resposividade)
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
<<<<<<< HEAD
    <div className="flex-1 flex items-center justify-center rounded-lg">
      <div className="text-center max-w-md p-4">
        <div className={cn(
          "mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center",
          isMobile ? "w-12 h-12" : "w-16 h-16"
        )}>
          <AlertCircle className={cn(
            "text-red-400",
            isMobile ? "w-6 h-6" : "w-8 h-8"
          )} />
        </div>
        <h3 className={cn(
          "font-semibold text-[#FDFDFD] mb-2",
          isMobile ? "text-base" : "text-lg"
        )}>
          Generation Failed
        </h3>
        <p className={cn(
          "text-red-400 mb-4",
          isMobile ? "text-xs" : "text-sm"
        )}>
=======
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md max-lg:max-w-xs max-lg:px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center lg:w-16 lg:h-16 max-lg:w-12 max-lg:h-12 max-lg:mb-2">
          <AlertCircle className="w-8 h-8 text-red-400 lg:w-8 lg:h-8 max-lg:w-6 max-lg:h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2 lg:text-lg max-lg:text-base max-lg:mb-1">
          Generation Failed
        </h3>
        <p className="text-sm text-red-400 mb-4 lg:text-sm max-lg:text-xs max-lg:mb-2">
>>>>>>> 77aedeb ( segunda tentativa resposividade)
          {error}
        </p>
        <Button
          onClick={onResetError}
          variant="outline"
<<<<<<< HEAD
          size={isMobile ? "sm" : "default"}
          className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
=======
          className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 max-lg:text-xs max-lg:px-3 max-lg:py-1.5"
>>>>>>> 77aedeb ( segunda tentativa resposividade)
        >
          Try Again
        </Button>
      </div>
    </div>
  )

<<<<<<< HEAD
  const renderDesktopToolbar = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-[#333333]/20 border-b border-[#333333]">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <CheckCircle className="w-2.5 h-2.5 mr-1" />
          Generated
        </Badge>
        <span className="text-xs text-[#ADADAD]">
          {selectedTeam} • {playerName} #{playerNumber}
        </span>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetView}
                  className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset View</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-[#333333] mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className={cn(
                    "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50",
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
                      "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50",
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

            <div className="w-px h-4 bg-[#333333] mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )

  const renderMobileToolbar = () => (
    <div className="relative">
      {/* Mobile Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#333333]/20 border-b border-[#333333]">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
            <CheckCircle className="w-2 h-2 mr-1" />
            Done
          </Badge>
          <span className="text-xs text-[#ADADAD] truncate max-w-[120px]">
            {playerName} #{playerNumber}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#ADADAD]">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileControls(!showMobileControls)}
            className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-1 h-7"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
=======
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
>>>>>>> 77aedeb ( segunda tentativa resposividade)
        </div>
      </div>

      {/* Mobile Controls Overlay */}
      {showMobileControls && (
        <div className="absolute top-full right-0 z-20 bg-[#1a1a1a] border border-[#333333] rounded-lg p-2 shadow-lg">
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2 h-8"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2 h-8"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2 h-8"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2 h-8",
                showGrid && "bg-[#A20131]/20 text-[#A20131]"
              )}
            >
              <Grid3X3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2 h-8"
            >
              <Download className="h-3 w-3" />
            </Button>
            {isVisionMode && referenceImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReference(!showReference)}
                className={cn(
                  "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2 h-8",
                  showReference && "bg-[#A20131]/20 text-[#A20131]"
                )}
              >
                <Layers className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderImage = () => (
    <div className="flex-1 flex flex-col">
      {/* Canvas Toolbar */}
      {isMobile ? renderMobileToolbar() : renderDesktopToolbar()}

      {/* Canvas Container */}
      <div 
        ref={canvasRef}
<<<<<<< HEAD
        className="flex-1 relative overflow-hidden bg-[#14101e] cursor-move"
        onMouseDown={!isMobile ? (handleInteractionStart as any) : undefined}
        onTouchStart={isMobile ? handleTouchStart : undefined}
=======
        className="flex-1 overflow-hidden bg-[#14101e] relative cursor-move jersey-canvas"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
>>>>>>> 77aedeb ( segunda tentativa resposividade)
      >
        {/* Grid Background - Desktop only */}
        {showGrid && (
          <div 
<<<<<<< HEAD
            className="absolute inset-0 opacity-20 pointer-events-none"
=======
            className="absolute inset-0 opacity-20 responsive-hide-mobile"
>>>>>>> 77aedeb ( segunda tentativa resposividade)
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
<<<<<<< HEAD
          <div className="absolute top-4 right-4 w-24 h-24 md:w-32 md:h-32 border border-[#333333] rounded-lg overflow-hidden opacity-50">
            <Image
              src={referenceImage}
              alt="Reference"
              fill
              className="object-cover"
=======
          <div className="absolute inset-0 z-10 opacity-30 responsive-hide-mobile">
            <img
              src={referenceImage}
              alt="Reference"
              className="w-full h-full object-contain"
>>>>>>> 77aedeb ( segunda tentativa resposividade)
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
<<<<<<< HEAD
            src={generatedImage!}
            alt="Generated Jersey"
            width={512}
            height={512}
            className={cn(
              "max-w-full max-h-full object-contain rounded-lg shadow-2xl",
              isMobile ? "w-[280px] h-[280px]" : "w-[400px] h-[400px]"
            )}
=======
            src={generatedImage}
            alt="Generated Jersey"
            className="max-w-full max-h-full object-contain generated-image-preview"
>>>>>>> 77aedeb ( segunda tentativa resposividade)
            draggable={false}
          />
        </div>

<<<<<<< HEAD
        {/* Mobile Touch Instructions */}
        {isMobile && !isDragging && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/70 backdrop-blur-sm text-[#ADADAD] text-xs px-3 py-1 rounded-full border border-[#333333]/50">
              Drag to move • Pinch to zoom
            </div>
          </div>
        )}
=======
        {/* Mobile Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="bg-black/50 backdrop-blur-sm text-[#ADADAD] hover:text-[#FDFDFD] p-2 h-auto"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="bg-black/50 backdrop-blur-sm text-[#ADADAD] hover:text-[#FDFDFD] p-2 h-auto"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="bg-black/50 backdrop-blur-sm text-[#ADADAD] hover:text-[#FDFDFD] p-2 h-auto"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
>>>>>>> 77aedeb ( segunda tentativa resposividade)
      </div>
    </div>
  )

  if (isLoading) return renderLoading()
  if (error) return renderError()
  if (!generatedImage) return renderPlaceholder()
  return renderImage()
} 