'use client'

import { ThirdwebProvider as Thirdweb, metamaskWallet, coinbaseWallet } from '@thirdweb-dev/react';
import { Polygon, PolygonAmoyTestnet } from '@thirdweb-dev/chains';
import { ReactNode } from 'react';
import { web3Config } from './config';

interface ThirdwebProviderProps {
  children: ReactNode;
}

export function ThirdwebProvider({ children }: ThirdwebProviderProps) {
  // Use active network from config
  const activeChain = web3Config.usePolygon 
    ? (web3Config.isTestnet ? PolygonAmoyTestnet : Polygon)
    : web3Config.activeNetwork;

  return (
    <Thirdweb
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'your-client-id'}
      activeChain={activeChain}
      supportedChains={[
        Polygon,
        PolygonAmoyTestnet,
      ]}
      supportedWallets={[
        metamaskWallet(),
        coinbaseWallet(),
      ]}
      dAppMeta={{
        name: 'AI Sports NFT Generator',
        description: 'Generate and mint sports NFTs with AI',
        logoUrl: '/icon.png',
        url: 'http://localhost:3000',
        isDarkMode: true,
      }}
    >
      {children}
    </Thirdweb>
  );
} 