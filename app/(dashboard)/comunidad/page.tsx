import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { ComunidadFilters } from '@/components/dashboard/ComunidadFilters'
import { Users } from 'lucide-react'

// Recibimos searchParams como prop (Next.js 15+)
export default async function ComunidadPage(props: {
  searchParams: Promise<{ casa?: string }>
}) {
  const searchParams = await props.searchParams
  const filtroCasa = searchParams.casa

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Obtener MI perfil para saber cuál es "Mi Casa"
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('casa_id')
    .eq('id', user.id)
    .single()

 // 2. Obtener lista de casas para el filtro (AGREGAMOS 'genero')
  const { data: listaCasas } = await supabase
    .from('casas')
    .select('id, nombre, genero') // <--- ¡Importante!
    .order('nombre')

  // 3. CONSTRUIR LA CONSULTA DE RESIDENTES
  let query = supabase
    .from('perfiles')
    .select('*, casas(nombre)')
    .order('apodo', { ascending: true })

  // --- LÓGICA DE FILTRADO ---
  if (filtroCasa === 'all') {
    // No aplicamos filtro, traemos a todos
  } else if (filtroCasa) {
    // Filtramos por la casa específica que pidieron
    query = query.eq('casa_id', filtroCasa)
  } else {
    // POR DEFECTO: Solo mostramos los de MI casa
    if (miPerfil?.casa_id) {
      query = query.eq('casa_id', miPerfil.casa_id)
    }
  }

  const { data: residentes } = await query

  return (
    <div className="space-y-8">
      
      {/* Encabezado + Filtros */}
      <div className="flex flex-col gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-unicor-primary flex items-center gap-3">
            <Users className="text-unicor-secondary" />
            Comunidad Unicor
          </h1>
          <p className="text-gray-500 mt-2">
            Directorio de residentes activos.
          </p>
        </div>
        
        {/* COMPONENTE DE FILTROS */}
        <ComunidadFilters 
            casas={listaCasas || []} 
            miCasaId={miPerfil?.casa_id} 
        />
      </div>

      {/* Grilla de Tarjetas (USANDO VARIANT COMPACT) */}
      {residentes && residentes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {residentes.map((residente) => (
            <ProfileCard 
                key={residente.id}
                variant="compact" // <--- LA MAGIA DEL REDISEÑO
                fotoUrl={residente.avatar_url}
                apodo={residente.apodo}
                nombreCompleto={residente.nombre_completo}
                biografia={residente.biografia}
                nombreCasa={residente.casas?.nombre}
                tipoSangre={residente.tipo_sangre}
                programa={residente.programa_academico}
                semestre={residente.semestre_actual}
                fechaNacimiento={residente.fecha_nacimiento}
                hobbies={residente.hobbies || []}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">No se encontraron residentes en esta casa.</p>
        </div>
      )}
    </div>
  )
}