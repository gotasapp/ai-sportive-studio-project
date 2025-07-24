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
  LogOut,
  Award,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/Logo'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'

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
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configuration'
  }
]

// Principais páginas para navegação bottom mobile
const bottomNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Jerseys',
    href: '/admin/jerseys',
    icon: Shirt
  },
  {
    name: 'Stadiums',
    href: '/admin/stadiums',
    icon: Building2
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [lightMode, setLightMode] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  // Função para alternar o modo claro/escuro
  const handleThemeSwitch = () => {
    setLightMode((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', !next)
        document.documentElement.classList.toggle('light', next)
      }
      return next
    })
  }

  // Avatares mock para invitations

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* --- Desktop Sidebar (lg and up) --- */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex grow flex-col justify-between overflow-y-auto border-r border-neutral-800 px-6 py-6 rounded-r-3xl shadow-xl" style={{ background: 'rgba(20, 16, 30, 0.4)' }}>
          {/* Topo: Logo */}
          <div>
            <div className="flex items-center justify-center mb-6">
              <Logo width={140} height={40} />
            </div>
            {/* Navegação principal */}
            <nav className="flex flex-col gap-y-2">
              <ul className="flex flex-col gap-y-1 mt-6">
                {navigation.slice(0, 5).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold transition-all duration-150 ${isActive ? 'bg-[#18122B] text-white shadow' : 'text-neutral-400 hover:text-white hover:bg-[#18122B]/60'}`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="text-xs font-semibold leading-6 text-neutral-400 mt-6 mb-2 ml-2">System</div>
              <ul className="flex flex-col gap-y-1">
                {navigation.slice(5).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold transition-all duration-150 ${isActive ? 'bg-[#18122B] text-white shadow' : 'text-neutral-400 hover:text-white hover:bg-[#18122B]/60'}`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          {/* Rodapé: apenas botão Back to App */}
          <div className="flex flex-col gap-2 mt-8">
            <Link
              href="/"
              className="group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-neutral-400 hover:bg-[#18122B]/60 hover:text-white"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Back to App
            </Link>
          </div>
        </div>
      </div>
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 w-full h-16 fixed top-0 bg-black/80 backdrop-blur-sm z-40 border-b border-neutral-800">
        <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-neutral-300" />
            <h1 className="text-base font-semibold text-white">Admin</h1>
        </div>
        <button
          type="button"
          className="-m-2.5 p-2.5 text-neutral-400"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* --- Main Content Area --- */}
      <main className="w-full lg:pl-72 pt-16 lg:pt-0">
        <div className="px-4 py-10 sm:px-6 lg:px-8">
            {children}
        </div>
      </main>

       {/* Mobile Sidebar (off-canvas) */}
      {mobileMenuOpen && (
        <div className="relative z-50 lg:hidden" >
            <div className="fixed inset-0 bg-black/80" />
            <div className="fixed inset-0 flex">
                <div className="relative mr-16 flex w-full max-w-xs flex-1">
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setMobileMenuOpen(false)}>
                        <span className="sr-only">Close sidebar</span>
                        <X className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#050505] px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                       <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-neutral-300" />
                        </div>
                        <div>
                          <h1 className="text-base font-semibold text-white">Admin Panel</h1>
                          <p className="text-xs text-neutral-500">CHZ Fan Studio</p>
                        </div>
                      </div>
                    </div>
                    <nav className="flex flex-1 flex-col">
                       <ul role="list" className="flex flex-1 flex-col gap-y-7">
                          <li>
                            <ul role="list" className="-mx-2 space-y-1">
                              {navigation.map((item) => (
                                <li key={item.name}>
                                  <Link
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                      ${pathname === item.href
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                                      }`
                                    }
                                  >
                                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                          <li className="mt-auto">
                            <Link
                              href="/"
                              onClick={closeMobileMenu}
                              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                            >
                              <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                              Back to App
                            </Link>
                          </li>
                        </ul>
                    </nav>
                  </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
} 