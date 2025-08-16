// ================================================
// MintPanel Component
// UI Pura para controles de minting
// ================================================

import React from 'react'

export type MintPanelProps = {
  isLoading: boolean
  isClaiming: boolean
  error?: string
  price?: string
  currency?: string
  connected?: boolean
  onConnect?: () => void
  onMint?: () => void
}

export function MintPanel({ 
  isLoading, 
  isClaiming, 
  error, 
  price, 
  currency, 
  connected, 
  onConnect, 
  onMint 
}: MintPanelProps) {
  return (
    <div className="space-y-2">
      {error && <div className="text-xs text-amber-700">{error}</div>}
      <div className="text-sm">
        {price ? (
          <span>Preço: {price} {currency ?? ''}</span>
        ) : (
          <span>Claim disponível</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!connected ? (
          <button 
            type="button" 
            className="px-3 py-1 rounded border" 
            disabled={isLoading} 
            onClick={onConnect}
          >
            Conectar carteira
          </button>
        ) : (
          <button 
            type="button" 
            className="px-3 py-1 rounded border" 
            disabled={isLoading || isClaiming} 
            onClick={onMint}
          >
            {isClaiming ? 'A mintar…' : 'Mint/Claim'}
          </button>
        )}
      </div>
    </div>
  )
}
