'use client'

import React, { useState } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(true)

  return (
    <div className={cn("w-full h-[calc(100vh-4rem)] bg-transparent text-[#FDFDFD] flex flex-col overflow-hidden", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full lg:flex-row flex-col">
        {/* Sidebar */}
        <div className={cn(
          "relative bg-transparent border-r border-[#333333] transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-80" : "w-0",
          "md:w-80 md:block",
          // Mobile: full screen overlay quando aberto
          "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:z-50 max-lg:h-screen",
          isSidebarOpen ? "max-lg:w-screen max-lg:bg-black/95 max-lg:backdrop-blur-md" : "max-lg:w-0"
        )}>
          <div className={cn(
            "h-full overflow-y-auto overflow-x-hidden",
            !isSidebarOpen && "md:block hidden"
          )}>
            {/* Sidebar Header */}
            {showTitle && (
              <div className="sticky top-0 z-10 bg-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-center">
                    <h2 className="text-sm md:text-xl font-system font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent" style={{ fontWeight: 500 }}>
                      {title}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                  >
                    <X className="h-4 w-4 text-[#ADADAD]" />
                  </Button>
                </div>
              </div>
            )}

            {/* Sidebar Content */}
            <div className="p-4 max-lg:pb-20">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/50 backdrop-blur-sm"
            >
              {isMarketplaceOpen ? <EyeOff className="h-4 w-4 text-[#ADADAD]" /> : <Eye className="h-4 w-4 text-[#ADADAD]" />}
            </Button>
          </div>

          {/* Canvas Content & Action Bar Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative p-4 max-lg:p-2">
            {/* Canvas takes most of the available space */}
            <div className="h-[88%] lg:h-[88%] max-lg:min-h-[60vh]">
              {canvas}
            </div>

            {/* Action Bar at the bottom */}
            <div className="pt-4 max-lg:pt-2">
              {actionBar}
            </div>
          </div>
        </div>

        {/* Marketplace Sidebar */}
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
      </div>

      {/* Mobile Marketplace */}
      <div className={cn(
        "lg:hidden bg-transparent border-t border-[#333333] transition-all duration-300 ease-in-out",
        isMarketplaceOpen ? "h-48 max-lg:h-40" : "h-0"
      )}>
        <div className={cn(
          "h-full overflow-y-auto overflow-x-hidden",
          !isMarketplaceOpen && "hidden"
        )}>
          <div className="p-4 max-lg:p-2">
            {marketplace}
          </div>
        </div>
      </div>
    </div>
  )
} 