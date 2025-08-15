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

  // Não mostrar footer se:
  // 1. É página admin
  // 2. É dispositivo mobile
  const isAdminPage = pathname.startsWith('/admin')
  
  if (isAdminPage || isMobile) {
    return null
  }
  
  return <Footer />
}

export default ClientFooterWrapper
