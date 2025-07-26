'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, 
  Loader2, AlertCircle, CheckCircle, Eye, Move,
  Grid3X3, Layers, Image as ImageIcon, Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { isAdmin } from '@/lib/admin-config'
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
      link.download = `jersey-${selectedTeam || 'custom'}-${playerName || 'player'}-${playerNumber || '00'}.png`
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

  // Suporte a touch para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (generatedImage) {
      setIsDragging(true);
      const touch = e.touches[0];
      const startX = touch.clientX - pan.x;
      const startY = touch.clientY - pan.y;

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        setPan({
          x: touch.clientX - startX,
          y: touch.clientY - startY
        });
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  const renderPlaceholder = () => (
    <div className="flex-1 flex items-center justify-center bg-[#14101e]">
      <div className="placeholder-content text-center text-[#444444]">
        <ImageIcon className="w-24 h-24 mx-auto" />
        <h3 className="mt-4 text-lg font-semibold text-[#FDFDFD]">Jersey Preview</h3>
        <p className="mt-1 text-sm text-[#ADADAD]">
          Your generated jersey will appear here once created.
        </p>
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="loading-content text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <Loader2 className="w-16 h-16 text-[#A20131] animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-[#A20131]/20 rounded-full"></div>
        </div>
        <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">
          Generating Jersey...
        </h3>
        <p className="text-sm text-[#ADADAD] mb-4">
          {isVisionMode ? 'Analyzing reference image and generating design...' : 'Creating your custom jersey design...'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#A20131] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[#A20131] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#A20131] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )

  const renderError = () => {
    // Detectar se é erro de rate limit
    const isRateLimit = error?.toLowerCase().includes('rate limit') || 
                       error?.toLowerCase().includes('too many requests') ||
                       error?.includes('429');
    
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="error-content text-center max-w-md">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isRateLimit ? 'bg-yellow-500/10' : 'bg-red-500/10'
          }`}>
            <AlertCircle className={`w-8 h-8 ${isRateLimit ? 'text-yellow-400' : 'text-red-400'}`} />
          </div>
          <h3 className="text-lg font-semibold text-[#FDFDFD] mb-2">
            {isRateLimit ? 'Rate Limit Reached' : 'Generation Failed'}
          </h3>
          <p className={`text-sm mb-4 ${isRateLimit ? 'text-yellow-400' : 'text-red-400'}`}>
            {isRateLimit ? (
              <>
                OpenAI API rate limit exceeded. This usually happens when you generate too many images in a short time.
                <br /><br />
                💡 <strong>Solutions:</strong>
                <br />• Wait 1-2 minutes and try again
                <br />• Check your OpenAI API usage at platform.openai.com
                <br />• The system will automatically retry with delays
              </>
            ) : (
              error
            )}
          </p>
          <Button
            onClick={onResetError}
            variant="outline"
            className={`${
              isRateLimit 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
            }`}
          >
            {isRateLimit ? 'Try Again (Auto-retry enabled)' : 'Try Again'}
          </Button>
        </div>
      </div>
    )
  }

  const renderImage = () => (
    <div className="flex-1 flex flex-col">
      {/* Canvas Toolbar */}
                  <div className="canvas-toolbar flex items-center justify-between px-4 py-2 bg-[#333333]/10 border-b border-[#333333]">
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
            <div className="zoom-controls flex items-center gap-1">
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

              <span className="zoom-percentage text-xs text-[#ADADAD] min-w-[3rem] text-center">
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
        className="canvas-area flex-1 relative overflow-hidden bg-[#14101e] cursor-move"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
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
            <img
              src={referenceImage}
              alt="Reference"
              className="max-w-full max-h-full object-contain opacity-30 border-2 border-[#A20131]/50 rounded-lg"
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
          <img
            ref={imageRef}
            src={generatedImage || ''}
            alt="Generated Jersey"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-[#333333]"
            draggable={false}
          />
        </div>

        {/* Pan/Zoom Instructions */}
                    <div className="pan-zoom-instructions absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center gap-2 text-xs text-[#ADADAD]">
            <Move className="w-3 h-3" />
            <span>Drag to pan • Scroll to zoom</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
            <Card className="ProfessionalCanvas h-full mt-[10px] m-[10px] mb-0 bg-[#111011]/40 border-[#333333] shadow-xl max-w-4xl mx-auto">
      <CardContent className="p-[1px] pb-0 h-full flex flex-col">
        {error ? renderError() : isLoading ? renderLoading() : generatedImage ? renderImage() : renderPlaceholder()}
      </CardContent>
    </Card>
  )
} 