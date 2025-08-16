// ================================================
// useMint Hook
// Estado e ações para minting/claiming
// ================================================

import { useCallback, useReducer } from 'react'
import type { ThirdwebDeps } from '../services/thirdwebService'
import { loadClaimInfo, claimOne, pickDisplayImage } from '../services/thirdwebService'
import { withGatewayFallback } from '../services/ipfs'

export type MintState = {
  address?: string
  isLoading: boolean
  isClaiming: boolean
  error?: string
  claim?: any
  previewUrl?: string
  previewAlternatives?: string[]
}

const initialMint: MintState = { isLoading: false, isClaiming: false }

type Action =
  | { type: 'SET_ADDRESS'; v?: string }
  | { type: 'SET_LOADING'; v: boolean }
  | { type: 'SET_CLAIMING'; v: boolean }
  | { type: 'SET_ERROR'; v?: string }
  | { type: 'SET_INFO'; claim?: any; previewUrl?: string; previewAlternatives?: string[] }

function reducer(s: MintState, a: Action): MintState {
  switch (a.type) {
    case 'SET_ADDRESS':
      return { ...s, address: a.v }
    case 'SET_LOADING':
      return { ...s, isLoading: a.v }
    case 'SET_CLAIMING':
      return { ...s, isClaiming: a.v }
    case 'SET_ERROR':
      return { ...s, error: a.v }
    case 'SET_INFO':
      return { ...s, claim: a.claim, previewUrl: a.previewUrl, previewAlternatives: a.previewAlternatives }
    default:
      return s
  }
}

export function useMint(deps: ThirdwebDeps) {
  const [state, dispatch] = useReducer(reducer, initialMint)

  const load = useCallback(async (address: string, nft?: any) => {
    dispatch({ type: 'SET_LOADING', v: true })
    dispatch({ type: 'SET_ERROR', v: undefined })
    try {
      const { claim } = await loadClaimInfo(address, deps)
      const preview = pickDisplayImage(nft)
      const alternatives = preview ? withGatewayFallback(preview) : undefined
      dispatch({ type: 'SET_ADDRESS', v: address })
      dispatch({ type: 'SET_INFO', claim, previewUrl: preview, previewAlternatives: alternatives })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', v: e?.message ?? 'Falha ao carregar claim' })
    } finally {
      dispatch({ type: 'SET_LOADING', v: false })
    }
  }, [deps])

  const claimOneTo = useCallback(async (toWallet: string) => {
    if (!state.address) throw new Error('Endereço de contrato não carregado')
    dispatch({ type: 'SET_CLAIMING', v: true })
    dispatch({ type: 'SET_ERROR', v: undefined })
    try {
      await claimOne(state.address, toWallet, deps)
      return true
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', v: e?.message ?? 'Falha no mint/claim' })
      return false
    } finally {
      dispatch({ type: 'SET_CLAIMING', v: false })
    }
  }, [deps, state.address])

  return { state, load, claimOneTo }
}
