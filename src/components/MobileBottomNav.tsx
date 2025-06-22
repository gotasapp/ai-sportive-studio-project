'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveAccount } from "thirdweb/react";
import { Home, Building2, Trophy, Shield } from 'lucide-react';
import { isAdmin } from '@/lib/admin-config';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const account = useActiveAccount();
  const userIsAdmin = isAdmin(account);
  const { scrollDirection, isAtTop } = useScrollDirection();
  
  // Don't show on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Determina se deve mostrar a barra (aparece quando rola para cima ou no topo da página)
  const shouldShow = scrollDirection === 'up' || isAtTop;

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
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
      lg:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-autohide
      ${shouldShow ? 'visible' : 'hidden'}
    `}>
      {/* Glassmorphism Background */}
      <div className="mobile-nav-glass px-4 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/30' 
                    : item.label === 'Admin' 
                      ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                      : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Bottom safe area for devices with home indicator */}
      <div className="mobile-nav-glass h-2" />
    </div>
  );
} 