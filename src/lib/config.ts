import { ChainId } from '@thirdweb-dev/sdk';

export const API_CONFIG = {
  DEFAULT_MODEL: 'Xenova/stable-diffusion-xl-base-1.0',
  DEFAULT_SAMPLER: 'DPM++ 2M Karras',
  DEFAULT_STEPS: 30,
  DEFAULT_CFG_SCALE: 7,
  DEFAULT_WIDTH: 768,
  DEFAULT_HEIGHT: 768,
  DEFAULT_SEED: -1
}

// Network Configuration
const USE_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
const USE_POLYGON = process.env.NEXT_PUBLIC_USE_POLYGON === 'true'

// Supported Networks (CHZ + Polygon only)
const NETWORKS = {
  // CHZ Networks (Primary)
  chz_mainnet: {
    chainId: 88888,
    name: 'Chiliz Chain',
    currency: 'CHZ',
    explorerUrl: 'https://scan.chiliz.com',
    rpcUrl: 'https://rpc.ankr.com/chiliz',
    faucet: null,
    isTestnet: false
  },
  chz_testnet: {
    chainId: 88882,
    name: 'CHZ Spicy Testnet',
    currency: 'CHZ',
    explorerUrl: 'https://spicy.chzscan.com',
    rpcUrl: 'https://spicy-rpc.chiliz.com',
    faucet: 'https://faucet.chiliz.com',
    isTestnet: true
  },
  
  // Polygon Networks (Alternative)
  polygon_mainnet: {
    chainId: 137,
    name: 'Polygon',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon.llamarpc.com',
    faucet: null,
    isTestnet: false
  },
  polygon_testnet: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    currency: 'MATIC',
    explorerUrl: 'https://amoy.polygonscan.com',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    faucet: 'https://faucet.polygon.technology',
    isTestnet: true
  }
}

// Get active network based on configuration
const getActiveNetwork = () => {
  const networkType = USE_POLYGON ? 'polygon' : 'chz'
  const networkSuffix = USE_TESTNET ? '_testnet' : '_mainnet'
  const networkKey = (networkType + networkSuffix) as keyof typeof NETWORKS
  return NETWORKS[networkKey]
}

const ACTIVE_NETWORK = getActiveNetwork()

// Thirdweb Configuration
export const thirdwebConfig = {
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'your-thirdweb-client-id',
  secretKey: process.env.THIRDWEB_SECRET_KEY || 'your-thirdweb-secret-key',
  
  // Supported chains for Thirdweb
  supportedChains: [
    ChainId.Mainnet,        // Ethereum
    ChainId.Polygon,        // Polygon
    // CHZ Chain será adicionado customizado
  ],
  
  // Custom Active Chain configuration (Dynamic based on environment)
  activeChain: {
    chainId: ACTIVE_NETWORK.chainId,
    name: ACTIVE_NETWORK.name,
    nativeCurrency: {
      name: ACTIVE_NETWORK.currency,
      symbol: ACTIVE_NETWORK.currency,
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [ACTIVE_NETWORK.rpcUrl],
      },
      public: {
        http: [ACTIVE_NETWORK.rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: ACTIVE_NETWORK.name + ' Explorer',
        url: ACTIVE_NETWORK.explorerUrl,
      },
    },
  },
  
  // NFT Contract configurations (Dynamic based on environment and network)
  contracts: {
    // ERC-721 Drop contract for unique NFTs
    nftDrop: {
      address: USE_TESTNET 
        ? (USE_POLYGON 
            ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET || ''
            : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ_TESTNET || ''
          )
        : (USE_POLYGON 
            ? process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON || ''
            : process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ || ''
          ),
      chainId: ACTIVE_NETWORK.chainId,
    },
    
    // ERC-1155 Edition contract for limited editions
    nftEdition: {
      address: USE_TESTNET 
        ? (USE_POLYGON 
            ? process.env.NEXT_PUBLIC_NFT_EDITION_CONTRACT_POLYGON_TESTNET || ''
            : process.env.NEXT_PUBLIC_NFT_EDITION_CONTRACT_CHZ_TESTNET || ''
          )
        : (USE_POLYGON 
            ? process.env.NEXT_PUBLIC_NFT_EDITION_CONTRACT_POLYGON || ''
            : process.env.NEXT_PUBLIC_NFT_EDITION_CONTRACT_CHZ || ''
          ),
      chainId: ACTIVE_NETWORK.chainId,
    },
    
    // Marketplace contract (optional - will be implemented later)
    marketplace: {
      address: '', // Deixar vazio por enquanto - será implementado no Milestone 3
      chainId: ACTIVE_NETWORK.chainId,
    }
  }
};

// Simplified configuration (only Thirdweb)
export const web3Config = {
  thirdweb: thirdwebConfig,
  defaultChain: ACTIVE_NETWORK.chainId,
  activeNetwork: ACTIVE_NETWORK,
  isTestnet: USE_TESTNET,
  usePolygon: USE_POLYGON,
  networks: NETWORKS,
  supportedNetworks: ['CHZ', 'Polygon'],
  availableTestnets: ['chz_testnet', 'polygon_testnet'],
};

// Validation function for supported networks (CHZ + Polygon only)
export const isValidChainId = (chainId: number): boolean => {
  const supportedChainIds = [88888, 88882, 137, 80002] // CHZ + Polygon networks
  return supportedChainIds.includes(chainId)
}; 