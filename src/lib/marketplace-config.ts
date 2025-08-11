import { getContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { client } from './ThirdwebProvider';
import { getAllSupportedContractsUnified, isAnyContractValid } from './dynamic-contract-registry';

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
  // Usar o contrato correto do .env.local para ambas as redes Polygon
  [polygon.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
} as const;

// NFT Collection contracts - usando os contratos corretos do .env.local
export const NFT_CONTRACTS = {
  // CHZ Mainnet - usando NFT_DROP_CONTRACT_CHZ
  [chzMainnet.id]: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ || '0x3db78Cf4543cff5c4f514bcDA5a56c3234d5EC78',
  // Polygon Mainnet - vai usar o testnet por enquanto até termos contrato na mainnet
  [polygon.id]: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  // Polygon Amoy Testnet (ID: 80002) - usando NFT_DROP_CONTRACT_POLYGON_TESTNET
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
  // Fallback explícito para Polygon Amoy por ID numérico
  80002: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
} as const;

// Launchpad contracts - OpenEditionERC721 contracts
export const LAUNCHPAD_CONTRACTS = {
  // Polygon Amoy Testnet - contrato do launchpad  
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639',
  // Fallback explícito para Polygon Amoy por ID numérico
  80002: process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639',
} as const;

// All supported contracts (NFT + Launchpad)
export const ALL_SUPPORTED_CONTRACTS = {
  ...NFT_CONTRACTS,
  ...LAUNCHPAD_CONTRACTS
} as const;

// Helper para obter todos os endereços de contratos suportados para uma chain
export function getSupportedContractAddresses(chainId: number): string[] {
  const contracts: string[] = [];
  
  // Adicionar contrato NFT legacy se existir
  if (NFT_CONTRACTS[chainId]) {
    contracts.push(NFT_CONTRACTS[chainId]);
  }
  
  // Adicionar contrato launchpad genérico se existir
  if (LAUNCHPAD_CONTRACTS[chainId]) {
    contracts.push(LAUNCHPAD_CONTRACTS[chainId]);
  }
  
  // NOTA: Contratos específicos de coleções do launchpad devem ser buscados dinamicamente
  // do MongoDB pois cada coleção tem seu próprio contrato deployado
  
  return contracts;
}

// Helper assíncrono para obter contratos incluindo os dinâmicos do launchpad
export async function getSupportedContractAddressesWithDynamic(
  chainId: number, 
  mongoDb?: any
): Promise<string[]> {
  const staticContracts = getSupportedContractAddresses(chainId);
  
  if (!mongoDb) {
    return staticContracts;
  }
  
  try {
    // Buscar contratos específicos das coleções do launchpad
    const launchpadCollections = await mongoDb.collection('collections').find({
      type: 'launchpad',
      contractAddress: { $exists: true, $ne: null }
    }).toArray();
    
    // ✅ BUSCAR CONTRATOS DAS CUSTOM COLLECTIONS TAMBÉM
    const customCollections = await mongoDb.collection('custom_collections').find({
      contractAddress: { $exists: true, $ne: null }
    }).toArray();
    
    const launchpadContracts = launchpadCollections
      .map((col: any) => col.contractAddress)
      .filter((addr: string) => addr && addr !== '');
    
    const customContracts = customCollections
      .map((col: any) => col.contractAddress)
      .filter((addr: string) => addr && addr !== '');
    
    // Combinar TODOS os contratos (estáticos + launchpad + custom)
    const allContracts = Array.from(new Set([...staticContracts, ...launchpadContracts, ...customContracts]));
    
    console.log(`📋 Total de contratos suportados: ${allContracts.length}`, allContracts);
    console.log('📋 Custom Collections encontradas:', customContracts);
    
    return allContracts;
  } catch (error) {
    console.error('❌ Erro ao buscar contratos dinâmicos:', error);
    return staticContracts;
  }
}

// Helper para verificar se um contrato é suportado
export function isSupportedContract(contractAddress: string, chainId: number): boolean {
  // NOVA LÓGICA: Aceita QUALQUER contrato válido
  // Não precisa estar pré-registrado
  return isAnyContractValid(contractAddress);
}

// Export da função unificada para uso em APIs
export { getAllSupportedContractsUnified };

// Helper para obter contrato de marketplace por rede
export function getMarketplaceContract(chainId: number) {
  const contractAddress = MARKETPLACE_CONTRACTS[chainId];
  if (!contractAddress) {
    throw new Error(`Marketplace contract not configured for chain ${chainId}`);
  }
  
  // Determinar a chain correta baseada no chainId
  let chain;
  if (chainId === chzMainnet.id) {
    chain = chzMainnet;
  } else if (chainId === polygon.id) {
    chain = polygon;
  } else if (chainId === polygonAmoy.id) {
    chain = polygonAmoy;
  } else {
    // Fallback para Polygon Amoy como padrão para chains não reconhecidas
    chain = polygonAmoy;
  }

  return getContract({
    client,
    address: contractAddress,
    chain,
  });
}

// Helper para obter contrato NFT universal (todos os tipos usam o mesmo contrato)
export function getNFTContract(chainId: number) {
  const contractAddress = NFT_CONTRACTS[chainId];
  if (!contractAddress) {
    throw new Error(`NFT contract not configured for chain ${chainId}`);
  }
  
  // Determinar a chain correta baseada no chainId
  let chain;
  if (chainId === chzMainnet.id) {
    chain = chzMainnet;
  } else if (chainId === polygon.id) {
    chain = polygon;
  } else if (chainId === polygonAmoy.id) {
    chain = polygonAmoy;
  } else {
    // Fallback para Polygon Amoy como padrão para chains não reconhecidas
    chain = polygonAmoy;
  }

  return getContract({
    client,
    address: contractAddress,
    chain,
  });
}

// Exportar cliente para uso em outros arquivos
export { client };

// Endereço especial para token nativo (CHZ, ETH, MATIC) - usado apenas para direct listings e auctions
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Endereços de tokens ERC20 para ofertas (ofertas não podem usar tokens nativos)
export const ERC20_TOKEN_ADDRESSES = {
  // Polygon Amoy (testnet) - WMATIC testnet
  [polygonAmoy.id]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WMATIC testnet ou token de teste
  // Polygon Mainnet - WMATIC
  [polygon.id]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  // CHZ Mainnet - CHZ
  [chzMainnet.id]: '0x677F7e16C7Dd57be1D4C8aD1244883214953DC47', // CHZ token
} as const;

// Helper para obter endereço do token ERC20 para ofertas por rede
export function getOfferCurrency(chainId: number): string {
  const tokenAddress = ERC20_TOKEN_ADDRESSES[chainId];
  if (!tokenAddress) {
    // Para testes, retornar endereço nativo temporariamente
    console.warn(`⚠️ Token ERC20 para ofertas não configurado para a rede ${chainId}. Usando token nativo temporariamente.`);
    return NATIVE_TOKEN_ADDRESS;
  }
  return tokenAddress;
}

// Helper para formatação de preços
export function formatPrice(price: string | number, currency: string = 'CHZ'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numPrice.toFixed(3)} ${currency}`;
}

// Helper para converter preço para wei com validação
export function priceToWei(price: string): bigint {
  const numPrice = parseFloat(price);
  
  // Validações críticas
  if (isNaN(numPrice)) {
    throw new Error(`Invalid price format: "${price}". Must be a valid number.`);
  }
  
  if (numPrice < 0) {
    throw new Error(`Price cannot be negative: ${numPrice}`);
  }
  
  if (numPrice > 1000) {
    throw new Error(`Price too high: ${numPrice} MATIC. Maximum allowed is 1000 MATIC for safety.`);
  }
  
  if (numPrice > 0 && numPrice < 0.000001) {
    console.warn(`⚠️ Very small price detected: ${numPrice} MATIC. Consider using at least 0.000001 MATIC.`);
  }
  
  const weiValue = BigInt(Math.floor(numPrice * 1e18));
  
  // Validação adicional do resultado
  const backToEther = Number(weiValue) / 1e18;
  const difference = Math.abs(backToEther - numPrice);
  
  if (difference > 0.000001) {
    console.warn(`⚠️ Precision loss in price conversion:`, {
      original: numPrice,
      converted: backToEther,
      difference,
      wei: weiValue.toString()
    });
  }
  
  console.log(`💰 Price conversion validated:`, {
    input: price,
    parsed: numPrice,
    wei: weiValue.toString(),
    backToEther: backToEther.toFixed(6)
  });
  
  return weiValue;
}

// Helper para converter wei para preço legível
export function weiToPrice(wei: bigint): string {
  return (Number(wei) / 1e18).toString();
}

// 🚨 NOVAS FUNÇÕES DE VALIDAÇÃO E CORREÇÃO

/**
 * Validate if a price is reasonable (not astronomical)
 */
export function isValidPrice(priceInput: bigint | string | number): boolean {
  try {
    let ether: number;
    
    if (typeof priceInput === 'string') {
      // Handle special cases first - these are valid display states
      const validDisplayStates = ['Not for sale', 'N/A', 'Not listed', 'Free', '0 MATIC', '0.000 MATIC'];
      if (validDisplayStates.includes(priceInput)) {
        return true;
      }
      
      // Extract numeric value from formatted strings like "1.234 MATIC"
      const cleanPrice = priceInput.replace(/[^0-9.]/g, '');
      
      if (cleanPrice && !isNaN(parseFloat(cleanPrice))) {
        ether = parseFloat(cleanPrice);
      } else {
        // If no valid number found, it's invalid
        return false;
      }
    } else if (typeof priceInput === 'number') {
      ether = priceInput;
    } else {
      // BigInt wei value
      ether = Number(priceInput) / 1e18;
    }
    
    // Price should be between 0.000001 and 1,000 ETH/MATIC
    // Allow 0 for "free" NFTs
    return ether >= 0 && ether < 1000;
  } catch (error) {
    console.warn('⚠️ Error validating price:', priceInput, error);
    return false;
  }
}

/**
 * Validate and fix corrupted price
 */
export function validateAndFixPrice(priceWei: bigint | string, fallbackPrice: string = '0.001'): {
  isValid: boolean;
  correctedPrice: bigint;
  originalEther: number;
  correctedEther: number;
} {
  try {
    // Se for string, limpar e validar antes de converter
    let wei: bigint;
    if (typeof priceWei === 'string') {
      // Remover texto como "MATIC", "ETH", etc. e espaços
      const cleanPrice = priceWei.replace(/[^0-9.]/g, '');
      
      // Se ficar vazio ou só zeros, usar fallback
      if (!cleanPrice || cleanPrice === '0' || cleanPrice === '0.' || cleanPrice === '.') {
        throw new Error(`Invalid price string: "${priceWei}" cleaned to "${cleanPrice}"`);
      }
      
      // Se parece ser em ether (tem ponto decimal), converter para wei
      if (cleanPrice.includes('.')) {
        wei = priceToWei(cleanPrice);
      } else {
        // Assumir que já está em wei
        wei = BigInt(cleanPrice);
      }
    } else {
      wei = priceWei;
    }
    const ether = Number(wei) / 1e18;
    
    const isValid = isValidPrice(wei);
    
    if (isValid) {
      return {
        isValid: true,
        correctedPrice: wei,
        originalEther: ether,
        correctedEther: ether
      };
    } else {
      // Use fallback price
      const correctedPrice = priceToWei(fallbackPrice);
      const correctedEther = parseFloat(fallbackPrice);
      
      console.warn('⚠️ CORRUPTED PRICE DETECTED AND FIXED:', {
        original: { wei: wei.toString(), ether },
        corrected: { wei: correctedPrice.toString(), ether: correctedEther }
      });
      
      return {
        isValid: false,
        correctedPrice,
        originalEther: ether,
        correctedEther
      };
    }
  } catch (error) {
    // In case of error, use fallback
    const correctedPrice = priceToWei(fallbackPrice);
    const correctedEther = parseFloat(fallbackPrice);
    
    console.error('❌ ERROR VALIDATING PRICE, USING FALLBACK:', error);
    
    return {
      isValid: false,
      correctedPrice,
      originalEther: 0,
      correctedEther
    };
  }
}

/**
 * Pre-validate price input before processing
 */
function preValidatePrice(input: bigint | string): { isValid: boolean; cleanValue: bigint | string } {
  if (typeof input === 'bigint') {
    return { isValid: true, cleanValue: input };
  }
  
  if (typeof input === 'string') {
    // Check for common invalid patterns
    if (input.includes('undefined') || input.includes('null') || input.includes('NaN')) {
      return { isValid: false, cleanValue: '1000000000000000' }; // 0.001 MATIC in wei
    }
    
    // Check for currency suffixes that would break BigInt conversion
    if (/\s*(MATIC|ETH|POL|CHZ)\s*$/i.test(input) && !/^\d+(\.\d+)?\s*(MATIC|ETH|POL|CHZ)\s*$/i.test(input)) {
      return { isValid: false, cleanValue: '1000000000000000' }; // fallback
    }
    
    // Check for "0 MATIC" specifically
    if (/^0+\s*(MATIC|ETH|POL|CHZ)\s*$/i.test(input)) {
      return { isValid: false, cleanValue: '1000000000000000' }; // fallback
    }
  }
  
  return { isValid: true, cleanValue: input };
}

/**
 * Format price for safe display
 */
export function formatPriceSafe(priceWei: bigint | string, currency: string = 'MATIC'): string {
  try {
    // Pre-validate input
    const preCheck = preValidatePrice(priceWei);
    
    if (!preCheck.isValid) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Invalid price input detected, using fallback:', priceWei);
      }
      return `0.001 ${currency}`;
    }
    
    const validation = validateAndFixPrice(preCheck.cleanValue);
    
    if (validation.isValid) {
      return `${validation.originalEther.toFixed(6)} ${currency}`;
    } else {
      return `${validation.correctedEther.toFixed(6)} ${currency} (fixed)`;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error in formatPriceSafe, using emergency fallback:', error);
    }
    return `0.001 ${currency}`;
  }
}

/**
 * Price debugging - for detailed logs
 */
export function debugPrice(priceWei: bigint | string, label: string = 'Price'): void {
  try {
    const wei = typeof priceWei === 'string' ? BigInt(priceWei) : priceWei;
    const ether = Number(wei) / 1e18;
    const isValid = isValidPrice(wei);
    
    console.log(`🔍 ${label} Debug:`, {
      wei: wei.toString(),
      ether: ether,
      formatted: `${ether.toFixed(6)} MATIC`,
      isValid,
      isAstronomical: ether > 1000000,
      isTooSmall: ether < 0.000001
    });
  } catch (error) {
    console.error(`❌ Error debugging ${label}:`, error);
  }
} 