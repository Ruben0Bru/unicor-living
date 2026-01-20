'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// Agregamos Landmark (Banco) para Tesorería
import { LayoutDashboard, AlertCircle, Wallet, Users, ClipboardCheck, Landmark } from 'lucide-react'

interface SidebarNavProps {
  esFiscal: boolean;
  esTesorero: boolean; // <--- Nuevo Prop
}

export function SidebarNav({ esFiscal, esTesorero }: SidebarNavProps) {
  const pathname = usePathname()

  // Lista base
  const routes = [
    {
      name: 'Inicio',
      path: '/',
      icon: LayoutDashboard
    },
    {
      name: 'Multas',
      path: '/multas',
      icon: AlertCircle
    },
    {
      name: 'Finanzas',
      path: '/finanzas',
      icon: Wallet
    },
    {
      name: 'Comunidad',
      path: '/comunidad',
      icon: Users
    }
  ]

  // ⚖️ INYECTAR DESPACHO FISCAL
  if (esFiscal) {
    routes.push({
      name: 'Despacho Fiscal',
      path: '/fiscalia',
      icon: ClipboardCheck
    })
  }

  // 💰 INYECTAR TESORERÍA (Nuevo)
  if (esTesorero) {
    routes.push({
      name: 'Tesorería',
      path: '/tesoreria',
      icon: Landmark 
    })
  }

  return (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {routes.map((route) => {
        const isActive = route.path === '/' 
          ? pathname === '/' 
          : pathname.startsWith(route.path)

        return (
          <Link 
            key={route.path}
            href={route.path} 
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-unicor-secondary/20 text-white border-l-4 border-unicor-accent font-medium shadow-sm' 
                : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
              }
            `}
          >
            <route.icon size={20} className={isActive ? 'text-unicor-accent' : ''} />
            <span>{route.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}