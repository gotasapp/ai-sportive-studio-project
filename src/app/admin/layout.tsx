'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Shirt, 
  Trophy, 
  Building2,
  BarChart3,
  Settings,
  Users,
  Shield,
  FileText,
  Menu,
  X,
  LogOut,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview & Metrics'
  },
  {
    name: 'Jerseys',
    href: '/admin/jerseys',
    icon: Shirt,
    description: 'Jersey Management'
  },
  {
    name: 'Stadiums',
    href: '/admin/stadiums',
    icon: Building2,
    description: 'Stadium Management'
  },
  {
    name: 'Badges',
    href: '/admin/badges',
    icon: Award,
    description: 'Badge Management'
  },
  {
    name: 'Logos',
    href: '/admin/logos',
    icon: Trophy,
    description: 'Logo Management'
  },
  {
    name: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
    description: 'Content Moderation'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Performance & Insights'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User Management'
  },
  {
    name: 'Logs',
    href: '/admin/logs',
    icon: FileText,
    description: 'System Logs'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configuration'
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex h-full flex-col bg-[#050505] border-r border-neutral-800">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-accent">Admin Panel</h1>
                <p className="text-xs text-accent/70">CHZ Fan Studio</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-neutral-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="px-6 py-4">
            <Badge className="w-full justify-center bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              System Online
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-accent/10 text-accent border border-accent/20' 
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)} // Fecha sidebar no mobile
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors
                    ${isActive ? 'text-accent' : 'text-neutral-400 group-hover:text-white'}
                  `} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-neutral-500 group-hover:text-neutral-400">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="h-px bg-neutral-800 mx-4" />

          {/* Footer */}
          <div className="p-4">
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>Admin User</span>
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-red-500 p-2"
                  title="Voltar à página inicial"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar - Mais simples e rápido */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-800 bg-[#050505]/90 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-white">
                {navigation.find(item => item.href === pathname)?.name || 'Admin Panel'}
              </h2>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Online</span>
              </div>
              
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-800 text-neutral-400 hover:text-white hover:border-accent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Page content - Sem wrapper de autenticação pesado */}
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
} 