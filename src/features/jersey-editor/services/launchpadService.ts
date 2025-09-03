// ================================================
// Launchpad Service
// Aprovação de coleções e fases de claim
// ================================================

export type ClaimPhase = {
  name: string
  start?: string // ISO
  price?: string
  currency?: string
  maxPerWallet?: number
  allowlist?: string[]
}

export async function approveCollection(args: { 
  collectionId: string
  contractAddress: string
  phases?: ClaimPhase[] 
}) {
  const res = await fetch('/api/launchpad/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  })
  if (!res.ok) throw new Error(`Approve failed: ${res.statusText}`)
  return res.json()
}
