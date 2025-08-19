'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from './Footer'

const ClientFooterWrapper = () => {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    // Check initial
    checkIfMobile()

    // Listen for resize
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Don't show footer if:
  // 1. It's admin page
  const isAdminPage = pathname.startsWith('/admin')
  
  if (isAdminPage) {
    return null
  }
  
  return <Footer />
}

export default ClientFooterWrapper
