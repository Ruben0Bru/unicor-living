'use client'

import { useRouter, useSearchParams } from 'next/navigation'

// Actualizamos el tipo para incluir genero
type Casa = { id: string, nombre: string, genero?: string }

export function ComunidadFilters({ casas, miCasaId }: { casas: Casa[], miCasaId?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filtroActual = searchParams.get('casa')

  const aplicarFiltro = (valor: string | null) => {
    if (valor) router.push(`/comunidad?casa=${valor}`)
    else router.push('/comunidad')
  }

  const esMiCasaActivo = !filtroActual || filtroActual === miCasaId
  const esTodosActivo = filtroActual === 'all'

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {/* Botón Mi Casa */}
      <button
        onClick={() => aplicarFiltro(null)}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
          esMiCasaActivo
            ? 'bg-unicor-primary text-white border-unicor-primary shadow-md'
            : 'bg-white text-gray-600 border-gray-200 hover:border-unicor-primary hover:text-unicor-primary'
        }`}
      >
        🏠 Mi Casa
      </button>

      {/* Botón Ver Todos */}
      <button
        onClick={() => aplicarFiltro('all')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
          esTodosActivo
            ? 'bg-unicor-primary text-white border-unicor-primary shadow-md'
            : 'bg-white text-gray-600 border-gray-200 hover:border-unicor-primary hover:text-unicor-primary'
        }`}
      >
        🌎 Ver Todos
      </button>

      <div className="w-px bg-gray-300 mx-2 h-8 self-center hidden md:block"></div>

      {/* SELECT MEJORADO CON GÉNERO */}
      <select
        onChange={(e) => aplicarFiltro(e.target.value)}
        value={filtroActual && filtroActual !== 'all' ? filtroActual : ''}
        className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 focus:border-unicor-primary focus:ring-2 focus:ring-unicor-primary outline-none cursor-pointer max-w-[250px]"
      >
        <option value="" disabled>Filtrar por otra casa...</option>
        {casas.map(casa => {
            // Lógica para mostrar etiqueta bonita
            const generoRaw = casa.genero?.toUpperCase() || '';
            let etiqueta = '';
            
            if (generoRaw === 'M' || generoRaw === 'MASCULINO') etiqueta = ' (Varones)';
            else if (generoRaw === 'F' || generoRaw === 'FEMENINO') etiqueta = ' (Mujeres)';
            else if (casa.genero) etiqueta = ` (${casa.genero})`; // Fallback

            return (
                <option key={casa.id} value={casa.id}>
                    {casa.nombre}{etiqueta}
                </option>
            )
        })}
      </select>
    </div>
  )
}