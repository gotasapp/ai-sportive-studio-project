'use client'

import { ThirdwebProvider as Thirdweb, metamaskWallet, coinbaseWallet } from '@thirdweb-dev/react';
import { ChainId, Ethereum, Polygon } from '@thirdweb-dev/chains';
import { ReactNode } from 'react';
import { thirdwebConfig } from './config';

interface ThirdwebProviderProps {
  children: ReactNode;
}

// Configure CHZ Chain
const chzChain = {
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
  testnet: false,
};

export function ThirdwebProvider({ children }: ThirdwebProviderProps) {
  return (
    <Thirdweb
      clientId={thirdwebConfig.clientId}
      activeChain={chzChain}
      supportedChains={[
        chzChain,
        Ethereum,
        Polygon,
      ]}
      supportedWallets={[
        metamaskWallet(),
        coinbaseWallet(),
      ]}
      dAppMeta={{
        name: 'AI Sports NFT Generator',
        description: 'Generate and mint sports NFTs with AI',
        logoUrl: 'https://ai-sports-nft.vercel.app/icon.png',
        url: 'https://ai-sports-nft.vercel.app',
        isDarkMode: true,
      }}
    >
      {children}
    </Thirdweb>
  );
} 