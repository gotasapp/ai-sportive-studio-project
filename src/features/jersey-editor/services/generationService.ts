// ================================================
// Generation Service
// Upload + Vision + DALL·E integration
// ================================================

export type VisionAnalysis = {
  dominantColors?: string[]
  patterns?: string[]
  logoHints?: string[]
  fabric?: string
  notes?: string
}

export type GeneratePayload = {
  sport: 'soccer' | 'basketball' | 'nfl'
  team?: string
  playerName: string
  playerNumber: string
  style?: string
  analysisText?: string
}

export async function uploadReferenceImage(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/vision/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
  return res.json()
}

export async function analyzeReference(url: string): Promise<VisionAnalysis> {
  const res = await fetch('/api/vision/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  if (!res.ok) throw new Error(`Vision failed: ${res.statusText}`)
  return res.json()
}

export function buildPromptBase(p: GeneratePayload): string {
  // Mantém 90% fixo, mudando apenas time/nome/número/esporte/estilo
  const core = `High-quality product shot of a professional ${p.sport} jersey on invisible mannequin, front view, centered, realistic fabric, studio lighting, clean background, sharp details.`
  const identity = `${p.team ? `Team: ${p.team}.` : ''} Player name: ${p.playerName}. Number: ${p.playerNumber}. Style: ${p.style ?? 'standard'}.`
  const vision = p.analysisText ? ` Keep color/material/pattern hints: ${p.analysisText}.` : ''
  return `${core} ${identity}${vision}`
}

export async function generateJerseyImage(p: GeneratePayload): Promise<{ imageUrl: string }> {
  const prompt = buildPromptBase(p)
  const res = await fetch('/api/generation/jersey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, meta: p })
  })
  if (!res.ok) throw new Error(`Generation failed: ${res.statusText}`)
  return res.json()
}
