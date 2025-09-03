// ================================================
// SportPicker Component
// Pure UI for sport selection
// ================================================

import React from 'react'
import { SPORTS_OPTIONS } from '../../constants'

export function SportPicker({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPORTS_OPTIONS.map(s => (
        <button 
          key={s.id} 
          onClick={() => onChange(s.id)} 
          className={`border rounded px-3 py-1 ${value === s.id ? 'ring-2 ring-black' : ''}`}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}
