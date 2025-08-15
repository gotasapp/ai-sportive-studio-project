import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { convertIpfsToHttp } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: 'square' | 'video' | 'auto';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  lazy = true,
  fallbackSrc = '/api/placeholder/400/400',
  onLoad,
  onError,
  aspectRatio = 'square',
  quality = 80,
  placeholder = 'empty',
  blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(convertIpfsToHttp(src));
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return '';
    }
  };

  const containerClasses = `
    relative overflow-hidden
    ${fill ? 'w-full h-full' : getAspectRatioClass()}
    ${className}
  `;

  return (
    <div ref={imgRef} className={containerClasses}>
      {/* Loading Skeleton */}
      {isLoading && (
        <Skeleton className="w-full h-full absolute inset-0 bg-[#FDFDFD]/10 animate-pulse" />
      )}

      {/* Error State */}
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FDFDFD]/5 border border-[#FDFDFD]/10">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#FDFDFD]/30" />
            <p className="text-xs text-[#FDFDFD]/50">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? blurDataURL : undefined}
          className={`
            transition-opacity duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
            ${fill ? 'object-cover' : ''}
          `}
          onLoad={handleLoad}
          onError={handleError}
          sizes={fill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined}
        />
      )}

      {/* Loading Indicator for lazy loaded images */}
      {!isInView && lazy && !priority && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FDFDFD]/5">
          <div className="w-8 h-8 border-2 border-[#FF0052] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

// Variantes específicas para diferentes usos
export function CardImage({ src, alt, className = '', ...props }: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      aspectRatio="square"
      lazy
      quality={75}
      placeholder="blur"
      className={`group-hover:scale-105 transition-transform duration-300 ${className}`}
      {...props}
    />
  );
}

export function CarouselImage({ src, alt, className = '', ...props }: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      aspectRatio="auto"
      priority
      quality={90}
      placeholder="blur"
      className={`transition-transform duration-300 ${className}`}
      {...props}
    />
  );
}

export function ThumbnailImage({ src, alt, size = 48, className = '', ...props }: OptimizedImageProps & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      lazy
      quality={60}
      className={`rounded-lg object-cover ${className}`}
      {...props}
    />
  );
} 