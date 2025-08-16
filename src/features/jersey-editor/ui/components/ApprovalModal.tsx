// ================================================
// ApprovalModal Component
// Modal para aprovação de coleções no Launchpad
// ================================================

import React from 'react'
import type { ClaimPhase } from '../../services/launchpadService'

type Props = {
  isOpen: boolean
  onClose: () => void
  contractAddress: string
  onAddress: (v: string) => void
  phases: ClaimPhase[]
  onPhases: (v: ClaimPhase[]) => void
  isSaving: boolean
  error?: string
  onSave: () => void
}

export function ApprovalModal({ 
  isOpen, 
  onClose, 
  contractAddress, 
  onAddress, 
  phases, 
  onPhases, 
  isSaving, 
  error, 
  onSave 
}: Props) {
  if (!isOpen) return null
  
  const updatePhase = (idx: number, patch: Partial<ClaimPhase>) => {
    const copy = [...phases]
    copy[idx] = { ...copy[idx], ...patch }
    onPhases(copy)
  }
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-xl space-y-3">
        <h3 className="text-lg font-semibold">Aprovar coleção no Launchpad</h3>
        {error && <div className="text-xs text-amber-700">{error}</div>}
        
        <label className="block text-sm">Endereço do contrato</label>
        <input 
          className="w-full border rounded px-3 py-2" 
          placeholder="0x…" 
          value={contractAddress} 
          onChange={(e) => onAddress(e.target.value)} 
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Fases</span>
            <button 
              type="button" 
              className="text-sm underline" 
              onClick={() => onPhases([...(phases ?? []), { name: `Phase ${phases.length + 1}` }])}
            >
              Adicionar fase
            </button>
          </div>
          {(phases ?? []).map((ph, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded p-2">
              <input 
                className="border rounded px-2 py-1" 
                placeholder="Nome" 
                value={ph.name ?? ''} 
                onChange={(e) => updatePhase(i, { name: e.target.value })} 
              />
              <input 
                className="border rounded px-2 py-1" 
                placeholder="Preço" 
                value={ph.price ?? ''} 
                onChange={(e) => updatePhase(i, { price: e.target.value })} 
              />
              <input 
                className="border rounded px-2 py-1" 
                placeholder="Moeda" 
                value={ph.currency ?? ''} 
                onChange={(e) => updatePhase(i, { currency: e.target.value })} 
              />
              <input 
                className="border rounded px-2 py-1" 
                placeholder="Início (ISO)" 
                value={ph.start ?? ''} 
                onChange={(e) => updatePhase(i, { start: e.target.value })} 
              />
              <input 
                className="border rounded px-2 py-1" 
                type="number" 
                placeholder="Max por carteira" 
                value={ph.maxPerWallet ?? 0} 
                onChange={(e) => updatePhase(i, { maxPerWallet: Number(e.target.value) })} 
              />
              <textarea 
                className="border rounded px-2 py-1 md:col-span-3" 
                placeholder="Allowlist (wallets, separadas por quebra de linha)" 
                value={(ph.allowlist ?? []).join('\n')} 
                onChange={(e) => updatePhase(i, { allowlist: e.target.value.split(/\n+/).filter(Boolean) })} 
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button 
            type="button" 
            className="px-3 py-1 border rounded" 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="px-3 py-1 border rounded" 
            disabled={isSaving || !contractAddress} 
            onClick={onSave}
          >
            {isSaving ? 'Salvando…' : 'Salvar aprovação'}
          </button>
        </div>
      </div>
    </div>
  )
}
