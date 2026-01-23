import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Megaphone, Calendar, Send, Trash2, Pin, MessageCircle, Globe } from 'lucide-react'
import { publicarAnuncio, borrarAnuncio } from './actions'

export default async function AnunciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Obtener Perfil
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, roles(nombre), casas(nombre)')
    .eq('id', user.id)
    .single()

  // 2. Verificar Permisos
  const rawRol = miPerfil?.roles as any
  const nombreRol = (rawRol?.nombre || rawRol?.[0]?.nombre || '').toLowerCase()
  
  const esBienestar = nombreRol.includes('bienestar')
  const esLider = 
    esBienestar || 
    nombreRol.includes('representante') || 
    nombreRol.includes('admin')

  // 3. (Solo Bienestar) Obtener lista de casas para el selector
  // Incluimos 'genero' para mostrarlo en el dropdown
  let listaCasas: { id: string; nombre: string; genero?: string }[] = []
  
  if (esBienestar) {
      const { data } = await supabase
        .from('casas')
        .select('id, nombre, genero')
        .neq('nombre', 'Sede Administrativa')
        .order('nombre')
      listaCasas = data || []
  }

  // 4. CONSULTA DE ANUNCIOS
  let query = supabase
    .from('anuncios')
    .select('*, perfiles(apodo, avatar_url), casas(nombre)') // Traemos nombre de casa
    .order('created_at', { ascending: false })

  if (esBienestar) {
      // Bienestar ve TODO (Globales + Específicos de cualquier casa)
  } else {
      // Residentes ven: SU CASA + GLOBALES (casa_id is null)
      query = query.or(`casa_id.eq.${miPerfil?.casa_id},casa_id.is.null`)
  }

  const { data: anuncios } = await query

  // Helper para mostrar género bonito en el select
  const getLabelCasa = (nombre: string, genero?: string) => {
      let g = genero?.toLowerCase() || '';
      let etiqueta = g;
      if (g.startsWith('m') && g.includes('asc')) etiqueta = 'Varones';
      else if (g.startsWith('f')) etiqueta = 'Mujeres';
      else if (g.includes('mix')) etiqueta = 'Mixta';
      
      return etiqueta ? `${nombre} (${etiqueta})` : nombre;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
        <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
            <Megaphone size={28} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-gray-800">Cartelera</h1>
            <p className="text-gray-500">Noticias, eventos y comunicados oficiales.</p>
        </div>
      </div>

      {/* --- FORMULARIO (SOLO LÍDERES) --- */}
      {esLider && (
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-pink-500/5 border border-pink-100 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Pin size={16} className="text-pink-500" /> Crear Comunicado
            </h3>
            <form action={publicarAnuncio} className="space-y-4">
                
                {/* SELECTOR DE DESTINO (SOLO BIENESTAR) */}
                {esBienestar && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                        <label className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1 block">
                            ¿A quién va dirigido?
                        </label>
                        <select name="destino" className="w-full bg-white border border-indigo-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none cursor-pointer">
                            <option value="global">🌍 A TODAS las Casas (Global)</option>
                            {listaCasas.map(c => (
                                <option key={c.id} value={c.id}>🏠 {getLabelCasa(c.nombre, c.genero)}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                    <input name="titulo" required placeholder="Título llamativo..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-pink-500 font-bold" />
                    <select name="tipo" className="bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium text-gray-600">
                        <option value="info">ℹ️ Información</option>
                        <option value="evento">🎉 Evento</option>
                        <option value="urgente">🚨 Urgente</option>
                    </select>
                </div>
                <textarea name="contenido" required rows={3} placeholder="Escribe aquí los detalles..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm"></textarea>
                
                <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                         <Calendar size={14} /> 
                         <span className="hidden sm:inline">Fecha Evento:</span>
                         <input type="date" name="fecha_evento" className="bg-transparent outline-none text-gray-600 cursor-pointer" />
                    </div>
                    <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md shadow-pink-200 hover:scale-105 active:scale-95">
                        <Send size={16} /> Publicar
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* --- LISTA DE ANUNCIOS --- */}
      <div className="space-y-6">
        {anuncios && anuncios.length > 0 ? (
            anuncios.map((anuncio) => {
                const esUrgente = anuncio.tipo === 'urgente';
                const esEvento = anuncio.tipo === 'evento';
                const esGlobal = anuncio.casa_id === null;
                
                return (
                    <div key={anuncio.id} className={`bg-white rounded-3xl p-6 shadow-sm border relative overflow-hidden group hover:shadow-md transition-all
                        ${esUrgente ? 'border-red-100' : esEvento ? 'border-purple-100' : 'border-gray-100'}
                    `}>
                        {/* Indicador lateral */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                            ${esUrgente ? 'bg-red-500' : esEvento ? 'bg-purple-500' : 'bg-blue-400'}
                        `}></div>

                        <div className="pl-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm
                                        ${esUrgente ? 'bg-red-100 text-red-600' : esEvento ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'}
                                    `}>
                                        {esUrgente ? 'Urgente' : esEvento ? 'Evento' : 'Noticia'}
                                    </span>
                                    
                                    {/* BADGE GLOBAL O CASA ESPECÍFICA */}
                                    {esGlobal ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                                            <Globe size={10} /> Global
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {anuncio.casas?.nombre || 'Casa'}
                                        </span>
                                    )}

                                    <span className="text-xs text-gray-400 font-medium ml-1">
                                        {new Date(anuncio.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                
                                {(user.id === anuncio.creado_por || esLider) && (
                                    <form action={borrarAnuncio.bind(null, anuncio.id)}>
                                        <button className="text-gray-300 hover:text-red-400 transition-colors p-2 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </form>
                                )}
                            </div>

                            <h3 className="text-xl font-black text-gray-800 mb-2 leading-tight">{anuncio.titulo}</h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{anuncio.contenido}</p>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-white shadow-sm">
                                        <img src={anuncio.perfiles?.avatar_url || `https://ui-avatars.com/api/?name=${anuncio.perfiles?.apodo}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">
                                            {anuncio.perfiles?.apodo || 'Admin'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">Autor</span>
                                    </div>
                                </div>

                                {anuncio.fecha_evento && (
                                    <div className="flex items-center gap-1.5 text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-pink-100">
                                        <Calendar size={14} />
                                        <span>{new Date(anuncio.fecha_evento).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })
        ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <MessageCircle size={32} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-gray-500 font-medium">El silencio reina...</h3>
                <p className="text-sm text-gray-400">No hay anuncios publicados todavía.</p>
            </div>
        )}
      </div>

    </div>
  )
}