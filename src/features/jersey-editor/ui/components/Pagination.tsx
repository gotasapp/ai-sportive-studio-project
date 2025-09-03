// ================================================
// Pagination Component
// Pure UI for page control
// ================================================

import React from 'react'

export type PaginationProps = {
  page: number
  pageSize: number
  total?: number
  onPage: (p: number) => void
}

export function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const hasPrev = page > 1
  const hasNext = total ? page * pageSize < total : true
  return (
    <div className="flex items-center justify-between mt-2">
      <button 
        type="button" 
        className="px-3 py-1 border rounded" 
        disabled={!hasPrev} 
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </button>
      <span className="text-xs text-neutral-600">
        Página {page}{typeof total === 'number' ? ` de ${Math.max(1, Math.ceil(total / pageSize))}` : ''}
      </span>
      <button 
        type="button" 
        className="px-3 py-1 border rounded" 
        disabled={!hasNext} 
        onClick={() => onPage(page + 1)}
      >
        Próxima
      </button>
    </div>
  )
}
