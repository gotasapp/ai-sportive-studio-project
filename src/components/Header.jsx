'use client'

import Link from 'next/link';
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { polygon, mainnet } from "thirdweb/chains";
import { Shield } from 'lucide-react';
import { isAdmin } from '@/lib/admin-config';

// Cliente Thirdweb simples
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

export default function Header() {
  const account = useActiveAccount();
  const userIsAdmin = isAdmin(account);
  
  return (
    <header className="w-full border-b border-cyan-800/30 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src="https://res.cloudinary.com/dpilz4p6g/image/upload/v1750634725/th_24_vaq5es.jpg" 
            alt="Chiliz Fan NFT Logo" 
            className="w-8 h-8 rounded-lg object-cover"
          />
          <h1 className="text-sm md:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Chiliz Fan NFT
          </h1>
        </div>

        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="/" className="text-gray-300 hover:text-cyan-400 transition-colors">
            Jerseys
          </Link>
          <Link href="/stadiums" className="text-gray-300 hover:text-cyan-400 transition-colors">
            Stadiums
          </Link>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            Marketplace
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            My NFTs
          </a>
          
          {/* Admin Panel - Only visible to admin users */}
          {userIsAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors border border-orange-400/30 px-3 py-1 rounded-lg hover:border-orange-400/50 hover:bg-orange-400/10"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <ConnectButton
            client={client}
            chains={supportedChains}
            theme="dark"
          />
        </div>
      </div>
    </header>
  );
} 