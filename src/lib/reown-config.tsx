'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { defineChain } from 'viem'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// 2. Create a metadata object
const metadata = {
  name: 'AI Sports NFT Generator',
  description: 'Generate and mint sports NFTs with AI',
        url: process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://localhost:3000', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Define CHZ Chain (Chiliz)
const chzChain = defineChain({
  id: 88888,
  name: 'Chiliz Chain',
  network: 'chiliz',
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
})

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [chzChain],
  projectId,
  ssr: true
})

// 5. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [chzChain],
  defaultNetwork: chzChain,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export function ReownProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 