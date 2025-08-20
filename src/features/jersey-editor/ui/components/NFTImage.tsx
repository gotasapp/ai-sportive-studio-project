// ================================================
// NFTImage Component
// Image with automatic fallback for IPFS gateways
// ================================================

import React, { useEffect, useState } from 'react'

export function NFTImage({ 
  src, 
  fallbacks, 
  alt 
}: { 
  src?: string
  fallbacks?: string[]
  alt?: string 
}) {
  const [current, setCurrent] = useState<string | undefined>(src)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setCurrent(src)
    setIdx(0)
  }, [src])

  if (!current) {
    return (
      <div className="aspect-square w-full rounded border flex items-center justify-center text-xs text-neutral-500">
        Sem imagem
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? 'nft'}
      src={current}
      className="w-full h-auto rounded border"
      onError={() => {
        const next = fallbacks?.[idx]
        if (next && next !== current) {
          setCurrent(next)
          setIdx(idx + 1)
        }
      }}
    />
  )
}
