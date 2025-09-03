'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface Props extends ImageProps {
  fallbackSrc?: string;
}

export default function ImageWithFallback({ src, fallbackSrc = '/placeholder.png', ...rest }: Props) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc || fallbackSrc}
      onError={() => setImgSrc(fallbackSrc)}
      unoptimized
    />
  );
} 