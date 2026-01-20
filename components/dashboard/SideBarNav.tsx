'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// Agregamos ClipboardCheck para el icono de Fiscalía
import { LayoutDashboard, AlertCircle, Wallet, Users, ClipboardCheck } from 'lucide-react'

// Definimos que este componente espera recibir un booleano
interface SidebarNavProps {
  esFiscal: boolean;
}

export function SidebarNav({ esFiscal }: SidebarNavProps) {
  const pathname = usePathname()

  // Lista base de rutas para todos los mortales
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

  // SI ES FISCAL, LE INYECTAMOS LA RUTA EXTRA 💉
  if (esFiscal) {
    routes.push({
      name: 'Despacho Fiscal',
      path: '/fiscalia',
      icon: ClipboardCheck
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