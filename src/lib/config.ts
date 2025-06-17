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

// WalletConnect Configuration
export const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id-here',
  chains: [
    {
      chainId: 88888, // CHZ Chain (Chiliz)
      name: 'Chiliz Chain',
      currency: 'CHZ',
      explorerUrl: 'https://scan.chiliz.com',
      rpcUrl: 'https://rpc.ankr.com/chiliz'
    },
    {
      chainId: 1, // Ethereum Mainnet
      name: 'Ethereum',
      currency: 'ETH',
      explorerUrl: 'https://etherscan.io',
      rpcUrl: 'https://eth.llamarpc.com'
    },
    {
      chainId: 137, // Polygon
      name: 'Polygon',
      currency: 'MATIC',
      explorerUrl: 'https://polygonscan.com',
      rpcUrl: 'https://polygon.llamarpc.com'
    }
  ],
  metadata: {
    name: 'AI Sports NFT Generator',
    description: 'Generate and mint sports NFTs with AI',
    url: 'https://ai-sports-nft.vercel.app',
    icons: ['https://ai-sports-nft.vercel.app/icon.png']
  }
};

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
  
  // Custom CHZ Chain configuration
  chzChain: {
    chainId: 88888,
    name: 'Chiliz Chain',
    nativeCurrency: {
      name: 'Chiliz',
      symbol: 'CHZ',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.ankr.com/chiliz'],
      },
      public: {
        http: ['https://rpc.ankr.com/chiliz'],
      },
    },
    blockExplorers: {
      default: {
        name: 'ChilizScan',
        url: 'https://scan.chiliz.com',
      },
    },
  },
  
  // NFT Contract configurations
  contracts: {
    // ERC-721 Drop contract for unique NFTs
    nftDrop: {
      address: process.env.NEXT_PUBLIC_NFT_DROP_CONTRACT || '',
      chainId: 88888, // CHZ Chain
    },
    
    // ERC-1155 Edition contract for limited editions
    nftEdition: {
      address: process.env.NEXT_PUBLIC_NFT_EDITION_CONTRACT || '',
      chainId: 88888, // CHZ Chain
    },
    
    // Marketplace contract
    marketplace: {
      address: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || '',
      chainId: 88888, // CHZ Chain
    }
  }
};

// Combined configuration
export const web3Config = {
  walletConnect: walletConnectConfig,
  thirdweb: thirdwebConfig,
  defaultChain: 88888, // CHZ Chain as default
}; 