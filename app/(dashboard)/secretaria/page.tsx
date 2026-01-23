import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarioSecretario } from './CalendarioSecretario'
import { obtenerDatosPlanificacion } from './actions'

export default async function SecretariaPage() {
  // ... (Tu verificación de permisos igual que antes) ...
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificación Rápida de Rol (Copia lo de antes)
  const { data: perfil } = await supabase.from('perfiles').select('roles(nombre)').eq('id', user.id).single()
  const rol = (perfil?.roles as any)?.nombre?.toLowerCase() || ''
  if (!rol.includes('secretario') && !rol.includes('admin') && !rol.includes('representante')) {
      return <div>Acceso Denegado</div>
  }

  // OBTENER DATOS
  const { residentes, asignaciones } = await obtenerDatosPlanificacion()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       {/* Título */}
       <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-4xl">
                📅
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900">Mesa del Secretario</h1>
                <p className="text-gray-500">Selecciona un día en el calendario para asignar tareas.</p>
            </div>
       </div>

       {/* Componente Calendario */}
       <CalendarioSecretario 
            residentes={residentes} 
            asignacionesIniciales={asignaciones} 
       />
    </div>
  )
}