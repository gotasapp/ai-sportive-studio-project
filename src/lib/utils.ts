import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get the correct explorer URL based on current network configuration
export function getExplorerUrl(): string {
  const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
  const usePolygon = process.env.NEXT_PUBLIC_USE_POLYGON === 'true';
  
  if (usePolygon) {
    return isTestnet 
      ? 'https://amoy.polygonscan.com'
      : 'https://polygonscan.com';
  } else {
    return isTestnet 
      ? 'https://spicy.chzscan.com'
      : 'https://scan.chiliz.com';
  }
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
 * Converts IPFS URLs to HTTP gateway URLs
 * @param src - The IPFS URL or hash
 * @returns HTTP gateway URL
 */
export function convertIpfsToHttp(src: string): string {
  // Se já é uma URL HTTP, retornar como está
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Se é uma URL IPFS, converter para gateway HTTP
  if (src.startsWith('ipfs://')) {
    const ipfsHash = src.replace('ipfs://', '');
    return `https://gateway.ipfs.io/ipfs/${ipfsHash}`;
  }
  
  // Se começa com Qm (hash IPFS), adicionar gateway
  if (src.startsWith('Qm') || src.startsWith('bafy')) {
    return `https://gateway.ipfs.io/ipfs/${src}`;
  }
  
  // Fallback para URLs normais
  return src;
}
