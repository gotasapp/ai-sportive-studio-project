'use client'

import React from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { StadiumResponse } from '@/lib/services/stadium-service'

interface StadiumPreviewProps {
  generatedImage: string
  isGenerating: boolean
  error: string
  result: StadiumResponse | null
  selectedStadium: string
  generationStyle: string
}

const ChilizLogo = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-white/50">
    <title>Chiliz</title>
    <path fill="currentColor" d="M17.387 3.582H6.613L2.4 12l4.213 8.418h10.774L21.6 12zM6.918 19.543l-3.6-7.214 3.6-7.213h4.15v14.427zm10.164 0h-5.11V4.116h5.11l3.6 7.214z"/>
  </svg>
);

export default function StadiumPreview({
  generatedImage,
  isGenerating,
  error,
  selectedStadium,
  generationStyle,
}: StadiumPreviewProps) {

  const getStadiumName = () => {
    if (selectedStadium === 'custom_only') return 'Custom Stadium'
    return selectedStadium.replace(/_/g, ' ') || 'Stadium'
  }

  return (
    <div className="w-[92%] mx-auto aspect-[3/5] mt-[10px] bg-black/30 rounded-2xl flex items-center justify-center p-2 relative overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md"></div>
      
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-20">
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </div>
      )}

      {!generatedImage && !isGenerating && (
        <div className="z-10 flex flex-col items-center justify-center text-center">
          <ChilizLogo />
          <p className="mt-4 text-sm text-white/60">O estádio gerado aparecerá aqui</p>
        </div>
      )}
      
      {error && !isGenerating && (
        <div className="z-10 text-center p-4">
           <p className="font-semibold text-red-400">Generation Failed</p>
           <p className="text-xs text-red-400/70 mt-1">{error}</p>
        </div>
      )}

      {generatedImage && !isGenerating && (
        <>
          <Image 
            src={generatedImage} 
            alt="Generated Stadium" 
            layout="fill"
            className="object-cover z-0"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-white/70">Coleção: {generationStyle}</p>
                <p className="text-lg font-bold text-white">{getStadiumName()}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex-shrink-0">
                {/* Placeholder para o logo arredondado */}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 