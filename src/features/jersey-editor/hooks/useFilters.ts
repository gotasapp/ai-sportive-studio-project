// ================================================
// useFilters Hook
// Estado de filtros e paginação
// ================================================

import { useMemo, useReducer } from 'react'

type FiltersState = {
  search: string
  style?: string
  sport?: 'soccer' | 'basketball' | 'nfl'
  page: number
  pageSize: number
}

type Action =
  | { type: 'SET_SEARCH'; v: string }
  | { type: 'SET_STYLE'; v?: string }
  | { type: 'SET_SPORT'; v?: 'soccer' | 'basketball' | 'nfl' }
  | { type: 'SET_PAGE'; v: number }
  | { type: 'SET_PAGE_SIZE'; v: number }
  | { type: 'RESET' }

const initial: FiltersState = { search: '', page: 1, pageSize: 12 }

function reducer(s: FiltersState, a: Action): FiltersState {
  switch (a.type) {
    case 'SET_SEARCH':
      return { ...s, search: a.v, page: 1 }
    case 'SET_STYLE':
      return { ...s, style: a.v, page: 1 }
    case 'SET_SPORT':
      return { ...s, sport: a.v, page: 1 }
    case 'SET_PAGE':
      return { ...s, page: Math.max(1, a.v) }
    case 'SET_PAGE_SIZE':
      return { ...s, pageSize: Math.max(1, a.v), page: 1 }
    case 'RESET':
      return initial
    default:
      return s
  }
}

export function useFilters(init?: Partial<FiltersState>) {
  const [state, dispatch] = useReducer(reducer, { ...initial, ...init })
  const skip = useMemo(() => (state.page - 1) * state.pageSize, [state.page, state.pageSize])
  return {
    state,
    skip,
    setSearch: (v: string) => dispatch({ type: 'SET_SEARCH', v }),
    setStyle: (v?: string) => dispatch({ type: 'SET_STYLE', v }),
    setSport: (v?: 'soccer' | 'basketball' | 'nfl') => dispatch({ type: 'SET_SPORT', v }),
    setPage: (v: number) => dispatch({ type: 'SET_PAGE', v }),
    setPageSize: (v: number) => dispatch({ type: 'SET_PAGE_SIZE', v }),
    reset: () => dispatch({ type: 'RESET' }),
  }
}
