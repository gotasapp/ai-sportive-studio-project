'use client'

import Link from 'next/link';
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { polygon, mainnet } from "thirdweb/chains";
import { Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAdmin, isAdminAsync } from '@/lib/admin-config';
import NavLink from './ui/NavLink';




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
      console.log('---');
      console.time('Admin Check'); // Inicia o cronômetro
      console.log('🔍 Iniciando verificação de status de admin...');

      if (!account) {
        setUserIsAdmin(false);
        setAdminCheckLoading(false);
        localStorage.removeItem('admin_status_cache');
        console.log('✅ Verificação concluída: Usuário não conectado.');
        console.timeEnd('Admin Check'); // Para o cronômetro
        console.log('---');
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
        
        console.log('✅ Verificação concluída: Cache encontrado.');
        console.timeEnd('Admin Check'); // Para o cronômetro
        console.log('---');
        return;
      }

      // Se não há cache, faz verificação completa
      setAdminCheckLoading(true);
      await performAdminCheck(accountKey, cacheKey);
      console.log('✅ Verificação completa via performAdminCheck concluída.');
      console.timeEnd('Admin Check'); // Para o cronômetro
      console.log('---');
    };

    const performAdminCheck = async (accountKey: string, cacheKey: string) => {
      try {
        // Primeiro, tenta verificação rápida (wallet address)
        const quickCheck = isAdmin(account);
        if (quickCheck) {
          setUserIsAdmin(true);
          localStorage.setItem(cacheKey, 'true');
          setAdminCheckLoading(false);
          console.log('✅ Verificação rápida concluída: Usuário é admin.');
          return;
        }

        // Para InApp wallets, faz verificação async do email
        console.log('⏳ Tentando verificação assíncrona (pode ser lento)...');
        const asyncCheck = await isAdminAsync(account, wallet);
        setUserIsAdmin(asyncCheck);
        localStorage.setItem(cacheKey, asyncCheck ? 'true' : 'false');
        console.log(`👍 Verificação assíncrona retornou: ${asyncCheck}`);
      } catch (error) {
        console.error('❌ Erro ao verificar status de admin no header:', error);
        setUserIsAdmin(false);
        localStorage.setItem(cacheKey, 'false');
        console.log('❌ Verificação assíncrona falhou.');
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [account, wallet]);



  return (
    <header className="w-full border-b border-[#333333] bg-transparent relative z-50">
      <div className="w-full px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src="https://res.cloudinary.com/dpilz4p6g/image/upload/v1750634725/th_24_vaq5es.jpg" 
            alt="Chiliz Fan NFT Logo" 
            className="w-8 h-8 rounded-lg object-cover"
          />
          <h1 className="text-sm md:text-xl font-system font-medium" style={{ fontWeight: 500, color: '#ffffff' }}>
            chiliz fan nft
          </h1>
        </div>

        <nav className="hidden lg:flex items-center space-x-6">
          <NavLink href="/">Jerseys</NavLink>
          <NavLink href="/stadiums">Stadiums</NavLink>
          <NavLink href="/badges">Badges</NavLink>
          <NavLink href="/marketplace">Marketplace</NavLink>
          
          <a href="#" className="text-secondary hover:text-white transition-colors duration-200 text-sm font-medium">
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