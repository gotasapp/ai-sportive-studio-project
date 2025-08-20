// ================================================
// ReferenceUploader Component
// Pure UI for reference image upload
// ================================================

import React, { useRef } from 'react'

type Props = {
  onSelect: (file: File) => void
  disabled?: boolean
}

export function ReferenceUploader({ onSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    <div className="border rounded p-3 flex items-center gap-3">
      <button 
        type="button" 
        className="px-3 py-1 border rounded" 
        disabled={disabled} 
        onClick={() => inputRef.current?.click()}
      >
        Selecionar imagem de referência
      </button>
      <input 
        ref={inputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onSelect(f)
        }} 
      />
      <span className="text-xs text-neutral-500">PNG/JPG</span>
    </div>
  )
}
