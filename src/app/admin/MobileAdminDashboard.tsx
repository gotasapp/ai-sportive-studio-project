import React from 'react';
import Header from '@/components/Header';
// Importe o menu/sidebar Oreo usado no marketplace mobile
// import OreoSidebar from '@/components/marketplace/OreoSidebar'; // adjust the path if necessary
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import MobileBottomNav from '@/components/MobileBottomNav';
import Link from 'next/link';
import { Shirt, Award, Building2, Shield, BarChart3, Users, Settings } from 'lucide-react';

// Adapt props as necessary to receive data/handlers from desktop dashboard
export default function MobileAdminDashboard(props: any) {
  // Example of expected props: metrics, logs, handlers, etc.
  // const { stats, logs, onSearch, searchTerm, ... } = props;

  // Navigation array (same as admin layout, without Dashboard)
  const navigation = [
    { name: 'Jerseys', href: '/admin/jerseys', icon: Shirt },
    { name: 'Stadiums', href: '/admin/stadiums', icon: Building2 },
    { name: 'Badges', href: '/admin/badges', icon: Award },
    { name: 'Moderation', href: '/admin/moderation', icon: Shield },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col overflow-x-hidden">
      <Header />
      {/* Navegação principal mobile */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="no-underline">
              <button className="w-full flex flex-col items-center justify-center rounded-xl p-4 bg-[#18141f] text-white shadow hover:bg-[#FF0052]/80 transition-all">
                <item.icon className="h-7 w-7 mb-1 text-[#FF0052]" />
                <span className="text-sm font-semibold">{item.name}</span>
              </button>
            </Link>
          ))}
        </div>
        {/* Cards de estatísticas/overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Exemplo de cards de métricas */}
          <div className="rounded-xl p-3 bg-[#18141f] text-center text-white">
            <div className="text-xs text-white/60">Users</div>
            <div className="text-xl font-bold">--</div>
          </div>
          <div className="rounded-xl p-3 bg-[#18141f] text-center text-white">
            <div className="text-xs text-white/60">Sales</div>
            <div className="text-xl font-bold">--</div>
          </div>
          {/* ...adicione mais cards conforme necessário */}
        </div>
        {/* Filtros e busca mobile */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <Input
              type="text"
              placeholder="Search..."
              // value={searchTerm}
              // onChange={e => onSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FF0052] transition-all text-sm bg-[#18141f]"
            />
          </div>
          {/* Adicione botões de filtro, se necessário */}
        </div>
        {/* Cards/listas de métricas, logs, etc. */}
        <div className="flex flex-col gap-3">
          {/* Exemplo de card de log/atividade */}
          <div className="rounded-lg p-3 bg-[#18141f] text-white">
            <div className="text-xs text-white/60 mb-1">Recent Activity</div>
            <div className="text-sm">--</div>
          </div>
          {/* ...adicione mais cards/listas conforme necessário */}
        </div>
      </div>
      {/* Oreo-style mobile nav */}
      <MobileBottomNav />
    </div>
  );
} 