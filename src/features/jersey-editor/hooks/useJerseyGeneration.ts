// ================================================
// useJerseyGeneration Hook
// Controla fluxo de upload → vision → geração
// ================================================

import { useCallback, useReducer } from 'react'
import type { VisionAnalysis, GeneratePayload } from '../services/generationService'
import { uploadReferenceImage, analyzeReference, generateJerseyImage } from '../services/generationService'

export type GenerationState = {
  referenceUrl?: string
  analysis?: VisionAnalysis
  analysisText?: string
  previewUrl?: string
  status: 'idle' | 'uploading' | 'analyzing' | 'ready_to_generate' | 'generating' | 'ready' | 'error'
  error?: string
}

const initial: GenerationState = { status: 'idle' }

type Action =
  | { type: 'SET_REF'; url?: string }
  | { type: 'SET_ANALYSIS'; analysis?: VisionAnalysis; text?: string }
  | { type: 'SET_PREVIEW'; url?: string }
  | { type: 'SET_STATUS'; v: GenerationState['status'] }
  | { type: 'SET_ERROR'; e?: string }

function reducer(s: GenerationState, a: Action): GenerationState {
  switch (a.type) {
    case 'SET_REF':
      return { ...s, referenceUrl: a.url }
    case 'SET_ANALYSIS':
      return { ...s, analysis: a.analysis, analysisText: a.text }
    case 'SET_PREVIEW':
      return { ...s, previewUrl: a.url }
    case 'SET_STATUS':
      return { ...s, status: a.v }
    case 'SET_ERROR':
      return { ...s, error: a.e }
    default:
      return s
  }
}

export function useJerseyGeneration() {
  const [state, dispatch] = useReducer(reducer, initial)

  const doUpload = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'SET_STATUS', v: 'uploading' })
      dispatch({ type: 'SET_ERROR', e: undefined })
      const { url } = await uploadReferenceImage(file)
      dispatch({ type: 'SET_REF', url })
      dispatch({ type: 'SET_STATUS', v: 'analyzing' })
      const analysis = await analyzeReference(url)
      const text = [
        ...(analysis.dominantColors ?? []),
        ...(analysis.patterns ?? []),
        analysis.fabric ? `fabric:${analysis.fabric}` : '',
        ...(analysis.logoHints ?? [])
      ].filter(Boolean).join(', ')
      dispatch({ type: 'SET_ANALYSIS', analysis, text })
      dispatch({ type: 'SET_STATUS', v: 'ready_to_generate' })
    } catch (err: any) {
      dispatch({ type: 'SET_STATUS', v: 'error' })
      dispatch({ type: 'SET_ERROR', e: err?.message ?? 'Falha no upload/análise' })
    }
  }, [])

  const doGenerate = useCallback(async (payload: Omit<GeneratePayload, 'analysisText'>) => {
    dispatch({ type: 'SET_STATUS', v: 'generating' })
    dispatch({ type: 'SET_ERROR', e: undefined })
    try {
      const { imageUrl } = await generateJerseyImage({ ...payload, analysisText: state.analysisText })
      dispatch({ type: 'SET_PREVIEW', url: imageUrl })
      dispatch({ type: 'SET_STATUS', v: 'ready' })
    } catch (err: any) {
      dispatch({ type: 'SET_STATUS', v: 'error' })
      dispatch({ type: 'SET_ERROR', e: err?.message ?? 'Falha ao gerar imagem' })
    }
  }, [state.analysisText])

  return { state, doUpload, doGenerate }
}
