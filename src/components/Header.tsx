'use client'

import Link from 'next/link';
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAdmin, isAdminAsync } from '@/lib/admin-config';
import NavLink from './ui/NavLink';
import { client, supportedChains, wallets, chzMainnet } from '@/lib/ThirdwebProvider';

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
            src="https://res.cloudinary.com/dpilz4p6g/image/upload/v1751896717/Chiliz_Logo_p07cwf.png" 
            alt="Chiliz Logo" 
            className="w-auto h-12 object-contain ml-6"
          />
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
            wallets={wallets}
            chains={supportedChains}
            theme="dark"
          />
        </div>
      </div>
    </header>
  );
} 