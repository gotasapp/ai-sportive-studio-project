// ================================================
// PreviewPane Component
// Pure UI for image preview
// ================================================

import React from 'react'

export function PreviewPane({ url }: { url?: string }) {
  return (
    <div className="aspect-square w-full rounded border flex items-center justify-center overflow-hidden">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="preview" src={url} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm text-neutral-500">Preview appears here</span>
      )}
    </div>
  )
}
