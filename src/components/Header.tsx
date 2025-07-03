'use client'

import Link from 'next/link';
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { polygon, mainnet } from "thirdweb/chains";
import { Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAdmin, isAdminAsync } from '@/lib/admin-config';



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
  const wallet = useActiveWallet();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);



  // Verificar se o usuário é admin (incluindo verificação async para InApp wallets)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!account) {
        setUserIsAdmin(false);
        setAdminCheckLoading(false);
        // Limpar cache quando desconectar
        localStorage.removeItem('admin_status_cache');
        return;
      }

      const accountKey = account.address || 'unknown';
      const cacheKey = `admin_status_${accountKey}`;
      
      // Verificar cache primeiro (para evitar re-verificações desnecessárias)
      const cachedStatus = localStorage.getItem(cacheKey);
      if (cachedStatus !== null) {
        const isAdminCached = cachedStatus === 'true';
        setUserIsAdmin(isAdminCached);
        setAdminCheckLoading(false);
        
        // Ainda faz verificação em background para atualizar cache se necessário
        setTimeout(() => {
          performAdminCheck(accountKey, cacheKey);
        }, 100);
        
        return;
      }

      // Se não há cache, faz verificação completa
      setAdminCheckLoading(true);
      await performAdminCheck(accountKey, cacheKey);
    };

    const performAdminCheck = async (accountKey: string, cacheKey: string) => {
      try {
        // Primeiro, tenta verificação rápida (wallet address)
        const quickCheck = isAdmin(account);
        if (quickCheck) {
          setUserIsAdmin(true);
          localStorage.setItem(cacheKey, 'true');
          setAdminCheckLoading(false);
          return;
        }

        // Para InApp wallets, faz verificação async do email
        const asyncCheck = await isAdminAsync(account, wallet);
        setUserIsAdmin(asyncCheck);
        localStorage.setItem(cacheKey, asyncCheck ? 'true' : 'false');
      } catch (error) {
        console.error('Erro ao verificar status de admin no header:', error);
        setUserIsAdmin(false);
        localStorage.setItem(cacheKey, 'false');
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [account, wallet]);



  return (
    <header className="w-full border-b border-cyan-800/30 bg-black">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src="https://res.cloudinary.com/dpilz4p6g/image/upload/v1750634725/th_24_vaq5es.jpg" 
            alt="Chiliz Fan NFT Logo" 
            className="w-8 h-8 rounded-lg object-cover"
          />
          <h1 className="text-sm md:text-xl font-system font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent" style={{ fontWeight: 500 }}>
            Chiliz Fan NFT
          </h1>
        </div>

        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="/" className="font-display text-nav-purple hover:opacity-80 transition-opacity" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '40px' }}>
            Jerseys
          </Link>
          <Link href="/stadiums" className="font-display text-nav-purple hover:opacity-80 transition-opacity" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '40px' }}>
            Stadiums
          </Link>
          <Link href="/badges" className="font-display text-nav-purple hover:opacity-80 transition-opacity" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '40px' }}>
            Badges
          </Link>
          {userIsAdmin && (
            <Link href="/vision-test" className="font-display text-nav-purple hover:opacity-80 transition-opacity" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '40px' }}>
              Vision Test
            </Link>
          )}
          <Link href="/marketplace" className="font-display text-nav-purple hover:opacity-80 transition-opacity" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '40px' }}>
            Marketplace
          </Link>
          
          <a href="#" className="font-display text-nav-purple hover:opacity-80 transition-opacity" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '40px' }}>
            My NFTs
          </a>
          
          {/* Admin Panel - Only visible to admin users */}
          {userIsAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center space-x-2 text-accent hover:text-accent/80 transition-colors border border-accent/30 px-3 py-1 rounded-lg hover:border-accent/50 hover:bg-accent/10"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          )}
          
          {/* Loading indicator for admin check */}
          {adminCheckLoading && account && (
            <div className="flex items-center space-x-2 text-accent/50">
              <div className="w-3 h-3 border border-accent/50 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Checking admin...</span>
            </div>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <ConnectButton
            client={client}
            chains={supportedChains}
            chain={chzMainnet}
            theme="dark"
          />
        </div>
      </div>
    </header>
  );
} 