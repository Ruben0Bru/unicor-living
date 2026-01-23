import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Book, Scale, ScrollText, AlertTriangle } from 'lucide-react'

// 1. Definimos los tipos para que TypeScript sepa qué esperar
type Sancion = {
    codigo_referencia: string
    valor_base: number
    descripcion: string | null
}

type Articulo = {
    id: string
    numero_articulo: string
    titulo: string
    descripcion_texto: string
    capitulo: string | null
    sanciones: Sancion[]
}

export default async function ReglamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Obtener mi casa (con corrección de tipo para 'casas')
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('casa_id, casas(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil?.casa_id) return <div>No tienes casa asignada.</div>

  // 🛠️ FIX 1: Extraemos el nombre de la casa de forma segura
  // TypeScript cree que 'casas' es un array {nombre: string}[].
  // Lo tratamos como tal o como objeto para evitar el error rojo.
  const casaData = perfil.casas as any
  const nombreCasa = Array.isArray(casaData) ? casaData[0]?.nombre : casaData?.nombre

  // 2. Traer el Reglamento
  const { data: articulosRaw } = await supabase
    .from('reglamento')
    .select(`
        *,
        sanciones (
            codigo_referencia,
            valor_base,
            descripcion
        )
    `)
    .eq('casa_id', perfil.casa_id)
    .order('numero_articulo', { ascending: true })

  // 🛠️ FIX 2: Casteamos la respuesta a nuestro tipo 'Articulo[]'
  const articulos = articulosRaw as unknown as Articulo[]

  // 3. Agrupar por Capítulos
  // Definimos explícitamente el tipo del acumulador
  const capitulos: Record<string, Articulo[]> = {}
  
  articulos?.forEach((art) => {
      const cap = art.capitulo || "Disposiciones Generales"
      if (!capitulos[cap]) capitulos[cap] = []
      capitulos[cap].push(art)
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
              <Scale size={150} />
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 text-slate-300">
                  <Book size={20} />
                  <span className="text-sm font-bold uppercase tracking-widest">Marco Legal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-2">Reglamento Interno</h1>
              <p className="text-slate-400 max-w-lg">
                  Normas de convivencia y estatutos de {nombreCasa}. 
                  El desconocimiento de la ley no exime de su cumplimiento.
              </p>
          </div>
      </div>

      {/* CONTENIDO DEL REGLAMENTO */}
      {Object.keys(capitulos).length > 0 ? (
          <div className="space-y-8">
              {Object.entries(capitulos).map(([nombreCapitulo, listaArticulos], index) => (
                  <div key={index} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                      
                      {/* Título Capítulo */}
                      <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center gap-3">
                          <ScrollText className="text-unicor-primary" />
                          <h2 className="text-xl font-bold text-gray-800">{nombreCapitulo}</h2>
                      </div>

                      {/* Lista de Artículos */}
                      <div className="divide-y divide-gray-100">
                          {/* 🛠️ FIX 3: TypeScript ya sabe que listaArticulos es Articulo[] */}
                          {listaArticulos.map((art) => (
                              <div key={art.id} className="p-6 hover:bg-gray-50 transition-colors">
                                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                                      <div className="flex-1">
                                          <h3 className="font-bold text-gray-900 mb-2">
                                              Artículo {art.numero_articulo}: {art.titulo}
                                          </h3>
                                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                              {art.descripcion_texto}
                                          </p>
                                      </div>

                                      {/* Sanciones Asociadas (Si existen) */}
                                      {art.sanciones && art.sanciones.length > 0 && (
                                          <div className="bg-red-50 rounded-xl p-3 border border-red-100 min-w-[200px]">
                                              <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 mb-2">
                                                  <AlertTriangle size={12} /> Sanciones Relacionadas
                                              </p>
                                              <div className="space-y-2">
                                                  {art.sanciones.map((s, i) => (
                                                      <div key={i} className="text-xs">
                                                          <span className="font-bold text-gray-700">{s.codigo_referencia}</span>
                                                          <div className="flex justify-between text-gray-500">
                                                              <span>Multa:</span>
                                                              <span className="font-mono font-bold text-red-600">${s.valor_base.toLocaleString()}</span>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="text-center py-20">
              <Book size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-600">Reglamento en Redacción</h3>
              <p className="text-gray-400">Aún no se han digitalizado los artículos para esta sede.</p>
          </div>
      )}
    </div>
  )
}