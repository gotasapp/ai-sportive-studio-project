'use client'

import Link from 'next/link';
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { Shield, Menu, X } from 'lucide-react';
import { CgMenuOreos } from 'react-icons/cg';
import { useState, useEffect } from 'react';
import { isAdmin, isAdminAsync } from '@/lib/admin-config';
import NavLink from './ui/NavLink';
import { client, supportedChains, wallets, chzMainnet } from '@/lib/ThirdwebProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccountName } from '@/components/ui/account-name';
import { CustomConnectButton } from '@/components/ui/custom-connect-button';
import { HeaderLogo } from '@/components/ui/Logo';

export default function Header() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const isMobile = useIsMobile();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-mobile-menu]') && !target.closest('[data-mobile-menu-toggle]')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const NavItems = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <div className={cn(
      mobile 
        ? "flex flex-col space-y-4 w-full" 
        : "flex items-center space-x-6"
    )}>
      <NavLink 
        href="/jerseys" 
        className={cn("uppercase", mobile && "w-full text-center py-2")}
        onClick={onItemClick}
      >
        Jerseys
      </NavLink>
      <NavLink 
        href="/stadiums" 
        className={cn("uppercase", mobile && "w-full text-center py-2")}
        onClick={onItemClick}
      >
        Stadiums
      </NavLink>
      <NavLink 
        href="/badges" 
        className={cn("uppercase", mobile && "w-full text-center py-2")}
        onClick={onItemClick}
      >
        Badges
      </NavLink>
      <NavLink 
        href="/marketplace" 
        className={cn("uppercase", mobile && "w-full text-center py-2")}
        onClick={onItemClick}
      >
        Marketplace
      </NavLink>
      
      <NavLink 
        href="/launchpad" 
        className={cn("uppercase", mobile && "w-full text-center py-2")}
        onClick={onItemClick}
      >
        Launchpad
      </NavLink>
      
      <NavLink 
        href="/profile" 
        className={cn("uppercase", mobile && "w-full text-center py-2")}
        onClick={onItemClick}
      >
        Profile
      </NavLink>
      
      {/* Admin Panel - Only visible to admin users */}
      {userIsAdmin && (
        <Link 
          href="/admin" 
          className={cn(
            "flex items-center justify-center space-x-2 text-accent hover:text-accent/80 transition-colors border border-accent/30 px-3 py-1 rounded-lg hover:border-accent/50 hover:bg-accent/10 uppercase",
            mobile && "w-full"
          )}
          onClick={onItemClick}
        >
          <Shield className="w-4 h-4" />
          <span>Admin Panel</span>
        </Link>
      )}
      
      {/* Loading indicator for admin check */}
      {adminCheckLoading && account && (
        <div className={cn(
          "flex items-center space-x-2 text-accent/50",
          mobile && "justify-center w-full py-2"
        )}>
          <div className="w-3 h-3 border border-accent/50 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Checking admin...</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <header className="w-full border-b border-[#333333] bg-transparent relative z-50">
        <div className={cn(
          "w-full px-3 md:px-6 flex justify-between items-center",
          isMobile ? "py-2" : "py-3"
        )}>
          {/* Logo */}
          <HeaderLogo />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <NavItems />
          </nav>

          {/* Mobile Menu Button & Connect Button */}
          <div className="flex items-center space-x-2">
            {/* Connect Button */}
            <div className={cn(isMobile && "scale-90 origin-right")}>
              <CustomConnectButton 
                client={client}
                wallets={wallets}
                chains={supportedChains}
                theme="dark"
              />
            </div>

            {/* Mobile Menu Toggle */}
            {isMobile && (
              <Button
                data-mobile-menu-toggle
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className={cn(
                  "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 p-2",
                  mobileMenuOpen && "bg-[#FF0052]/20 text-[#FF0052]"
                )}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <CgMenuOreos className="h-6 w-6" color="white" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobile && (
          <div 
            data-mobile-menu
            className={cn(
              "absolute top-full left-0 right-0 bg-gradient-to-b from-[#030303] to-[#0b0518] border-b border-[#333333] shadow-lg transition-all duration-300 ease-in-out lg:hidden",
              mobileMenuOpen 
                ? "opacity-100 visible translate-y-0" 
                : "opacity-0 invisible -translate-y-2"
            )}
          >
            <div className="px-4 py-6">
              <NavItems 
                mobile={true} 
                onItemClick={() => setMobileMenuOpen(false)} 
              />
            </div>
          </div>
        )}
      </header>
    </>
  );
} 