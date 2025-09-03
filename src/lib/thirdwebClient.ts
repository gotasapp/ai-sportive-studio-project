// Configurações do Thirdweb SDK v4 (para operações de backend)
import { createThirdwebClient } from 'thirdweb';
import { polygon, polygonAmoy } from 'thirdweb/chains';
import { defineChain } from 'thirdweb/chains';
import { createWallet, inAppWallet } from 'thirdweb/wallets';

// Criar o cliente Thirdweb
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
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

// Configurar wallets suportadas
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