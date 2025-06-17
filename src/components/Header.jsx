'use client'

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'

export default function Header() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="border-b border-cyan-800/30 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">AI</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Sports NFT Generator
          </h1>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            Generate
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            Marketplace
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            My NFTs
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Network Info */}
          {isConnected && caipNetwork && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-cyan-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-300">{caipNetwork.name}</span>
            </div>
          )}

          {/* Connection Status */}
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  {formatAddress(address)}
                </span>
              </div>
              <button
                onClick={() => open({ view: 'Account' })}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg hover:shadow-cyan-500/25"
              >
                Account
              </button>
            </div>
          ) : (
            <button
              onClick={() => open({ view: 'Connect' })}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg hover:shadow-cyan-500/25"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
} 