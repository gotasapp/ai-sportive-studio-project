// ================================================
// Thirdweb Service
// Abstração para contratos e minting
// ================================================

import { normalizeIpfsUri } from './ipfs'

export type ThirdwebDeps = {
  // Funções injetadas do teu ambiente Thirdweb (para não acoplar aqui)
  getContract: (address: string) => Promise<any>
  getActiveClaimConditions?: (contract: any) => Promise<any>
  claimTo?: (contract: any, args: { to: string; quantity: string | number }) => Promise<any>
  isOpenEdition?: boolean
}

export async function loadClaimInfo(address: string, deps: ThirdwebDeps) {
  const contract = await deps.getContract(address)
  const claim = deps.getActiveClaimConditions ? await deps.getActiveClaimConditions(contract) : null
  return { contract, claim }
}

export async function claimOne(address: string, toWallet: string, deps: ThirdwebDeps) {
  const { contract } = await loadClaimInfo(address, deps)
  if (!deps.claimTo) throw new Error('claimTo() não disponível no ambiente Thirdweb')
  return deps.claimTo(contract, { to: toWallet, quantity: 1 })
}

export function pickDisplayImage(nft: any): string | undefined {
  // Tenta URLs em ordem: imagem http(s) direta > cloudinary > ipfs
  const httpish = nft?.image || nft?.metadata?.image || nft?.metadata?.image_url
  if (typeof httpish === 'string' && httpish.startsWith('http')) return httpish
  const ipfsish = typeof httpish === 'string' ? httpish : (nft?.image_ipfs || nft?.metadata?.image_ipfs)
  return normalizeIpfsUri(ipfsish)
}
