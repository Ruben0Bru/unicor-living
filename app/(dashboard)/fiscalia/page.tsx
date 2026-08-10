import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardCheck, XCircle } from 'lucide-react'
import { TareaFiscal } from './TareaFiscal' // <--- Importamos el componente cliente

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
        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
          <div className="grid gap-4">
            {revisiones.map((tarea) => {
                const perfil = (tarea as any).perfiles;
                return (
                    <TareaFiscal 
                        key={tarea.id} 
                        tarea={tarea} 
                        perfil={perfil} 
                    />
                )
            })}
          </div>
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