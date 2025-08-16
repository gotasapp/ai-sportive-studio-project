// ================================================
// GenerationPanel Component
// UI Pura para controle de geração
// ================================================

import React from 'react'

export type GenerationPanelProps = {
  status: 'idle' | 'uploading' | 'analyzing' | 'ready_to_generate' | 'generating' | 'ready' | 'error'
  analysisText?: string
  error?: string
  previewUrl?: string
  canGenerate: boolean
  onGenerate: () => void
}

export function GenerationPanel({ status, analysisText, error, previewUrl, canGenerate, onGenerate }: GenerationPanelProps) {
  return (
    <div className="space-y-3">
      {analysisText && (
        <div className="text-xs text-neutral-600">
          <strong>Vision:</strong> {analysisText}
        </div>
      )}
      {error && <div className="text-xs text-amber-700">{error}</div>}
      <div className="flex items-center gap-2">
        <button 
          type="button" 
          className="px-3 py-1 rounded border" 
          disabled={!canGenerate || status === 'generating'} 
          onClick={onGenerate}
        >
          {status === 'generating' ? 'Gerando…' : 'Gerar imagem'}
        </button>
        <span className="text-xs text-neutral-500">Status: {status}</span>
      </div>
      {previewUrl && (
        <div className="rounded border overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="preview" src={previewUrl} className="w-full h-auto" />
        </div>
      )}
    </div>
  )
}
