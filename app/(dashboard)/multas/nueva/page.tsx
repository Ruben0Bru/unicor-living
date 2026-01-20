import { createClient } from '@/utils/supabase/server'
import { FormularioMulta } from './FormularioMulta'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, XCircle } from 'lucide-react'

// Definimos el tipo para recibir parámetros de URL (para los errores)
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NuevaMultaPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Obtener los parámetros de la URL (Esperamos la promesa)
  const params = await searchParams
  const errorType = params.error

  // 2. Mi perfil (Para saber en qué casa estoy)
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('casa_id')
    .eq('id', user?.id)
    .single()

  // 3. Vecinos (Acusados potenciales - Excluyéndome a mí)
  const { data: vecinos } = await supabase
    .from('perfiles')
    .select('id, apodo, nombre_completo')
    .eq('casa_id', miPerfil?.casa_id)
    .neq('id', user?.id)

  // 4. Catálogo de Sanciones (Para el select)
  const { data: sanciones } = await supabase
    .from('sanciones')
    .select('*')
    .order('valor_base', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* --- BOTÓN DE VOLVER --- */}
      <Link 
        href="/multas" 
        className="inline-flex items-center text-gray-500 hover:text-unicor-primary transition-colors mb-6 group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Volver al historial</span>
      </Link>

      {/* --- ZONA DE ALERTAS Y ERRORES --- */}
      
      {/* Caso 1: Multa Prescrita (+24h) */}
      {errorType === 'prescrita' && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm flex items-start gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" />
          <div className="text-red-800">
            <p className="font-bold">¡Solicitud Rechazada!</p>
            <p className="text-sm">La infracción ocurrió hace más de 24 horas. Según el reglamento interno, la falta ha prescrito y no se puede procesar.</p>
          </div>
        </div>
      )}

      {/* Caso 2: Error Genérico de Base de Datos */}
      {errorType === 'true' && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm flex items-start gap-3">
          <XCircle className="text-red-500 flex-shrink-0 mt-1" />
          <div className="text-red-800">
            <p className="font-bold">Error del Sistema</p>
            <p className="text-sm">No se pudo guardar la multa. Inténtalo de nuevo o contacta soporte.</p>
          </div>
        </div>
      )}

      {/* --- ENCABEZADO --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-unicor-primary">Reportar Infracción 👮</h1>
        <p className="text-gray-500">Selecciona la falta del catálogo oficial.</p>
      </div>

      {/* --- FORMULARIO INTERACTIVO --- */}
      <FormularioMulta 
        vecinos={vecinos || []} 
        sanciones={sanciones || []} 
      />
    </div>
  )
}