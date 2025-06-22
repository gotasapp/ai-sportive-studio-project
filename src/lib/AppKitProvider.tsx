'use client'

import { wagmiAdapter, projectId, networks, metadata } from './appkit-config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit, type AppKitNetwork } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create the AppKit modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as [AppKitNetwork, ...AppKitNetwork[]],
  defaultNetwork: networks[0], // CHZ Chain as default
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: true, // Enable email login
    socials: ['google', 'github', 'apple', 'facebook'], // Enable social logins
    emailShowWallets: true, // Show wallet options after email login
  },
  themeMode: 'dark', // Match our cyberpunk theme
  themeVariables: {
    '--w3m-color-mix': '#00d4ff',
    '--w3m-color-mix-strength': 40,
  }
})

function AppKitProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default AppKitProvider 