'use client'

import React from 'react'
import Image from 'next/image'
import { Download, Eye, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JerseyPreviewProps {
  generatedImage: string | null
  isLoading: boolean
  selectedTeam: string
  playerName: string
  playerNumber: string
  selectedStyle: string
  quality: 'standard' | 'hd'
}

export default function JerseyPreview({
  generatedImage,
  isLoading,
  selectedTeam,
  playerName,
  playerNumber,
  selectedStyle,
  quality
}: JerseyPreviewProps) {
  const handleDownload = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `${selectedTeam}_${playerName}_${playerNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-8"></div>
          <p className="text-cyan-400 text-2xl font-semibold">Generating your jersey...</p>
          <div className="mt-6 w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      {generatedImage && !isLoading && (
        <div className="absolute inset-0 p-6 lg:p-3">
          <Image 
            src={generatedImage} 
            alt="Generated Jersey" 
            width={384} 
            height={576} 
            className="w-full h-full object-contain rounded-lg" 
          />
          <div className="absolute inset-0 lg:inset-3 rounded-lg border-2 border-cyan-400/50 pointer-events-none"></div>
          <div className="absolute -top-3 lg:top-1 -right-3 lg:right-1 w-8 lg:w-6 h-8 lg:h-6 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
          
          <div className="absolute bottom-0 lg:bottom-3 left-0 lg:left-3 right-0 lg:right-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 lg:p-3 rounded-b-lg">
            <div className="text-white">
              <p className="font-bold text-2xl lg:text-lg">{playerName} #{playerNumber}</p>
              <p className="text-cyan-400 text-lg lg:text-sm">{selectedTeam}</p>
              <div className="flex items-center mt-2 lg:mt-1 space-x-4 lg:space-x-3">
                <span className="text-sm lg:text-xs text-gray-300">Style: {selectedStyle}</span>
                <span className="text-sm lg:text-xs text-gray-300">Quality: {quality}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!generatedImage && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-4">
          <div className="text-center">
            <div className="w-40 lg:w-32 h-48 lg:h-40 border-2 border-dashed border-cyan-400/30 rounded-lg flex items-center justify-center mb-6 lg:mb-4 mx-auto">
              <div className="text-center">
                <Upload className="w-12 lg:w-8 h-12 lg:h-8 text-cyan-400/50 mx-auto mb-3 lg:mb-2" />
                <p className="text-sm lg:text-xs text-gray-400">Jersey</p>
              </div>
            </div>
            <p className="text-gray-400 text-lg lg:text-sm">Your generated jersey will appear here</p>
            <p className="text-cyan-400/70 text-sm lg:text-xs mt-3 lg:mt-2">Perfect NFT proportions (4:5 ratio)</p>
          </div>
        </div>
      )}
    </>
  )
} 