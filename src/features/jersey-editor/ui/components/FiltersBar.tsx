// ================================================
// FiltersBar Component
// Pure UI for search filters
// ================================================

import React from 'react'

export type FiltersBarProps = {
  search: string
  onSearch: (v: string) => void
  style?: string
  onStyle: (v?: string) => void
  sport?: string
  onSport: (v?: string) => void
}

export function FiltersBar({ search, onSearch, style, onStyle, sport, onSport }: FiltersBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input 
        className="border rounded px-3 py-2" 
        placeholder="Buscar…" 
        value={search} 
        onChange={(e) => onSearch(e.target.value)} 
      />
      <select 
        className="border rounded px-3 py-2" 
        value={style ?? ''} 
        onChange={(e) => onStyle(e.target.value || undefined)}
      >
        <option value="">Todos os estilos</option>
        <option value="modern">Modern</option>
        <option value="retro">Retro</option>
        <option value="urban">Urban</option>
        <option value="classic">Classic</option>
        <option value="national">National</option>
      </select>
      <select 
        className="border rounded px-3 py-2" 
        value={sport ?? ''} 
        onChange={(e) => onSport((e.target.value as any) || undefined)}
      >
        <option value="">Todos os esportes</option>
        <option value="soccer">Soccer</option>
        <option value="basketball">Basketball</option>
        <option value="nfl">NFL</option>
      </select>
      <button 
        type="button" 
        className="border rounded px-3 py-2" 
        onClick={() => { onSearch(''); onStyle(undefined); onSport(undefined) }}
      >
        Limpar filtros
      </button>
    </div>
  )
}
