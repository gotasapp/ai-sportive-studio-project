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
}

export default function ProfessionalEditorLayout({
  sidebar,
  canvas,
  actionBar,
  marketplace,
  className
}: ProfessionalEditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(true)

  return (
    <div className={cn("w-full h-[calc(100vh-4rem)] bg-transparent text-[#FDFDFD] flex flex-col overflow-hidden", className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Sidebar */}
        <div className={cn(
          "relative bg-transparent border-r border-[#333333] transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-80" : "w-0",
          "md:w-80 md:block"
        )}>
          <div className={cn(
            "h-full overflow-y-auto overflow-x-hidden",
            !isSidebarOpen && "md:block hidden"
          )}>
            {/* Sidebar Header */}
            <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-[#333333] p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
                  Jersey Editor
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
              "absolute -right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex",
              "w-6 h-8 bg-[#333333] hover:bg-[#A20131] border border-[#333333]",
              "text-[#ADADAD] hover:text-[#FDFDFD] rounded-r-md rounded-l-none"
            )}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
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
              className="md:hidden text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/50 backdrop-blur-sm"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
              className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50 bg-black/50 backdrop-blur-sm"
            >
              {isMarketplaceOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Canvas Content */}
          <div className="px-4 py-1 overflow-auto" style={{ height: '80vh' }}>
            {canvas}
          </div>

            {/* Action Bar */}
            <div className="bg-transparent border-t border-[#333333] px-4 py-1 mt-[5px]" style={{height: '56px'}}>
              {actionBar}
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
              <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-[#333333] p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#FDFDFD] uppercase tracking-wide">
                    Marketplace
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMarketplaceOpen(false)}
                    className="text-[#ADADAD] hover:text-[#FDFDFD] hover:bg-[#333333]/50"
                  >
                    <EyeOff className="h-4 w-4" />
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
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Marketplace */}
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
    </div>
  )
} 