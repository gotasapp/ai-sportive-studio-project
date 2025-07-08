'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface ProfessionalEditorLayoutProps {
  sidebar: React.ReactNode
  canvas: React.ReactNode
  actionBar: React.ReactNode
  marketplace: React.ReactNode
  className?: string
  title?: string
  showTitle?: boolean
}

export default function ProfessionalEditorLayout({
  sidebar,
  canvas,
  actionBar,
  marketplace,
  className,
  title = "Jersey Fan NFT",
  showTitle = true
}: ProfessionalEditorLayoutProps) {
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Fecha por padrão no mobile
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false) // Fecha por padrão no mobile

  // Auto-close sidebars on mobile when switching between them
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
      setIsMarketplaceOpen(false)
    } else {
      setIsSidebarOpen(true)
      setIsMarketplaceOpen(true)
    }
  }, [isMobile])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isSidebarOpen && !target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
        setIsSidebarOpen(false)
      }
      if (isMarketplaceOpen && !target.closest('[data-marketplace]') && !target.closest('[data-marketplace-toggle]')) {
        setIsMarketplaceOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen, isMarketplaceOpen, isMobile])

  return (
    <div className={cn(
      "w-full bg-transparent text-[#FDFDFD] flex flex-col overflow-hidden",
      isMobile ? "h-[calc(100vh-3rem)]" : "h-[calc(100vh-4rem)]",
      className
    )}>
      {/* Mobile Overlay */}
      {isMobile && (isSidebarOpen || isMarketplaceOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            setIsSidebarOpen(false)
            setIsMarketplaceOpen(false)
          }}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Sidebar */}
        <div 
          data-sidebar
          className={cn(
            "bg-transparent border-r border-[#333333] transition-all duration-300 ease-in-out z-50",
            // Mobile: Full screen overlay sidebar
            isMobile ? [
              "fixed inset-y-0 left-0",
              isSidebarOpen ? "w-full max-w-sm translate-x-0" : "w-0 -translate-x-full"
            ] : [
              // Desktop: Normal sidebar behavior
              isSidebarOpen ? "w-80" : "w-0"
            ]
          )}
        >
          <div className={cn(
            "h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#030303] to-[#0b0518]",
            !isSidebarOpen && !isMobile && "hidden"
          )}>
            {/* Sidebar Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[#030303] to-transparent p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-center">
                  {showTitle && (
                    <h2 className={cn(
                      "font-system font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent",
                      isMobile ? "text-lg" : "text-sm md:text-xl"
                    )}>
                      {title}
                    </h2>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50",
                    isMobile ? "block" : "md:hidden"
                  )}
                >
                  <X className="h-4 w-4 text-[#ADADAD]" />
                </Button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className={cn(
              "p-3 md:p-4",
              isMobile && "pb-20" // Extra bottom padding on mobile
            )}>
              {sidebar}
            </div>
          </div>

          {/* Sidebar Toggle Button - Desktop Only */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "absolute -right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex",
                "w-6 h-8 bg-[#333333] hover:bg-[#A20131] border border-[#333333]",
                "text-[#ADADAD] hover:text-[#FDFDFD] rounded-r-md rounded-l-none"
              )}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-3 w-3 text-[#ADADAD]" />
              ) : (
                <ChevronRight className="h-3 w-3 text-[#ADADAD]" />
              )}
            </Button>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Control Bar */}
          {isMobile && (
            <div className="absolute top-2 left-2 right-2 z-30 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  data-sidebar-toggle
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSidebarOpen(true)
                    setIsMarketplaceOpen(false)
                  }}
                  className={cn(
                    "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/70 backdrop-blur-sm border border-[#333333]/50",
                    isSidebarOpen && "bg-[#A20131]/70"
                  )}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  data-marketplace-toggle
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMarketplaceOpen(true)
                    setIsSidebarOpen(false)
                  }}
                  className={cn(
                    "text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/70 backdrop-blur-sm border border-[#333333]/50",
                    isMarketplaceOpen && "bg-[#A20131]/70"
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Canvas Content & Action Bar Container */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden relative",
            isMobile ? "p-2 pt-12" : "p-4"
          )}>
            {/* Canvas takes most of the available space */}
            <div className={cn(
              isMobile ? "h-[75%]" : "h-[88%]"
            )}>
              {canvas}
            </div>

            {/* Action Bar at the bottom */}
            <div className={cn(
              isMobile ? "pt-2" : "pt-4"
            )}>
              {actionBar}
            </div>
          </div>
        </div>

        {/* Desktop Marketplace Sidebar */}
        {!isMobile && (
          <div className={cn(
            "relative bg-transparent border-l border-[#333333] transition-all duration-300 ease-in-out",
            isMarketplaceOpen ? "w-80" : "w-12",
            "hidden lg:block"
          )}>
            {isMarketplaceOpen ? (
              <div className="h-full overflow-y-auto overflow-x-hidden">
                {/* Marketplace Header */}
                <div className="sticky top-0 z-10 bg-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-center">
                      <h2 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
                        Marketplace
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMarketplaceOpen(false)}
                      className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                    >
                      <EyeOff className="h-4 w-4 text-[#ADADAD]" />
                    </Button>
                  </div>
                </div>

                {/* Marketplace Content */}
                <div className="p-4">
                  {marketplace}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMarketplaceOpen(true)}
                  className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 rotate-90"
                >
                  <Eye className="h-4 w-4 text-[#ADADAD]" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Marketplace Overlay */}
      {isMobile && (
        <div 
          data-marketplace
          className={cn(
            "fixed inset-y-0 right-0 bg-transparent border-l border-[#333333] transition-all duration-300 ease-in-out z-50",
            isMarketplaceOpen ? "w-full max-w-sm translate-x-0" : "w-0 translate-x-full"
          )}
        >
          <div className="h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#030303] to-[#0b0518]">
            {/* Marketplace Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[#030303] to-transparent p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-center">
                  <h2 className="text-lg font-semibold text-[#FDFDFD] uppercase tracking-wide">
                    Marketplace
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMarketplaceOpen(false)}
                  className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                >
                  <X className="h-4 w-4 text-[#ADADAD]" />
                </Button>
              </div>
            </div>

            {/* Marketplace Content */}
            <div className="p-3 pb-20">
              {marketplace}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 