import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get the correct explorer URL - Simplificado para Polygon Amoy
export function getExplorerUrl(): string {
  // Usar sempre Polygon Amoy
  return 'https://amoy.polygonscan.com';
}

// Helper function to get transaction URL
export function getTransactionUrl(txHash: string): string {
  return `${getExplorerUrl()}/tx/${txHash}`;
}

// Helper function to get address URL  
export function getAddressUrl(address: string): string {
  return `${getExplorerUrl()}/address/${address}`;
}

/**
 * Converts IPFS URLs to HTTP gateway URLs with fallback gateways
 * @param src - The IPFS URL or hash
 * @returns HTTP gateway URL
 */
export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://gateway.ipfs.io/ipfs',
  'https://dweb.link/ipfs',
  'https://nftstorage.link/ipfs'
] as const;

export function buildIpfsGatewayUrl(hash: string, gatewayBase: string): string {
  return `${gatewayBase}/${hash}`;
}

export function convertIpfsToHttp(src: string): string {
  // Verificar se src é válido
  if (!src || typeof src !== 'string') {
    return '/api/placeholder/400/400'; // Placeholder para imagens inválidas
  }
  
  // Se já é uma URL HTTP, retornar como está
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Lista de gateways IPFS
  const gateways = IPFS_GATEWAYS as unknown as string[];
  
  // Usar gateway rotativo baseado em hash para distribuir carga
  const getRandomGateway = (hash: string) => {
    const index = hash.charCodeAt(0) % gateways.length;
    return gateways[index];
  };
  
  let ipfsHash = '';
  
  // Se é uma URL IPFS, extrair hash
  if (src.startsWith('ipfs://')) {
    ipfsHash = src.replace('ipfs://', '');
  }
  // Se começa com Qm ou bafy (hash IPFS direto)
  else if (src.startsWith('Qm') || src.startsWith('bafy')) {
    ipfsHash = src;
  }
  // Fallback para URLs normais
  else {
    return src;
  }
  
  // Retornar URL com gateway selecionado
  const selectedGateway = getRandomGateway(ipfsHash);
  return buildIpfsGatewayUrl(ipfsHash, selectedGateway);
}

/**
 * Normaliza uma URI IPFS para um gateway HTTP público (Pinata por padrão, Cloudflare como fallback)
 * @param uri - A URI IPFS ou HTTP
 * @param fallback - Se true, usa Cloudflare como fallback
 * @returns URI HTTP normalizada
 */
export function normalizeIpfsUri(uri: string, fallback = false): string {
  if (!uri) return '';
  const hash = uri.replace('ipfs://', '').replace(/^https?:\/\/[^/]+\/ipfs\//, '');
  return fallback
    ? `https://dweb.link/ipfs/${hash}`
    : `https://ipfs.io/ipfs/${hash}`;
}
