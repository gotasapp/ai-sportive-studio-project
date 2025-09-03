// ================================================
// JERSEY EDITOR TYPES
// Contratos TypeScript centralizados
// ================================================

export type JerseyBase = {
  playerName: string
  playerNumber: string
  teamId?: string
  style?: string
}

export type GenerationStatus = 'idle' | 'analyzing' | 'generating' | 'ready' | 'error'

export type EditorState = {
  base: JerseyBase
  previewUrl?: string
  status: GenerationStatus
  error?: string
}
