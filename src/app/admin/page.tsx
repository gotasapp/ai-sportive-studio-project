'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar imediatamente para /admin/jerseys
    router.replace('/admin/jerseys')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-[#FF0052] animate-spin" />
        <p className="text-white mt-4">Redirecting to Admin Panel...</p>
      </div>
    </div>
  )
}
