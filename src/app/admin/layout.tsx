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

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-72 lg:block">
        <div className="flex h-full flex-col bg-[#050505] border-r border-neutral-800">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-neutral-300" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-secondary">Admin Panel</h1>
                <p className="text-xs text-neutral-500">CHZ Fan Studio</p>
              </div>
            </div>
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
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors
                    ${isActive ? 'text-accent' : 'text-neutral-400 group-hover:text-neutral-300'}
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

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-secondary">Admin Panel</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-red-500"
                title="Voltar à página inicial"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#050505]/98 backdrop-blur-xl border-l border-neutral-800 animate-in slide-in-from-right duration-300">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-secondary">Menu</h2>
                    <p className="text-xs text-neutral-500">Admin Navigation</p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-white"
                  onClick={closeMobileMenu}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Status Badge */}
              <div className="px-6 py-4">
                <Badge className="w-full justify-center bg-green-500/10 text-green-400 border-green-500/30">
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
                      onClick={closeMobileMenu}
                      className={`
                        group flex items-center px-4 py-4 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-accent/10 text-accent border border-accent/20' 
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                        }
                      `}
                    >
                      <Icon className={`
                        mr-4 h-6 w-6 flex-shrink-0 transition-colors
                        ${isActive ? 'text-accent' : 'text-neutral-400 group-hover:text-neutral-300'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-neutral-500 group-hover:text-neutral-400 mt-1">
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
              <div className="p-6">
                <div className="flex items-center justify-between text-sm text-neutral-400">
                  <span>Admin User</span>
                  <Link href="/" onClick={closeMobileMenu}>
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
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-black/95 backdrop-blur-sm border-t border-neutral-800">
          <div className="flex justify-around items-center py-2">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 min-w-[60px] transition-all duration-200 ${
                    isActive 
                      ? 'text-accent' 
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 transition-colors ${
                    isActive ? 'text-accent' : 'text-neutral-400'
                  }`} />
                  <span className="text-xs font-medium">{item.name}</span>
                  {isActive && (
                    <div className="w-1 h-1 bg-accent rounded-full mt-1 animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="min-h-screen pb-20 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  )
} 