'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function DashboardLayoutClient({
  sidebar,
  children,
  esAdmin
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
  esAdmin: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-unicor-base text-gray-800 overflow-hidden relative w-full">
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-unicor-primary text-white rounded-md shadow-lg"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[40]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR WRAPPER */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-[50] transform transition-transform duration-300 ease-in-out md:translate-x-0 flex h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebar}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full min-w-0">
        {/* Decoración de fondo Admin vs Normal */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2
            ${esAdmin ? 'bg-slate-500/10' : 'bg-unicor-secondary/5'}
        `}></div>
        
        {children}
      </main>
    </div>
  )
}
