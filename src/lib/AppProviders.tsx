'use client'

import { ReactNode } from 'react'
import AppKitProvider from './AppKitProvider'
import { ThirdwebProvider } from './ThirdwebProvider'

interface AppProvidersProps {
  children: ReactNode
  cookies?: string | null
}

export default function AppProviders({ children, cookies }: AppProvidersProps) {
  return (
    <AppKitProvider cookies={cookies}>
      <ThirdwebProvider>
        {children}
      </ThirdwebProvider>
    </AppKitProvider>
  )
} 