'use client';
import { useEffect, useState } from 'react';

export default function SafeImage({
  src,
  alt,
  fallbackSrc = '/placeholder.png',
  className = '',
  width,
  height,
}: {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !src) return <div className={`bg-gray-800 animate-pulse ${className}`} />;

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
      className={className}
      width={width}
      height={height}
      loading="lazy"
    />
  );
} 