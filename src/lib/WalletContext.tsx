'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { walletConnectConfig } from './config'

interface WalletContextType {
  provider: EthereumProvider | null
  account: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchChain: (chainId: number) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [provider, setProvider] = useState<EthereumProvider | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Initialize WalletConnect provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        const wcProvider = await EthereumProvider.init({
          projectId: walletConnectConfig.projectId,
          chains: walletConnectConfig.chains.map(chain => chain.chainId),
          showQrModal: true,
          metadata: walletConnectConfig.metadata
        })

        setProvider(wcProvider)

        // Set up event listeners
        wcProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
            setIsConnected(true)
          } else {
            setAccount(null)
            setIsConnected(false)
          }
        })

        wcProvider.on('chainChanged', (chainId: string) => {
          setChainId(parseInt(chainId, 16))
        })

        wcProvider.on('disconnect', () => {
          setAccount(null)
          setChainId(null)
          setIsConnected(false)
        })

        // Check if already connected
        if (wcProvider.accounts.length > 0) {
          setAccount(wcProvider.accounts[0])
          setChainId(wcProvider.chainId)
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Failed to initialize WalletConnect:', error)
      }
    }

    initProvider()
  }, [])

  const connect = async () => {
    if (!provider) return

    try {
      setIsConnecting(true)
      const accounts = await provider.enable()
      
      if (accounts.length > 0) {
        setAccount(accounts[0])
        setChainId(provider.chainId)
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    if (!provider) return

    try {
      await provider.disconnect()
      setAccount(null)
      setChainId(null)
      setIsConnected(false)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const switchChain = async (targetChainId: number) => {
    if (!provider) return

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
    } catch (error: any) {
      // If chain is not added, try to add it
      if (error.code === 4902) {
        const targetChain = walletConnectConfig.chains.find(chain => chain.chainId === targetChainId)
        if (targetChain) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: {
                  name: targetChain.currency,
                  symbol: targetChain.currency,
                  decimals: 18
                },
                rpcUrls: [targetChain.rpcUrl],
                blockExplorerUrls: [targetChain.explorerUrl]
              }]
            })
          } catch (addError) {
            console.error('Failed to add chain:', addError)
          }
        }
      } else {
        console.error('Failed to switch chain:', error)
      }
    }
  }

  const value: WalletContextType = {
    provider,
    account,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchChain
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
} 