'use client';

import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";
import { polygon, mainnet } from "thirdweb/chains";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// 1. Criar o cliente Thirdweb usando a variável de ambiente
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Define custom CHZ chains
const chzMainnet = defineChain({
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

const chzTestnet = defineChain({
  id: 88882,
  name: 'CHZ Spicy Testnet',
  nativeCurrency: {
    name: 'Chiliz',
    symbol: 'CHZ',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://spicy-rpc.chiliz.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'CHZ Spicy Explorer',
      url: 'https://spicy.chzscan.com',
    },
  },
});

const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polygon Amoy Explorer',
      url: 'https://amoy.polygonscan.com',
    },
  },
});

// All supported chains
const supportedChains = [
  mainnet,
  polygon,
  chzMainnet,
  chzTestnet,
  polygonAmoy
];

// 2. Definir as carteiras, priorizando as tradicionais
const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
  inAppWallet({
    auth: {
      options: ["google", "discord", "email", "x"],
    },
  }),
];

export default function LoginPage() {
  const account = useActiveAccount();
  const router = useRouter();

  // 3. Redirecionar se o usuário já estiver logado e autenticado
  useEffect(() => {
    if (account) {
      router.push('/');
    }
  }, [account, router]);

  // Don't render the login page if user is already logged in
  // This prevents a flash of the login page before redirect
  if (account) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-gray-300 mb-8">
          Connect your wallet or use a social account to continue.
        </p>
        
        <ConnectButton
          client={client}
          wallets={wallets}
          chains={supportedChains}
          chain={chzMainnet}
          auth={{
            // Funções de placeholder para ativar o fluxo SIWE
            // A lógica de backend pode ser implementada aqui no futuro
            doLogin: async () => {
              console.log("doLogin - Simulating backend login");
            },
            getLoginPayload: async ({ address, chainId }) => {
              console.log("getLoginPayload - Simulating payload generation for:", address);
              const now = new Date();
              return {
                domain: "example.com",
                address: address,
                statement: "Please sign in to continue.",
                version: "1",
                chainId: chainId,
                nonce: "12345678",
                issued_at: now.toISOString(),
                expiration_time: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
                invalid_before: now.toISOString(),
              };
            },
            isLoggedIn: async () => {
              // Esta verificação agora é necessária. A lógica na página principal será reforçada.
              return false; 
            },
            doLogout: async () => {
                console.log("doLogout - Simulating backend logout");
            }
          }}
          theme="dark"
          connectModal={{
            size: "wide",
            title: "Choose your Login",
          }}
        />

        <p className="text-xs text-gray-500 mt-4 max-w-xs mx-auto">
          When using social login (Google, Email, etc.), a new smart wallet will be securely created for you.
        </p>
      </div>
    </div>
  );
} 