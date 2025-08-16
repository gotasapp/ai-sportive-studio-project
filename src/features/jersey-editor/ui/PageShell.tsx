// ================================================
// PageShell Component
// Layout reutilizável com main/aside
// ================================================

import React from 'react'

export function PageShell({ 
  title, 
  subtitle, 
  children, 
  aside 
}: { 
  title: string
  subtitle?: string
  children: React.ReactNode
  aside?: React.ReactNode 
}) {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <main className="lg:col-span-8 space-y-6">{children}</main>
        <aside className="lg:col-span-4 space-y-4">{aside}</aside>
      </div>
    </div>
  )
}
