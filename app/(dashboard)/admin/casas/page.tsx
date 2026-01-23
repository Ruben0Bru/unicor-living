import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
// 👇 Importamos usando llaves porque es un export nombrado
import { CasaCard } from './CasaCard'

export default async function AdminCasasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('roles(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  
  const rol = (perfil.roles as any)?.nombre?.toLowerCase() || ''
  if (!rol.includes('admin')) {
      return <div className="p-10 text-center text-gray-500">Acceso denegado.</div>
  }

  const { data: casas } = await supabase.from('casas').select('*').order('nombre')

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
                <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-800 flex items-center gap-1 mb-2 transition-colors">
                    <ArrowLeft size={14} /> Volver al Panel
                </Link>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Building2 className="text-slate-800" /> Gestión Inmobiliaria
                </h1>
                <p className="text-gray-500">Configura nombres, capacidad y tarifas de cobro.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {casas?.map((casa) => (
                <CasaCard key={casa.id} casa={casa} />
            ))}
        </div>
    </div>
  )
}