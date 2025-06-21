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
  LogOut
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
    description: 'Jersey Generation Config'
  },
  {
    name: 'Logos & Badges',
    href: '/admin/logos',
    icon: Trophy,
    description: 'Logo Generation Config'
  },
  {
    name: 'Stadiums',
    href: '/admin/stadiums',
    icon: Building2,
    description: 'Stadium Generation Config'
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
    name: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
    description: 'Content Moderation'
  },
  {
    name: 'Logs',
    href: '/admin/logs',
    icon: FileText,
    description: 'System Logs & Audit'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System Configuration'
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#000518] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#000720] via-[#000518] to-[#000A29] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,#000720_0%,transparent_40%),radial-gradient(ellipse_at_top_right,#000924_0%,transparent_40%),radial-gradient(ellipse_at_bottom_left,#000720_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,#000A29_0%,transparent_40%)] pointer-events-none" />
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex h-full flex-col cyber-card border-r border-cyan-500/30">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-cyan-500/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold neon-text">Admin Panel</h1>
                <p className="text-xs text-cyan-400/70">AI Sports NFT</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-cyan-400 hover:text-cyan-300"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="px-6 py-4">
            <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
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
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cyber-glow' 
                      : 'text-gray-300 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border hover:border-cyan-500/20'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors
                    ${isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'}
                  `} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-cyan-500/70">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="h-px bg-cyan-500/30 mx-4" />

          {/* Footer */}
          <div className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Admin User</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-400 p-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-cyan-500/30 cyber-card px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-cyan-400 hover:text-cyan-300"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="h-6 w-px bg-cyan-500/30 lg:hidden" />

          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-white">
                {navigation.find(item => item.href === pathname)?.name || 'Admin Panel'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                v1.0.0
              </Badge>
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
} 