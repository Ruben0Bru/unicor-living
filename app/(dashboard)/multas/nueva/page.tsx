import { createClient } from '@/utils/supabase/server'
import { FormularioMulta } from './FormularioMulta'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, XCircle } from 'lucide-react'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// 👇 1. TIPOS DEFINIDOS (Para evitar el error de 'any')
type Vecino = { 
    id: string
    apodo: string
    nombre_completo: string | null
    casa_id: string 
}

type Casa = { 
    id: string
    nombre: string
    genero: string // <--- Agregamos esto para diferenciar
}

export default async function NuevaMultaPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = await searchParams
  const errorType = params.error

  // 2. Mi perfil
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('casa_id, roles(nombre)')
    .eq('id', user?.id)
    .single()

  const rawRol = miPerfil?.roles as any
  const nombreRol = (rawRol?.nombre || rawRol?.[0]?.nombre || '').toLowerCase()
  const esBienestar = nombreRol.includes('bienestar') || nombreRol.includes('admin')

  // 3. Lógica de "Vecinos" (Inicialización con Tipos)
  let vecinos: Vecino[] = []
  let casas: Casa[] = []

  if (esBienestar) {
      // CASO A: BIENESTAR
      const { data: dataCasas } = await supabase
        .from('casas')
        // 👇 IMPORTANTE: Traemos 'genero'
        .select('id, nombre, genero')
        .neq('nombre', 'Sede Administrativa')
        .order('nombre')
      
      // Casting seguro para TS
      casas = (dataCasas || []) as Casa[]

      const { data: dataResidentes } = await supabase
        .from('perfiles')
        .select('id, apodo, nombre_completo, casa_id')
        .not('casa_id', 'is', null) 
        .neq('id', user?.id)
      
      vecinos = (dataResidentes || []).map(r => ({
          id: r.id,
          apodo: r.apodo,
          nombre_completo: r.nombre_completo,
          casa_id: r.casa_id!
      }))

  } else {
      // CASO B: RESIDENTE
      const { data: dataVecinos } = await supabase
        .from('perfiles')
        .select('id, apodo, nombre_completo, casa_id')
        .eq('casa_id', miPerfil?.casa_id)
        .neq('id', user?.id)
      
      vecinos = (dataVecinos || []).map(r => ({
          id: r.id,
          apodo: r.apodo,
          nombre_completo: r.nombre_completo,
          casa_id: r.casa_id!
      }))
  }

  // 4. Catálogo de Sanciones
  const { data: sanciones } = await supabase
    .from('sanciones')
    .select('*')
    .eq('categoria', 'disciplinaria')
    .order('valor_base', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto">
      
      <Link 
        href="/multas" 
        className="inline-flex items-center text-gray-500 hover:text-unicor-primary transition-colors mb-6 group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Volver al historial</span>
      </Link>

      {/* --- ERRORES --- */}
      {errorType === 'prescrita' && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm flex items-start gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" />
          <div className="text-red-800">
            <p className="font-bold">¡Solicitud Rechazada!</p>
            <p className="text-sm">La infracción prescribió (+24h).</p>
          </div>
        </div>
      )}

      {errorType === 'true' && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm flex items-start gap-3">
          <XCircle className="text-red-500 flex-shrink-0 mt-1" />
          <div className="text-red-800">
            <p className="font-bold">Error del Sistema</p>
            <p className="text-sm">No se pudo guardar la multa.</p>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-unicor-primary">Reportar Infracción 👮</h1>
        <p className="text-gray-500">
            {esBienestar ? 'Selecciona la casa y el residente a sancionar.' : 'Selecciona la falta del catálogo oficial.'}
        </p>
      </div>

      {/* --- FORMULARIO --- */}
      <FormularioMulta 
        vecinos={vecinos} 
        sanciones={sanciones || []} 
        casas={casas} 
      />
    </div>
  )
}