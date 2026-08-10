import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Scale, Plus, Trash2, ArrowLeft, Building2, UserCog } from 'lucide-react'
import Link from 'next/link'
import { crearArticulo, eliminarArticulo } from './actions'
// 👇 IMPORTAR EL COMPONENTE CLIENTE
import { BotonAgregarSancion } from './BotonAgregarSancion'

// 👇 1. TIPOS FUERTES
type Sancion = {
    valor_base: number
    codigo_referencia: string
}

type Casa = {
    id: string
    nombre: string
    genero?: string
}

type ArticuloReglamento = {
    id: string
    casa_id: string
    numero_articulo: string
    capitulo: string
    titulo: string
    descripcion_texto: string
    casas: Casa | Casa[] | null 
    sanciones: Sancion[]
}

export default async function EditorLegislativoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Verificar Permisos y Rol
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('casa_id, roles(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  const rolesData = perfil.roles as any
  const nombreRol = (Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData?.nombre || '').toLowerCase()
  
  const esAdmin = nombreRol.includes('admin')
  const esRepresentante = nombreRol.includes('representante')

  if (!esAdmin && !esRepresentante) {
      return <div className="p-10 text-center text-gray-500">Acceso denegado.</div>
  }

  // 2. Obtener datos según el rol
  let articulos: ArticuloReglamento[] = []
  let casasDisponibles: Casa[] = []

  if (esAdmin) {
      // ADMIN: Trae TODO
      const { data: allReglamento } = await supabase
        .from('reglamento')
        .select(`
            *,
            casas (id, nombre),
            sanciones (valor_base, codigo_referencia)
        `)
        .order('casa_id')
        .order('numero_articulo', { ascending: true })
      
      articulos = (allReglamento as unknown as ArticuloReglamento[]) || []

      const { data: allCasas } = await supabase
        .from('casas')
        .select('id, nombre, genero')
        .order('nombre')
      
      casasDisponibles = allCasas || []

  } else {
// REPRESENTANTE: Trae Globales + Su casa
    const { data: myReglamento } = await supabase
    .from('reglamento')
    .select(`
        *,
        casas (id, nombre),
        sanciones (valor_base, codigo_referencia)
    `)
    .or(`casa_id.eq.${perfil.casa_id},casa_id.is.null`) // Filtro de herencia
    .order('numero_articulo', { ascending: true })
      
      articulos = (myReglamento as unknown as ArticuloReglamento[]) || []
  }

  // Helper para mostrar género
  const getCasaLabel = (nombre: string, genero?: string) => {
      const g = (genero || '').toLowerCase();
      let suffix = '';
      if (g.startsWith('m') && g.includes('asc')) suffix = 'Varones';
      else if (g.startsWith('f')) suffix = 'Mujeres';
      else if (g.includes('mix')) suffix = 'Mixta';
      return suffix ? `${nombre} (${suffix})` : nombre;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
            <Link href={esAdmin ? "/admin" : "/"} className="text-sm text-gray-400 hover:text-gray-800 flex items-center gap-1 mb-2 transition-colors">
                <ArrowLeft size={14} /> Volver
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Scale className="text-slate-800" /> 
                {esAdmin ? "Legislación Global" : "Reglamento Interno"}
            </h1>
            <p className="text-gray-500">
                {esAdmin ? "Gestión de normas para todas las sedes." : "Edición de normas de tu casa."}
            </p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl text-slate-600 text-sm font-bold flex items-center gap-2">
            <UserCog size={16} /> 
            {esAdmin ? "Modo Administrador" : "Modo Representante"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUMNA 1: FORMULARIO DE CREACIÓN --- */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 sticky top-4">
                <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="bg-indigo-100 text-indigo-600 rounded p-0.5" size={20} />
                    Nueva Norma
                </h2>
                
                <form action={crearArticulo} className="space-y-4">
                    
                    {/* SELECTOR DE CASA (SOLO ADMIN) */}
                    {esAdmin ? (
                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            <label className="block text-xs font-bold text-indigo-800 uppercase mb-1 flex items-center gap-1">
                                <Building2 size={12} /> Asignar a Sede:
                            </label>
                            <select name="casa_id" required defaultValue="GLOBAL" className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                                <option value="GLOBAL">🌍 Reglamento Global (Todas las sedes)</option>
                                <option value="" disabled>-- Reglas Específicas --</option>
                                {casasDisponibles.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {getCasaLabel(c.nombre, c.genero)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <input type="hidden" name="casa_id" value={perfil.casa_id} />
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capítulo</label>
                        <input type="text" name="capitulo" placeholder="Ej: Convivencia" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-700" required />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No.</label>
                            <input type="number" name="numero" placeholder="1" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-700" required />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                            <input type="text" name="titulo" placeholder="Prohibido Fumar" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-700" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Legal</label>
                        <textarea name="descripcion" rows={3} placeholder="Texto completo..." className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 resize-none" required></textarea>
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 mb-3">
                            <input type="checkbox" name="crear_sancion" id="crear_sancion" className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                            <label htmlFor="crear_sancion" className="text-sm font-bold text-red-700 cursor-pointer select-none">
                                Asociar Multa
                            </label>
                        </div>
                        <div className="space-y-2">
                            <input type="text" name="codigo_sancion" placeholder="Código (Ej: A-05)" className="w-full p-2 bg-white rounded-lg border border-red-200 text-xs outline-none focus:border-red-400" />
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input type="number" name="precio_multa" placeholder="Valor" className="w-full pl-6 p-2 bg-white rounded-lg border border-red-200 text-xs outline-none focus:border-red-400" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-transform active:scale-95 shadow-md">
                        {esAdmin ? "Promulgar Ley (Sede)" : "Agregar Norma Local"}
                    </button>
                </form>
            </div>
        </div>

        {/* --- COLUMNA 2: LISTA VIGENTE --- */}
        <div className="lg:col-span-2 space-y-6">
            
            {articulos.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                    <p className="text-gray-400">No hay leyes registradas.</p>
                </div>
            )}

            {articulos.map((art) => {
                const casaNombre = art.casa_id === null 
                ? '🌍 GLOBAL' 
                : (Array.isArray(art.casas) ? art.casas[0]?.nombre : (art.casas as any)?.nombre || 'Sin Sede');
                return (
                    <div key={art.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 group hover:border-indigo-200 transition-colors relative">
                        
                        {/* Badge de Sede (Solo Admin) */}
                        {esAdmin && (
                            <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-gray-200">
                                {casaNombre}
                            </div>
                        )}

                        <div className="flex-1 pt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{art.capitulo}</span>
                                <span className="text-indigo-600 font-black text-sm">Art. {art.numero_articulo}</span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg mb-2">{art.titulo}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{art.descripcion_texto}</p>

                            {/* LISTA DE SANCIONES (Mapeo completo) */}
                            {art.sanciones && art.sanciones.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {art.sanciones.map((s, idx) => (
                                        <div key={idx} className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-red-100">
                                            <Scale size={10} /> 
                                            <span>{s.codigo_referencia}: ${s.valor_base.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 👇 BOTÓN INTERACTIVO PARA AGREGAR MÁS SANCIONES */}
                            <BotonAgregarSancion reglamentoId={art.id} />
                        </div>

                        <div className="flex items-start justify-end mt-2 md:mt-0">
                            <form action={eliminarArticulo.bind(null, art.id)}>
                                <button className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Derogar Ley">
                                    <Trash2 size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )
            })}
        </div>

      </div>
    </div>
  )
}