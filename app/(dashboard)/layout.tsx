import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '@/app/login/actions'
import { LogOut, UserCircle } from 'lucide-react'
import { SidebarNav } from '@/components/dashboard/SideBarNav' 

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Traemos 'roles(nombre)' para saber quién es
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, roles(nombre)') 
    .eq('id', user.id)
    .single()

  // --- LÓGICA DE PERMISOS GRANULAR ---
  const nombreRol = perfil?.roles?.nombre?.toLowerCase() || ''
  
  // ¿Quién puede ver la Fiscalía?
  const puedeVerFiscalia = nombreRol.includes('fiscal') || nombreRol.includes('admin') || nombreRol.includes('representante')
  
  // ¿Quién puede ver la Tesorería?
  const puedeVerTesoreria = nombreRol.includes('tesorero') || nombreRol.includes('admin') || nombreRol.includes('representante')

  return (
    <div className="flex h-screen bg-unicor-base text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-unicor-primary text-white flex flex-col shadow-2xl z-10">
        
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-unicor-secondary/30">
          <h1 className="text-2xl font-bold tracking-wider">
            UNICOR<span className="text-unicor-accent">LIVING</span>
          </h1>
        </div>

        {/* Perfil */}
        <div className="border-b border-unicor-secondary/30 bg-black/10">
          <Link href="/perfil" className="block p-6 flex flex-col items-center hover:bg-white/5 transition-colors cursor-pointer group">
            
            <div className="w-20 h-20 rounded-full border-4 border-unicor-secondary overflow-hidden mb-3 shadow-lg group-hover:scale-105 transition-transform">
              {perfil?.avatar_url ? (
                <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                  <UserCircle size={40} />
                </div>
              )}
            </div>
            
            <p className="font-bold text-lg text-center leading-tight group-hover:text-unicor-accent transition-colors">
                {perfil?.apodo || "Residente"}
            </p>
            
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-unicor-accent uppercase tracking-wide">
                    {perfil?.es_adjudicado ? "Residente Oficial" : "En Prueba"}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xs">✎</span>
            </div>

          </Link>
        </div>

        {/* --- PASAMOS AMBOS PERMISOS --- */}
        <SidebarNav esFiscal={puedeVerFiscalia} esTesorero={puedeVerTesoreria} />
        {/* ------------------------------- */}

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-unicor-secondary/30 mt-auto">
          <form action={signout}>
            <button className="flex w-full items-center justify-center space-x-2 bg-red-900/30 hover:bg-red-600/80 text-red-200 hover:text-white py-3 rounded-lg transition-all duration-300 group">
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-unicor-secondary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        {children}
      </main>

    </div>
  )
}