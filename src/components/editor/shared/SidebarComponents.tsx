'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionItemProps {
  title: string
  icon: React.ComponentType<any>
  isActive?: boolean
  onClick?: () => void
  badge?: string
  iconColor?: string
}

export const SectionItem = ({ 
  title, 
  icon: Icon, 
  isActive = false,
  onClick,
  badge,
  iconColor = 'from-blue-500 to-purple-600'
}: SectionItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      isActive 
        ? "bg-[#2a2a2a] shadow-lg" 
        : "hover:bg-[#242424]"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
      iconColor
    )}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <span className={cn(
      "flex-1 text-left text-sm font-medium",
      isActive ? "text-white" : "text-gray-400"
    )}>
      {title}
    </span>
    {badge && (
      <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
        {badge}
      </Badge>
    )}
    {isActive && <ChevronDown className="h-4 w-4 text-gray-400" />}
  </button>
)

interface SidebarLayoutProps {
  title: string
  subtitle?: string
  icon: React.ComponentType<any>
  iconColor?: string
  children: React.ReactNode
  error?: string | null
  onResetError?: () => void
}

export const SidebarLayout = ({
  title,
  subtitle = "Create your NFT",
  icon: Icon,
  iconColor = "from-[#FF0052] to-[#FF1744]",
  children,
  error,
  onResetError
}: SidebarLayoutProps) => (
  <div className="w-full h-full bg-[#1a1a1a] flex flex-col p-4 overflow-y-auto">
    {/* Logo/Title Section */}
    <div className="mb-6 px-2">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
          iconColor
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          <p className="text-gray-500 text-xs">{subtitle}</p>
        </div>
      </div>
    </div>

    {/* Error Display */}
    {error && (
      <div className="mx-2 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-start justify-between">
          <p className="text-sm text-red-400 flex-1">{error}</p>
          {onResetError && (
            <button
              onClick={onResetError}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )}

    {/* Navigation Menu */}
    <nav className="space-y-1">
      {children}
    </nav>
  </div>
)

// Export a reusable select component with consistent styling
export const StyledSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={cn(
      "w-full px-3 py-2 text-sm rounded-lg bg-[#242424] border border-[#333333]",
      "text-white focus:outline-none focus:border-[#FF0052] transition-colors",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
  >
    <option value="" className="bg-[#1a1a1a]">
      {placeholder}
    </option>
    {options.map((option) => (
      <option key={option.value} value={option.value} className="bg-[#1a1a1a]">
        {option.label}
      </option>
    ))}
  </select>
)

// Export a reusable input component with consistent styling
export const StyledInput = ({
  value,
  onChange,
  placeholder,
  icon: Icon,
  maxLength,
  type = "text",
  className
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ComponentType<any>
  maxLength?: number
  type?: string
  className?: string
}) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(
        "w-full py-2 text-sm rounded-lg bg-[#242424] border border-[#333333]",
        "text-white placeholder-gray-500 focus:outline-none focus:border-[#FF0052] transition-colors",
        Icon ? "pl-10 pr-3" : "px-3",
        className
      )}
    />
  </div>
)

// Missing import
import { X } from 'lucide-react'
