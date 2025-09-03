// ================================================
// useLaunchpadApproval Hook
// Estado e ações para modal de aprovação
// ================================================

import { useReducer, useCallback } from 'react'
import type { ClaimPhase } from '../services/launchpadService'
import { approveCollection } from '../services/launchpadService'

type State = {
  isOpen: boolean
  isSaving: boolean
  error?: string
  contractAddress: string
  phases: ClaimPhase[]
}

const initialApproval: State = { 
  isOpen: false, 
  isSaving: false, 
  contractAddress: '', 
  phases: [] 
}

type Action =
  | { type: 'OPEN'; open: boolean }
  | { type: 'SET_ADDR'; v: string }
  | { type: 'SET_PHASES'; v: ClaimPhase[] }
  | { type: 'SET_SAVING'; v: boolean }
  | { type: 'SET_ERROR'; v?: string }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'OPEN': 
      return { ...s, isOpen: a.open }
    case 'SET_ADDR': 
      return { ...s, contractAddress: a.v }
    case 'SET_PHASES': 
      return { ...s, phases: a.v }
    case 'SET_SAVING': 
      return { ...s, isSaving: a.v }
    case 'SET_ERROR': 
      return { ...s, error: a.v }
    default: 
      return s
  }
}

export function useLaunchpadApproval() {
  const [state, dispatch] = useReducer(reducer, initialApproval)
  
  const open = (v: boolean) => dispatch({ type: 'OPEN', open: v })
  const setAddress = (v: string) => dispatch({ type: 'SET_ADDR', v })
  const setPhases = (v: ClaimPhase[]) => dispatch({ type: 'SET_PHASES', v })

  const save = useCallback(async (collectionId: string) => {
    dispatch({ type: 'SET_SAVING', v: true })
    dispatch({ type: 'SET_ERROR', v: undefined })
    try {
      await approveCollection({ 
        collectionId, 
        contractAddress: state.contractAddress, 
        phases: state.phases 
      })
      dispatch({ type: 'OPEN', open: false })
      return true
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', v: e?.message ?? 'Falha ao aprovar coleção' })
      return false
    } finally {
      dispatch({ type: 'SET_SAVING', v: false })
    }
  }, [state.contractAddress, state.phases])

  return { state, open, setAddress, setPhases, save }
}
