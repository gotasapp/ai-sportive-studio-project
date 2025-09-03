// ================================================
// TeamPicker Component
// Pure UI for team selection
// ================================================

import React from 'react'

type Props = {
  teams: string[]
  value: string
  onChange: (team: string) => void
  isLoading?: boolean
  error?: string | null
}

export function TeamPicker({ teams, value, onChange, isLoading, error }: Props) {
  if (isLoading) return <div className="text-sm text-neutral-500">Carregando times…</div>
  return (
    <div className="space-y-2">
      {error && <div className="text-xs text-amber-600">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {teams.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`px-3 py-1 rounded border ${value === t ? 'ring-2 ring-black' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
