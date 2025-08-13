'use client'

import { ReactNode } from 'react'
import { ThirdwebProvider } from './ThirdwebProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

interface AppProvidersProps {
  children: ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        {children}
        <Toaster 
          richColors 
          position="top-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: '#1f1f1f',
              border: '1px solid #333',
              color: '#fff',
            },
          }}
        />
      </ThirdwebProvider>
    </QueryClientProvider>
  )
} 