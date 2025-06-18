import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon, polygonAmoy } from '@reown/appkit/networks'
import { defineChain } from '@reown/appkit/networks'

// Get projectId from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined')
}

// Define CHZ Chain (Chiliz)
const chzChain = defineChain({
  id: 88888,
  caipNetworkId: 'eip155:88888',
  chainNamespace: 'eip155',
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
})

// Supported networks
export const networks = [chzChain, mainnet, polygon, polygonAmoy, arbitrum]

// Set up the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

// Metadata for the app
export const metadata = {
  name: 'AI Sports NFT Generator',
  description: 'Generate and mint sports NFTs with AI on Chiliz Chain',
  url: 'https://ai-sports-nft.vercel.app',
  icons: ['https://ai-sports-nft.vercel.app/icon.png']
} 