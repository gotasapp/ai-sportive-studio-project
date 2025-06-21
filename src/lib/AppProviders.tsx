'use client'

import { ReactNode } from 'react'
import { ThirdwebProvider } from './ThirdwebProvider'

interface AppProvidersProps {
  children: ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  )
} 