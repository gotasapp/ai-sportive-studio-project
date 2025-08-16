// ================================================
// useJerseyEditor Hook
// Estado centralizado sem efeitos externos
// ================================================

import { useCallback, useMemo, useReducer } from 'react'
import type { EditorState, JerseyBase } from '../types'

const initialBase: JerseyBase = { playerName: '', playerNumber: '' }

const initialState: EditorState = { base: initialBase, status: 'idle' }

type Action =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_NUMBER'; number: string }
  | { type: 'SET_TEAM'; teamId?: string }
  | { type: 'SET_STYLE'; style?: string }
  | { type: 'SET_PREVIEW'; url?: string }
  | { type: 'SET_STATUS'; status: EditorState['status'] }
  | { type: 'SET_ERROR'; error?: string }

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, base: { ...state.base, playerName: action.name } }
    case 'SET_NUMBER':
      return { ...state, base: { ...state.base, playerNumber: action.number } }
    case 'SET_TEAM':
      return { ...state, base: { ...state.base, teamId: action.teamId } }
    case 'SET_STYLE':
      return { ...state, base: { ...state.base, style: action.style } }
    case 'SET_PREVIEW':
      return { ...state, previewUrl: action.url }
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    default:
      return state
  }
}

export function useJerseyEditor() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const setName = useCallback((name: string) => dispatch({ type: 'SET_NAME', name }), [])
  const setNumber = useCallback((number: string) => dispatch({ type: 'SET_NUMBER', number }), [])
  const setTeam = useCallback((teamId?: string) => dispatch({ type: 'SET_TEAM', teamId }), [])
  const setStyle = useCallback((style?: string) => dispatch({ type: 'SET_STYLE', style }), [])
  const setPreview = useCallback((url?: string) => dispatch({ type: 'SET_PREVIEW', url }), [])
  const setStatus = useCallback((status: EditorState['status']) => dispatch({ type: 'SET_STATUS', status }), [])
  const setError = useCallback((error?: string) => dispatch({ type: 'SET_ERROR', error }), [])

  const canGenerate = useMemo(() => !!state.base.playerName && !!state.base.playerNumber, [state.base])

  return {
    state,
    setName,
    setNumber,
    setTeam,
    setStyle,
    setPreview,
    setStatus,
    setError,
    canGenerate,
  }
}
