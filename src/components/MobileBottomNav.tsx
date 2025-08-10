'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { Shirt, Building2, Trophy, Shield, User, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAdmin, isAdminAsync } from '@/lib/admin-config';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const { scrollDirection, isAtTop } = useScrollDirection();
  
  // Verificar se o usuário é admin (incluindo verificação async para InApp wallets)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!account) {
        setUserIsAdmin(false);
        return;
      }

      try {
        // Primeiro, tenta verificação rápida (wallet address)
        const quickCheck = isAdmin(account);
        if (quickCheck) {
          setUserIsAdmin(true);
          return;
        }

        // Para InApp wallets, faz verificação async do email
        const asyncCheck = await isAdminAsync(account, wallet);
        setUserIsAdmin(asyncCheck);
      } catch (error) {
        console.error('Erro ao verificar status de admin na nav móvel:', error);
        setUserIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [account, wallet]);
  
  // Don't show on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Determina se deve mostrar a barra (aparece quando rola para cima ou no topo da página)
  const shouldShow = scrollDirection === 'up' || isAtTop;

  const navItems = [
    {
      href: '/',
      icon: Shirt,
      label: 'Jersey',
      isActive: pathname === '/'
    },
    {
      href: '/stadiums',
      icon: Building2,
      label: 'Stadium',
      isActive: pathname === '/stadiums'
    },
    {
      href: '#',
      icon: Trophy,
      label: 'Badge',
      isActive: false
    },
    {
      href: '/marketplace',
      icon: ShoppingBag,
      label: 'Market',
      isActive: pathname === '/marketplace' || pathname.startsWith('/marketplace/')
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      isActive: pathname === '/profile' || pathname.startsWith('/profile/')
    }
  ];

  // Add admin item if user is admin
  if (userIsAdmin) {
    navItems.push({
      href: '/admin',
      icon: Shield,
      label: 'Admin',
      isActive: pathname.startsWith('/admin')
    });
  }

  return (
    <div className={`
      lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 mobile-nav-autohide
      ${shouldShow ? 'visible' : 'hidden'}
    `}>
      {/* Modern Pill-shaped Navigation */}
      <div className="bg-[#181828] backdrop-blur-lg rounded-full px-4 py-3 border border-[#FDFDFD]/10 shadow-2xl">
        <div className="flex items-center justify-center space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  relative flex flex-col items-center space-y-1 px-2 py-2 rounded-xl transition-all duration-300 ease-out
                  ${isActive 
                    ? 'text-white' 
                    : item.label === 'Admin' 
                      ? 'text-[#FDFDFD]/60 hover:text-[#A20131] hover:scale-110'
                      : 'text-[#FDFDFD]/60 hover:text-white hover:scale-110'
                  }
                `}
              >
                {/* Active Background Circle */}
                {isActive && (
                  <div className="absolute inset-0 bg-[#A20131] rounded-xl opacity-90 animate-pulse" />
                )}
                
                {/* Icon */}
                <Icon className={`
                  relative z-10 w-5 h-5 transition-all duration-300
                  ${isActive ? 'scale-110' : ''}
                `} />
                
                {/* Label */}
                <span className={`
                  relative z-10 text-xs font-medium transition-all duration-300
                  ${isActive ? 'font-bold' : ''}
                `}>
                  {item.label}
                </span>
                
                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-ping" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 