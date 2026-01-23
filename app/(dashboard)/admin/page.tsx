import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link' // 👈 Importante para que funcionen los botones
import { AdminUsersTable } from './AdminUserTable'
import { 
    ShieldCheck, Users, AlertCircle, Home, Scale // 👈 Iconos nuevos
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. VERIFICACIÓN DE SEGURIDAD
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, roles(id, nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  const rol = (perfil.roles as any)?.nombre || ''
  if (!rol.toLowerCase().includes('admin')) {
      redirect('/') 
  }

  // 2. CARGAR DATOS MAESTROS
  const { data: usuarios } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: roles } = await supabase
    .from('roles')
    .select('id, nombre')
    .order('id')

  const { data: casas } = await supabase
    .from('casas')
    .select('id, nombre, genero')
    .order('nombre')

  // 3. CÁLCULO DE KPIs
  const totalUsuarios = usuarios?.length || 0
  const pendientes = usuarios?.filter((u: any) => !u.autorizado).length || 0
  const totalCasas = casas?.length || 0

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* HEADER DE ADMIN */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="p-4 bg-slate-800 text-white rounded-2xl shadow-lg">
            <ShieldCheck size={40} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-slate-900">Panel de Control</h1>
            <p className="text-gray-500">Administración general del sistema Unicor.</p>
        </div>
      </div>

      {/* KPIs DE SISTEMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base de Usuarios</p>
                  <h3 className="text-4xl font-black text-slate-800 mt-1">{totalUsuarios}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Users size={24} /></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solicitudes Pendientes</p>
                  <h3 className={`text-4xl font-black mt-1 ${pendientes > 0 ? 'text-amber-500' : 'text-green-500'}`}>{pendientes}</h3>
              </div>
              <div className={`p-3 rounded-xl ${pendientes > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                  <AlertCircle size={24} />
              </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Casas Activas</p>
                  <h3 className="text-4xl font-black mt-1">{totalCasas}</h3>
              </div>
              <div className="p-3 bg-white/10 rounded-xl"><Home size={24} /></div>
          </div>
      </div>

      {/* 👇 ACCESOS RÁPIDOS (AQUÍ ESTÁ LA ASOCIACIÓN) 👇 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Enlace al Editor Legislativo */}
        <Link href="/admin/reglamento" className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:scale-[1.02] transition-transform group cursor-pointer">
            <div>
                <h3 className="font-bold text-lg group-hover:text-indigo-300 transition-colors">Editor Legislativo</h3>
                <p className="text-slate-400 text-sm">Redactar normas y configurar multas</p>
            </div>
            <Scale size={32} className="text-indigo-400" />
        </Link>
        
        {/* Enlace a Gestión Inmobiliaria (El siguiente paso) */}
        <Link href="/admin/casas" className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer">
            <div>
                <h3 className="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">Gestión Inmobiliaria</h3>
                <p className="text-gray-500 text-sm">Editar precios y capacidad de casas</p>
            </div>
            <Home size={32} className="text-indigo-600" />
        </Link>

      </div>

      {/* TABLA DE GESTIÓN */}
      <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Gestión de Personal</h2>
          <AdminUsersTable 
             usuarios={usuarios || []} 
             roles={roles || []} 
             casas={casas || []} 
          />
      </div>

    </div>
  )
}