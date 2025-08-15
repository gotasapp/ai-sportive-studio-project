'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProfessionalEditorLayoutProps {
  sidebar: React.ReactNode
  canvas: React.ReactNode
  actionBar: React.ReactNode
  marketplace?: React.ReactNode // Tornou-se opcional
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(true)

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    // Set initial state
    handleResize()
    
    // Add resize listener
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={cn("w-full h-[calc(100vh-4rem)] bg-transparent text-[#FDFDFD] flex flex-col overflow-hidden", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Sidebar */}
        <div className={cn(
          "relative bg-transparent border-r border-[#333333] transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-80" : "w-0",
          "hidden lg:block"
        )}>
          <div className={cn(
            "h-full overflow-y-auto overflow-x-hidden",
            !isSidebarOpen && "lg:hidden"
          )}>
            {/* Sidebar Header */}
            {showTitle && (
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-center">
                    <h2 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
                      {title}
                    </h2>
                  </div>

                </div>
              </div>
            )}

            {/* Sidebar Content */}
            <div className="p-4">
              {sidebar}
            </div>
          </div>

          {/* Sidebar Toggle Button - Desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2 z-20 hidden lg:flex",
              "w-6 h-8 bg-[#333333] hover:bg-[#FF0052] border border-[#333333]",
              "text-[#ADADAD] hover:text-[#FDFDFD] rounded-r-md rounded-l-none"
            )}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-3 w-3 text-[#ADADAD]" />
            ) : (
              <ChevronRight className="h-3 w-3 text-[#ADADAD]" />
            )}
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Menu Buttons */}
          <div className="lg:hidden absolute top-4 left-4 z-30 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/50 backdrop-blur-sm"
            >
              <Menu className="h-4 w-4 text-[#ADADAD]" />
            </Button>
            {marketplace && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/50 backdrop-blur-sm"
            >
              {isMarketplaceOpen ? <EyeOff className="h-4 w-4 text-[#ADADAD]" /> : <Eye className="h-4 w-4 text-[#ADADAD]" />}
            </Button>
            )}
          </div>

          {/* Canvas Content & Action Bar Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative p-4">
            {/* Canvas takes most of the available space */}
            <div className="h-[88%]">
              {canvas}
            </div>

            {/* Action Bar at the bottom */}
            <div className="pt-4">
              {actionBar}
            </div>
          </div>
        </div>

        {/* Marketplace Sidebar - só renderiza se marketplace existir */}
        {marketplace && (
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

      {/* Mobile Marketplace - só renderiza se marketplace existir */}
      {marketplace && (
      <div className={cn(
        "lg:hidden bg-transparent border-t border-[#333333] transition-all duration-300 ease-in-out",
        isMarketplaceOpen ? "h-48" : "h-0"
      )}>
        <div className={cn(
          "h-full overflow-y-auto overflow-x-hidden",
          !isMarketplaceOpen && "hidden"
        )}>
          <div className="p-4">
            {marketplace}
          </div>
        </div>
      </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="mobile-sidebar-overlay lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar Content */}
          <div className="mobile-sidebar-content absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-[#111011] border-r border-[#333333] shadow-2xl">
            <div className="h-full overflow-y-auto overflow-x-hidden">
              {/* Mobile Sidebar Header */}
              {showTitle && (
                <div className="sticky top-0 z-10 bg-[#111011] border-b border-[#333333] p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[#FDFDFD] uppercase tracking-wide">
                      {title}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Mobile Sidebar Content */}
              <div className="p-4">
                {sidebar}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 