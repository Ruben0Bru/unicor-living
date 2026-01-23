import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, LogOut } from 'lucide-react'

export default async function WaitingRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar estado
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('autorizado')
    .eq('id', user.id)
    .single()

  // Si ya lo aprobaron, que se vaya al dashboard (o al setup si falta)
  if (perfil?.autorizado) {
      redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-800 mb-2">Solicitud en Revisión</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
            Tu registro ha sido enviado exitosamente. Por seguridad, el Administrador debe aprobar tu ingreso antes de que puedas acceder al sistema.
        </p>

        <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-400 mb-8 text-left">
            <p className="font-bold text-gray-600 mb-1">¿Qué sigue?</p>
            <ul className="list-disc pl-4 space-y-1">
                <li>El Admin verificará tu identidad.</li>
                <li>Se te asignará tu Casa y Rol inicial.</li>
                <li>Intenta recargar esta página más tarde.</li>
            </ul>
        </div>

        <form action="/auth/signout" method="post">
            <button className="flex items-center justify-center gap-2 w-full text-gray-400 font-bold hover:text-gray-600 transition-colors">
                <LogOut size={16} /> Cerrar Sesión
            </button>
        </form>
      </div>
    </div>
  )
}