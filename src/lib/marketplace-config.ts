import { getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { client } from './ThirdwebProvider';

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

// Configuração dos contratos de marketplace por rede
export const MARKETPLACE_CONTRACTS = {
  [chzMainnet.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ || '',
  // Usar o mesmo contrato para Polygon Mainnet e Testnet por enquanto
  [polygon.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET || process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
} as const;

// NFT Collection contracts - usando os contratos corretos do .env.local
export const NFT_CONTRACTS = {
  // CHZ Mainnet - usando NFT_DROP_CONTRACT_CHZ
  [chzMainnet.id]: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ || '',
  // Polygon Mainnet - usando fallback da Polygon Testnet por enquanto
  [polygon.id]: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON || process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  // Polygon Amoy Testnet - usando NFT_DROP_CONTRACT_POLYGON_TESTNET
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
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

// Exportar cliente para uso em outros arquivos
export { client };

// Endereço especial para token nativo (CHZ, ETH, MATIC) - usado apenas para direct listings e auctions
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Endereços de tokens ERC20 para ofertas (ofertas não podem usar tokens nativos)
export const ERC20_TOKEN_ADDRESSES = {
  // Polygon Amoy (testnet) - WMATIC
  [polygonAmoy.id]: '0x0Ae690aad8663aab12A671a6A0d74242332DE85f', // WMATIC no Amoy
  // Polygon Mainnet - WMATIC
  [polygon.id]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  // CHZ Mainnet - CHZ
  [chzMainnet.id]: '0x677F7e16C7Dd57be1D4C8aD1244883214953DC47', // CHZ token
} as const;

// Helper para obter endereço do token ERC20 para ofertas por rede
export function getOfferCurrency(chainId: number): string {
  const tokenAddress = ERC20_TOKEN_ADDRESSES[chainId];
  if (!tokenAddress) {
    throw new Error(`Token ERC20 para ofertas não configurado para a rede ${chainId}. Ofertas precisam usar tokens ERC20, não nativos.`);
  }
  return tokenAddress;
}

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