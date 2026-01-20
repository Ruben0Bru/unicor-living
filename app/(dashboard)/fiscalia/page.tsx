import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardCheck, CheckCircle2, XCircle, User, CalendarClock } from 'lucide-react'
import { aprobarAseo, rechazarAseo } from './actions'

export default async function FiscaliaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. OBTENER PERFIL Y CASA
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, roles(nombre)')
    .eq('id', user.id)
    .single()

  // 2. VERIFICAR PERMISOS
  const nombreRol = miPerfil?.roles?.nombre?.toLowerCase() || ''
  const esFiscal = nombreRol.includes('fiscal') || nombreRol.includes('admin') || nombreRol.includes('representante')

  if (!esFiscal) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <XCircle size={40} className="text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-700">Acceso Restringido</h1>
            <p className="text-gray-500 mt-2">No tienes permisos de Fiscal.</p>
        </div>
    )
  }

  // 3. TRAER TAREAS POR VERIFICAR
  const { data: revisiones } = await supabase
    .from('asignaciones')
    .select('*, perfiles!asignaciones_residente_id_fkey(apodo, avatar_url, nombre_completo)')
    .eq('casa_id', miPerfil.casa_id)   
    .eq('realizado', true)
    .neq('verificado', true)
    .order('fecha_asignada', { ascending: true })

  const hayDatos = revisiones && revisiones.length > 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
             <ClipboardCheck size={24} />
           </span>
           Fiscalía
        </h1>
        <p className="text-gray-500">Solicitudes de verificación de aseo.</p>
      </div>

      {/* LISTA DE REVISIONES */}
      {hayDatos ? (
        <div className="grid gap-4">
            {revisiones.map((tarea) => {
                // Casteamos a 'any' para evitar quejas de TypeScript con la relación
                const perfil = (tarea as any).perfiles;

                return (
                <div key={tarea.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-blue-200 transition-all">
                    
                    {/* Info */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                             {perfil?.avatar_url ? (
                                <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : <User className="w-full h-full p-2 text-gray-400" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800 text-lg">{perfil?.apodo || "Usuario"}</h3>
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                    Dice que terminó
                                </span>
                            </div>
                            <p className="text-gray-600 font-medium mt-1">{tarea.tipo_aseo}</p>
                            <p className="text-sm text-gray-400 italic">"{tarea.descripcion}"</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                <CalendarClock size={12} />
                                <span>Asignado el: {new Date(tarea.fecha_asignada).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <form action={rechazarAseo.bind(null, tarea.id)} className="flex-1 md:flex-none">
                            <button className="w-full md:w-auto px-4 py-3 rounded-xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2">
                                <XCircle size={18} />
                                <span className="md:hidden lg:inline">Rechazar</span>
                            </button>
                        </form>
                        <form action={aprobarAseo.bind(null, tarea.id)} className="flex-1 md:flex-none">
                            <button className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} />
                                <span>Aprobar</span>
                            </button>
                        </form>
                    </div>
                </div>
            )})}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
                <ClipboardCheck size={48} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-600">Todo verificado</h3>
            <p className="text-sm text-gray-400">No hay tareas pendientes de revisión en este momento.</p>
        </div>
      )}
    </div>
  )
}