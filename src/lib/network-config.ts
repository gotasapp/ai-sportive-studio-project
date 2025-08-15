/**
 * 🎯 MASTER NETWORK SWITCH - CONTROLE TOTAL CHZ ↔ AMOY
 * 
 * Para trocar de rede: 
 * 1. Mudar USE_CHZ_MAINNET para true/false
 * 2. Fazer deploy
 * 
 * SIMPLES E DIRETO!
 */

// 🔥 MASTER SWITCH - ALTERE AQUI PARA TROCAR TUDO
export const USE_CHZ_MAINNET = false; // true = CHZ | false = Amoy

// ⚙️ CONFIGURAÇÕES AUTOMÁTICAS BASEADAS NO SWITCH
export const ACTIVE_NETWORK = USE_CHZ_MAINNET ? {
  // 🟢 CHZ MAINNET CONFIGURATION
  chainId: 88888,
  name: 'Chiliz Chain',
  currency: 'CHZ',
  symbol: 'CHZ',
  rpcUrl: 'https://rpc.ankr.com/chiliz',
  explorerUrl: 'https://scan.chiliz.com',
  explorerName: 'ChilizScan',
  
  // Contratos CHZ (já deployados)
  contracts: {
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ!,
    nftDrop: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ!,
    launchpad: process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ!,
  },
  
  // Configurações específicas CHZ
  isTestnet: false,
  faucet: null,
  defaultPrice: '0.1 CHZ',
  gasMultiplier: 1.2,
  
} : {
  // 🟡 POLYGON AMOY CONFIGURATION  
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  currency: 'MATIC',
  symbol: 'MATIC',
  rpcUrl: 'https://rpc-amoy.polygon.technology',
  explorerUrl: 'https://amoy.polygonscan.com',
  explorerName: 'PolygonScan',
  
  // Contratos Amoy (funcionando)
  contracts: {
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '0x723436a84d57150A5109eFC540B2f0b2359Ac76d',
    nftDrop: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
    launchpad: process.env.NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS || '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639',
  },
  
  // Configurações específicas Amoy
  isTestnet: true,
  faucet: 'https://faucet.polygon.technology',
  defaultPrice: '0.1 MATIC',
  gasMultiplier: 1.5,
};

// 🎯 EXPORTS SIMPLES PARA USO NO APP
export const {
  chainId: ACTIVE_CHAIN_ID,
  name: NETWORK_NAME,
  currency: NETWORK_CURRENCY,
  rpcUrl: ACTIVE_RPC_URL,
  explorerUrl: ACTIVE_EXPLORER_URL,
  contracts: ACTIVE_CONTRACTS,
  defaultPrice: DEFAULT_PRICE,
  isTestnet: IS_TESTNET
} = ACTIVE_NETWORK;

// 🔧 HELPER FUNCTIONS
export const getContractAddress = (type: 'marketplace' | 'nftDrop' | 'launchpad') => {
  return ACTIVE_CONTRACTS[type];
};

export const getExplorerLink = (hash: string) => {
  return `${ACTIVE_EXPLORER_URL}/tx/${hash}`;
};

export const isChzNetwork = () => USE_CHZ_MAINNET;
export const isAmoyNetwork = () => !USE_CHZ_MAINNET;

// 🚨 VALIDAÇÃO DE CONTRATOS
if (!ACTIVE_CONTRACTS.marketplace || !ACTIVE_CONTRACTS.nftDrop) {
  console.error('❌ CONTRATOS OBRIGATÓRIOS FALTANDO!', {
    network: NETWORK_NAME,
    marketplace: ACTIVE_CONTRACTS.marketplace,
    nftDrop: ACTIVE_CONTRACTS.nftDrop,
    launchpad: ACTIVE_CONTRACTS.launchpad
  });
}

console.log('🎯 NETWORK CONFIG LOADED:', {
  network: NETWORK_NAME,
  chainId: ACTIVE_CHAIN_ID,
  currency: NETWORK_CURRENCY,
  contracts: Object.keys(ACTIVE_CONTRACTS).length,
  isChz: isChzNetwork()
});
