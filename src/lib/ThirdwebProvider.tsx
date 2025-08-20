'use client'

import { ReactNode } from 'react';
import { ThirdwebProvider as Provider } from 'thirdweb/react';

export function ThirdwebProvider({ children }: { children: ReactNode }) {
  return (
    <Provider>
      {children}
    </Provider>
  );
}

// Export configurations to use in components
import { createThirdwebClient } from 'thirdweb';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { defineChain } from 'thirdweb/chains';
import { createWallet, inAppWallet } from 'thirdweb/wallets';

  // Check if clientId exists
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!clientId) {
  throw new Error('NEXT_PUBLIC_THIRDWEB_CLIENT_ID is required');
}

  // Create Thirdweb client
export const client = createThirdwebClient({
  clientId,
});

export const chzMainnet = defineChain({
  id: 88888,
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
  },
  blockExplorers: {
    default: {
      name: 'ChilizScan',
      url: 'https://scan.chiliz.com',
    },
  },
});

export const supportedChains = [polygon, polygonAmoy, chzMainnet];

  // Configure supported wallets
export const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
  inAppWallet({
    auth: {
      options: ["google", "discord", "email", "x", "apple"],
    },
  }),
]; 