// ================================================
// IPFS Service
// Gateway management e normalização de URLs
// ================================================

export type GatewayPolicy = {
  primary: string
  retries?: string[]
}

const DEFAULT_GATEWAYS: GatewayPolicy = {
  primary: 'https://cloudflare-ipfs.com/ipfs/',
  retries: [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
  ]
}

export function normalizeIpfsUri(uri?: string, policy: GatewayPolicy = DEFAULT_GATEWAYS): string | undefined {
  if (!uri) return undefined
  if (uri.startsWith('http')) return uri
  const cid = uri.replace('ipfs://', '').replace(/^ipfs\//, '')
  return policy.primary + cid
}

export function withGatewayFallback(url: string, tries: string[] = DEFAULT_GATEWAYS.retries ?? []) {
  // Retorna uma lista ordenada: url original + alternativas (útil para componente com fallback)
  const out = [url]
  for (const base of tries) {
    if (!url.startsWith(base)) {
      const cid = url.split('/ipfs/')[1] ?? url
      out.push(base + cid)
    }
  }
  return out
}
