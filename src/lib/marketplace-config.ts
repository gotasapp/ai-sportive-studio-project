import { createThirdwebClient, getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { polygon, polygonAmoy } from 'thirdweb/chains';

// Cliente Thirdweb
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Define CHZ Chain
export const chzMainnet = defineChain({
  id: 88888,
  name: 'Chiliz Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Chiliz',
    symbol: 'CHZ',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/chiliz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'ChilizScan', 
      url: 'https://scan.chiliz.com' 
    },
  },
});

// Configuração dos contratos por rede
export const MARKETPLACE_CONTRACTS = {
  [chzMainnet.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '',
  [polygon.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON || '',
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || '',
} as const;

// NFT Collection contracts - UM CONTRATO UNIVERSAL para todos os tipos
// O Marketplace V3 funciona com QUALQUER contrato ERC-721/ERC-1155
export const NFT_CONTRACTS = {
  // Contrato principal que mintamos todos os NFTs (jerseys, stadiums, badges)
  [chzMainnet.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CHZ || '',
  [polygon.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON || '',
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON_TESTNET || '',
} as const;

// Helper para obter contrato de marketplace por rede
export function getMarketplaceContract(chainId: number) {
  const contractAddress = MARKETPLACE_CONTRACTS[chainId];
  if (!contractAddress) {
    throw new Error(`Marketplace contract not configured for chain ${chainId}`);
  }
  
  return getContract({
    client,
    address: contractAddress,
    chain: chainId === chzMainnet.id ? chzMainnet : 
           chainId === polygon.id ? polygon : 
           chainId === polygonAmoy.id ? polygonAmoy : 
           undefined,
  });
}

// Helper para obter contrato NFT universal (todos os tipos usam o mesmo contrato)
export function getNFTContract(chainId: number) {
  const contractAddress = NFT_CONTRACTS[chainId];
  if (!contractAddress) {
    throw new Error(`NFT contract not configured for chain ${chainId}`);
  }
  
  return getContract({
    client,
    address: contractAddress,
    chain: chainId === chzMainnet.id ? chzMainnet : 
           chainId === polygon.id ? polygon : 
           chainId === polygonAmoy.id ? polygonAmoy : 
           undefined,
  });
}

// Endereço especial para token nativo (CHZ, ETH, MATIC)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Helper para formatação de preços
export function formatPrice(price: string | number, currency: string = 'CHZ'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numPrice.toFixed(3)} ${currency}`;
}

// Helper para converter preço para wei
export function priceToWei(price: string): bigint {
  return BigInt(Math.floor(parseFloat(price) * 1e18));
}

// Helper para converter wei para preço legível
export function weiToPrice(wei: bigint): string {
  return (Number(wei) / 1e18).toString();
} 