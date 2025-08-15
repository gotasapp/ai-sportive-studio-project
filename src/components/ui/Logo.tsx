'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function Logo({ width = 180, height = 48, className, priority = true }: LogoProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [allFailed, setAllFailed] = useState(false)

  // URLs do logo (ordem de prioridade)
  const logoUrls = [
    'https://res.cloudinary.com/dpilz4p6g/image/upload/v1751896717/Chiliz_Logo_p07cwf.png',
    'https://cryptologos.cc/logos/chiliz-chz-logo.png', // Fallback oficial
    '/chiliz-logo-fallback.svg' // Fallback local
  ]

  const handleImageError = () => {
    console.warn(`❌ Logo URL ${currentUrlIndex + 1} failed to load`)
    
    if (currentUrlIndex < logoUrls.length - 1) {
      // Tenta próxima URL
      setCurrentUrlIndex(prev => prev + 1)
      setIsLoading(true)
    } else {
      // Todas as URLs falharam
      console.error('❌ All logo URLs failed, showing text fallback')
      setAllFailed(true)
      setIsLoading(false)
    }
  }

  const handleImageLoad = () => {
    console.log(`✅ Logo loaded successfully from URL ${currentUrlIndex + 1}`)
    setIsLoading(false)
  }

  // Se todas as imagens falharem, mostra logo de texto
  if (allFailed) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gradient-to-r from-[#FF0052] to-[#D32F2F] text-white font-bold rounded-lg px-4 py-2 shadow-lg",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-lg tracking-wider">CHZ</span>
        <span className="ml-2 text-xs opacity-75">SPORTS</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-700/20 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      {/* Main logo */}
      <Image
        src={logoUrls[currentUrlIndex]}
        alt="Chiliz Sports NFT"
        width={width}
        height={height}
        className={cn(
          "object-contain transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        priority={priority}
        onError={handleImageError}
        onLoad={handleImageLoad}
        unoptimized // Para evitar problemas com URLs externas
        key={currentUrlIndex} // Force re-render when URL changes
      />
    </div>
  )
}

// Componente específico para o Header com tamanhos responsivos
export function HeaderLogo() {
  const isMobile = useIsMobile()
  
  return (
    <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
      <Logo 
        width={isMobile ? 120 : 180}
        height={isMobile ? 32 : 48}
        className={isMobile ? "w-auto h-8 ml-2" : "w-auto h-12 ml-6"}
        priority
      />
    </Link>
  )
} 