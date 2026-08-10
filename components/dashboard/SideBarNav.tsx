'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, AlertCircle, Wallet, Users, ClipboardCheck, 
  Landmark, CalendarDays, ChevronDown, Megaphone, Gavel, 
  ShieldCheck, HeartHandshake, Book, Scale // Asegúrate de importar Scale
} from 'lucide-react'

interface SidebarNavProps {
  esFiscal: boolean;
  esTesorero: boolean;
  esSecretario: boolean;
  esRepresentante: boolean;
  esBienestar: boolean;
  esAdmin: boolean;
}

export function SidebarNav({ 
    esFiscal, esTesorero, esSecretario, esRepresentante, esBienestar, esAdmin 
}: SidebarNavProps) {
  const pathname = usePathname()

  const routes = []

  // 1. DASHBOARD PRINCIPAL
  if (esAdmin) {
      routes.push({ name: 'Panel Admin', path: '/admin', icon: ShieldCheck })
  } else if (esBienestar) {
      routes.push({ name: 'Auditoría', path: '/bienestar', icon: HeartHandshake })
  } else {
      routes.push({ name: 'Inicio', path: '/', icon: LayoutDashboard })
  }

  // 2. GESTIÓN
  routes.push({ name: 'Cartelera', path: '/anuncios', icon: Megaphone })

// REGLAMENTO
  routes.push({ name: 'Reglamento', path: '/reglamento', icon: Book })
  if (esAdmin || esRepresentante) {
      // Los jefes van al Editor
      routes.push({ name: 'Editor Legal', path: '/admin/reglamento', icon: Scale })
  } 
  // 3. MENÚ DE RESIDENTE (Personal)
  if (!esAdmin && !esBienestar) {
      routes.push({ name: 'Mis Multas', path: '/multas', icon: AlertCircle })
      routes.push({ name: 'Mis Finanzas', path: '/finanzas', icon: Wallet }) 
      routes.push({ name: 'Comunidad', path: '/comunidad', icon: Users })
  }

  // 4. ROLES DE GESTIÓN (Autoridad)
  if (esFiscal || esAdmin) {
    routes.push({ name: 'Despacho Fiscal', path: '/fiscalia', icon: ClipboardCheck })
  }

  if (esTesorero || esAdmin) {
    routes.push({ name: 'Tesorería', path: '/tesoreria', icon: Landmark }) 
  }

  if (esSecretario || esAdmin) {
    routes.push({ name: 'Secretaría', path: '/secretaria', icon: CalendarDays })
  }

  if (esRepresentante || esAdmin) {
    routes.push({ name: 'El Estrado', path: '/estrado', icon: Gavel })
  }

  const necesitaScroll = routes.length > 6; 

  return (
    <div className="flex-1 relative flex flex-col min-h-0">
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {routes.map((route) => {
          const isActive = route.path === '/' 
            ? pathname === '/' 
            : pathname.startsWith(route.path)

          return (
            <Link 
              key={route.name}
              href={route.path} 
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 shrink-0
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
        <div className="h-6"></div>
      </nav>
      {necesitaScroll && (
        <div className="absolute bottom-0 left-0 w-full flex justify-center pb-2 pt-6 bg-gradient-to-t from-unicor-primary via-unicor-primary/80 to-transparent pointer-events-none">
           <ChevronDown size={24} className="text-white/20 animate-bounce" />
        </div>
      )}
    </div>
  )
}