// ================================================
// StylePicker Component
// UI Pura para seleção de estilos
// ================================================

import React from 'react'
import { STYLE_FILTERS } from '../../constants'

export function StylePicker({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_FILTERS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`border rounded px-3 py-1 ${value === s.id ? 'ring-2 ring-black' : ''}`}
        >
          <span className="inline-flex items-center gap-2">
            <s.icon size={16} /> {s.label}
          </span>
        </button>
      ))}
    </div>
  )
}
