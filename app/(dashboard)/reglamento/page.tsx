import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Book, Scale } from 'lucide-react'
import { BuscadorReglamento, Articulo } from '@/components/dashboard/BuscadorReglamento';

export default async function ReglamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('casa_id, casas(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil?.casa_id) return <div>No tienes casa asignada.</div>

  const casaData = perfil.casas as any
  const nombreCasa = Array.isArray(casaData) ? casaData[0]?.nombre : casaData?.nombre

  // Traer el Reglamento (Globales + Locales)
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
    .or(`casa_id.eq.${perfil.casa_id},casa_id.is.null`) 
    .order('numero_articulo', { ascending: true })
    
  const articulos = (articulosRaw as unknown as Articulo[]) || []

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* HEADER ESTATICO */}
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

      {/* COMPONENTE CLIENTE INTERACTIVO */}
      <BuscadorReglamento articulos={articulos} />
      
    </div>
  )
}