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
