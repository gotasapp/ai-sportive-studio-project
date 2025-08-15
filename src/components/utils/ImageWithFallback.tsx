'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AlertCircle, Loader2 } from 'lucide-react';

// Lista de gateways IPFS com prioridade
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
  'https://gateway.ipfs.io/ipfs',
  'https://nftstorage.link/ipfs'
];

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showLoadingState?: boolean;
  retryAttempts?: number;
}

export function normalizeImageUrl(url: string): string {
  if (!url) return '/api/placeholder/400/400';
  
  // Se já é Cloudinary, retornar direto
  if (url.includes('cloudinary.com')) {
    return url;
  }
  
  // Se já é HTTP/HTTPS válido (não IPFS gateway), retornar
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Verificar se não é um gateway IPFS conhecido
    const isIPFSGateway = IPFS_GATEWAYS.some(gateway => 
      url.includes(gateway.replace('https://', '').replace('/ipfs', ''))
    );
    if (!isIPFSGateway) {
      return url;
    }
  }
  
  // Extrair hash IPFS de várias formas
  let ipfsHash = '';
  
  if (url.startsWith('ipfs://')) {
    ipfsHash = url.replace('ipfs://', '');
  } else if (url.includes('/ipfs/')) {
    ipfsHash = url.split('/ipfs/')[1];
  } else if (url.match(/^Qm[a-zA-Z0-9]{44}$/)) {
    ipfsHash = url;
  }
  
  // Se conseguimos extrair um hash IPFS, usar o primeiro gateway
  if (ipfsHash) {
    return `${IPFS_GATEWAYS[0]}/${ipfsHash}`;
  }
  
  // Fallback para URL original ou placeholder
  return url || '/api/placeholder/400/400';
}

export default function ImageWithFallback({
  src,
  alt,
  width = 400,
  height = 400,
  className = '',
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/api/placeholder/400/400',
  showLoadingState = true,
  retryAttempts = 3
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(() => normalizeImageUrl(src));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const mountedRef = useRef(true);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Resetar quando src mudar
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(normalizeImageUrl(src));
      setIsLoading(true);
      setHasError(false);
      setAttemptCount(0);
      setGatewayIndex(0);
    }
  }, [src]);

  const tryNextGateway = () => {
    if (!mountedRef.current) return;
    
    const ipfsHash = extractIPFSHash(src);
    if (!ipfsHash) {
      // Não é IPFS, usar fallback
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      return;
    }

    const nextIndex = gatewayIndex + 1;
    if (nextIndex < IPFS_GATEWAYS.length) {
      console.log(`🔄 Tentando próximo gateway IPFS: ${IPFS_GATEWAYS[nextIndex]}`);
      setGatewayIndex(nextIndex);
      setCurrentSrc(`${IPFS_GATEWAYS[nextIndex]}/${ipfsHash}`);
      setAttemptCount(prev => prev + 1);
    } else {
      // Todos os gateways falharam, usar fallback
      console.error(`❌ Todos os gateways IPFS falharam para: ${src}`);
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const extractIPFSHash = (url: string): string | null => {
    if (!url) return null;
    
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', '');
    } else if (url.includes('/ipfs/')) {
      return url.split('/ipfs/')[1];
    } else if (url.match(/^Qm[a-zA-Z0-9]{44}$/)) {
      return url;
    }
    
    return null;
  };

  const handleLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    if (mountedRef.current) {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    }
  };

  const handleError = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    if (!mountedRef.current) return;
    
    console.warn(`⚠️ Falha ao carregar imagem: ${currentSrc}`);
    
    // Se ainda temos tentativas e é IPFS, tentar próximo gateway
    if (attemptCount < retryAttempts && extractIPFSHash(src)) {
      tryNextGateway();
    } else {
      setIsLoading(false);
      setHasError(true);
      onError?.();
      
      // Última tentativa com fallback
      if (currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
        setAttemptCount(0);
      }
    }
  };

  // Timeout para imagens que demoram muito
  useEffect(() => {
    if (isLoading && !hasError) {
      loadTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && isLoading) {
          console.warn(`⏱️ Timeout ao carregar imagem: ${currentSrc}`);
          handleError();
        }
      }, 10000); // 10 segundos timeout
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [currentSrc, isLoading]);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Loading State */}
      {showLoadingState && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#14101e] rounded-lg">
          <Loader2 className="w-8 h-8 text-[#FF0052] animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hasError && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#14101e] border border-[#FDFDFD]/10 rounded-lg">
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#FDFDFD]/30" />
            <p className="text-xs text-[#FDFDFD]/50">Imagem indisponível</p>
          </div>
        </div>
      )}

      {/* Imagem */}
      {!hasError && (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={`
            transition-opacity duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
            ${className}
          `}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized // Importante para evitar problemas com gateways IPFS
        />
      )}
    </div>
  );
}

// Componente específico para grid de NFTs
export function NFTGridImage({ src, alt, className = '', ...props }: Omit<ImageWithFallbackProps, 'width' | 'height'>) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      width={300}
      height={300}
      className={`w-full h-full object-cover rounded-lg ${className}`}
      showLoadingState={true}
      retryAttempts={3}
      {...props}
    />
  );
}

// Componente específico para thumbnails
export function NFTThumbnail({ src, alt, size = 48, className = '', ...props }: Omit<ImageWithFallbackProps, 'width' | 'height'> & { size?: number }) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover rounded ${className}`}
      showLoadingState={false}
      retryAttempts={2}
      {...props}
    />
  );
}
