import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { getIpfsGatewayUrls } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface IpfsImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  onError?: () => void
  onLoad?: () => void
  fallback?: React.ReactNode
}

export function IpfsImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  onError,
  onLoad,
  fallback
}: IpfsImageProps) {
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Get all possible gateway URLs for this image
  const gatewayUrls = getIpfsGatewayUrls(src)
  const currentUrl = gatewayUrls[currentGatewayIndex] || src

  const handleError = useCallback(() => {
    console.warn(`❌ Image failed to load from gateway ${currentGatewayIndex + 1}/${gatewayUrls.length}:`, currentUrl)
    
    // Try next gateway
    if (currentGatewayIndex < gatewayUrls.length - 1) {
      console.log(`🔄 Trying next gateway (${currentGatewayIndex + 2}/${gatewayUrls.length})...`)
      setCurrentGatewayIndex(prev => prev + 1)
      setIsLoading(true)
    } else {
      console.error(`❌ All gateways failed for image: ${src}`)
      setHasError(true)
      setIsLoading(false)
      onError?.()
    }
  }, [currentGatewayIndex, gatewayUrls.length, currentUrl, src, onError])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    if (currentGatewayIndex > 0) {
      console.log(`✅ Image loaded successfully from gateway ${currentGatewayIndex + 1}/${gatewayUrls.length}`)
    }
    onLoad?.()
  }, [currentGatewayIndex, gatewayUrls.length, onLoad])

  // If all gateways failed, show fallback
  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-800/50 text-gray-400 text-sm",
        fill ? "absolute inset-0" : "",
        className
      )}>
        {fallback || (
          <div className="text-center p-4">
            <div className="text-xs opacity-60">Image unavailable</div>
          </div>
        )}
      </div>
    )
  }

  // Show loading state
  if (isLoading && currentGatewayIndex === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-800/30 animate-pulse",
        fill ? "absolute inset-0" : "",
        className
      )}>
        <div className="text-gray-400 text-xs">Loading...</div>
      </div>
    )
  }

  return (
    <Image
      src={currentUrl}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      unoptimized={currentUrl.includes('ipfs')} // Disable optimization for IPFS URLs
    />
  )
}

// Hook for preloading IPFS images
export function useIpfsImagePreload(src: string) {
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  const preloadImage = useCallback(async () => {
    if (!src || preloadStatus !== 'idle') return

    setPreloadStatus('loading')
    
    const gatewayUrls = getIpfsGatewayUrls(src)
    
    for (let i = 0; i < gatewayUrls.length; i++) {
      try {
        const img = new window.Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = gatewayUrls[i]
        })
        
        console.log(`✅ Preloaded image from gateway ${i + 1}/${gatewayUrls.length}`)
        setPreloadStatus('loaded')
        return
      } catch (error) {
        console.warn(`❌ Preload failed for gateway ${i + 1}/${gatewayUrls.length}`)
        continue
      }
    }
    
    console.error('❌ All gateways failed during preload')
    setPreloadStatus('error')
  }, [src, preloadStatus])

  return { preloadStatus, preloadImage }
} 