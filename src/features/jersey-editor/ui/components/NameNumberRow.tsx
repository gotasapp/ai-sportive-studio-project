// ================================================
// NameNumberRow Component
// Pure UI - receives data via props, no hooks
// ================================================

import React from 'react'

type Props = {
  name: string
  number: string
  onChangeName: (v: string) => void
  onChangeNumber: (v: string) => void
}

export function NameNumberRow({ name, number, onChangeName, onChangeNumber }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input 
        className="border rounded px-3 py-2" 
        placeholder="Player name" 
        value={name} 
        onChange={e => onChangeName(e.target.value)} 
      />
      <input 
        className="border rounded px-3 py-2" 
        placeholder="Number" 
        value={number} 
        onChange={e => onChangeNumber(e.target.value)} 
      />
    </div>
  )
}
