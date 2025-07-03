'use client'

import React from 'react'
import Image from 'next/image'
import { Download, Building, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StadiumResponse } from '@/lib/services/stadium-service'

interface StadiumPreviewProps {
  generatedImage: string
  isGenerating: boolean
  error: string
  result: StadiumResponse | null
  selectedStadium: string
  generationStyle: string
  perspective: string
  atmosphere: string
  timeOfDay: string
  weather: string
  quality: string
}

export default function StadiumPreview({
  generatedImage,
  isGenerating,
  error,
  result,
  selectedStadium,
  generationStyle,
  perspective,
  atmosphere,
  timeOfDay,
  weather,
  quality
}: StadiumPreviewProps) {
  const handleDownload = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `stadium_${selectedStadium}_${generationStyle}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStadiumName = () => {
    if (selectedStadium === 'custom_only') return 'Custom Stadium'
    return result?.stadium_name || selectedStadium
  }

  return (
    <>
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 border-4 border-white border-t-transparent rounded-full animate-spin mb-8"></div>
          <p className="text-white text-2xl font-semibold">Generating stadium...</p>
          <div className="mt-6 w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8">
              <span className="text-red-400 text-4xl">⚠</span>
            </div>
            <p className="text-red-400 mb-8 text-center text-xl">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-lg"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      
      {generatedImage && !isGenerating && !error && (
        <div className="absolute inset-0 p-6 lg:p-3">
          <Image 
            src={generatedImage} 
            alt="Generated Stadium" 
            width={1024} 
            height={1024} 
            className="w-full h-full object-contain rounded-lg" 
          />
          <div className="absolute inset-0 lg:inset-3 rounded-lg border-2 border-white/50 pointer-events-none"></div>
          <div className="absolute -top-3 lg:top-1 -right-3 lg:right-1 w-8 lg:w-6 h-8 lg:h-6 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
          
          <div className="absolute bottom-0 lg:bottom-3 left-0 lg:left-3 right-0 lg:right-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 lg:p-3 rounded-b-lg">
            <div className="text-white">
              <p className="font-bold text-2xl lg:text-lg">{getStadiumName()}</p>
              <p className="text-white text-lg lg:text-sm">{generationStyle} · {perspective} · {atmosphere}</p>
              <div className="flex items-center mt-2 lg:mt-1 space-x-4 lg:space-x-3">
                <span className="text-sm lg:text-xs text-gray-300">{timeOfDay} · {weather}</span>
                <span className="text-sm lg:text-xs text-gray-300">Quality: {quality}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!generatedImage && !isGenerating && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-4">
          <div className="text-center">
            <div className="w-40 lg:w-32 h-48 lg:h-40 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center mb-6 lg:mb-4 mx-auto">
              <div className="text-center">
                <Building className="w-12 lg:w-8 h-12 lg:h-8 text-white/50 mx-auto mb-3 lg:mb-2" />
                <p className="text-sm lg:text-xs text-gray-400">Stadium</p>
              </div>
            </div>
            <p className="text-gray-400 text-lg lg:text-sm">Your generated stadium will appear here</p>
            <p className="text-white/70 text-sm lg:text-xs mt-3 lg:mt-2">Perfect NFT proportions (1:1 ratio)</p>
          </div>
        </div>
      )}
    </>
  )
} 