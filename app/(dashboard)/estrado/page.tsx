import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Gavel, CheckCircle2, XCircle, AlertTriangle, Scale, ShieldAlert } from 'lucide-react'
import { sentenciarMulta } from './actions'

export default async function EstradoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Verificar Autoridad (Representante ID 5 o Admin ID 7)
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, roles(id, nombre)')
    .eq('id', user.id)
    .single()

  const rolId = miPerfil?.roles?.id
  const esJuez = rolId === 5 || rolId === 7 

  if (!esJuez) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
              <ShieldAlert size={64} className="mb-4" />
              <h1 className="text-2xl font-bold">Acceso Restringido</h1>
              <p>Solo el Representante de Casa puede entrar al Estrado.</p>
          </div>
      )
  }

  // 2. Traer expedientes PENDIENTES
  const { data: expedientes } = await supabase
    .from('multas')
    .select(`
        *,
        sanciones(codigo_referencia, descripcion),
        acusador:perfiles!acusador_id(apodo, avatar_url),
        acusado:perfiles!residente_id(apodo, avatar_url, nombre_completo)
    `)
    .eq('casa_id', miPerfil.casa_id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true }) // Las más antiguas primero

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="p-4 bg-gray-900 text-white rounded-2xl shadow-lg">
            <Gavel size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-black text-gray-900">El Estrado</h1>
            <p className="text-gray-500">Sala de aprobación de sanciones.</p>
        </div>
      </div>

      {expedientes && expedientes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expedientes.map((caso) => (
                <div key={caso.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                    
                    {/* Badge de Bienestar (Si aplica) */}
                    {caso.es_bienestar && (
                        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                            BIENESTAR (x2)
                        </div>
                    )}

                    {/* Cabecera del Caso */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-red-100 overflow-hidden">
                                <img src={caso.acusado?.avatar_url} alt="Acusado" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg leading-none">{caso.acusado?.apodo}</h3>
                                <p className="text-xs text-gray-400 mt-1">{caso.acusado?.nombre_completo}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block font-black text-2xl text-gray-800">${caso.valor?.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Multa Propuesta</span>
                        </div>
                    </div>

                    {/* Detalles de la Infracción */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} className="text-orange-500" />
                            <span className="font-bold text-gray-700 text-sm">{caso.sanciones?.codigo_referencia}</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{caso.descripcion_personalizada || caso.sanciones?.descripcion}"</p>
                        
                        {/* Evidencia */}
                        {caso.evidencia_url && (
                            <a href={caso.evidencia_url} target="_blank" className="mt-3 block text-xs text-blue-600 font-bold hover:underline">
                                📎 Ver Evidencia Adjunta
                            </a>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                            <span className="text-xs text-gray-400">Acusador:</span>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-gray-300 overflow-hidden">
                                     <img src={caso.acusador?.avatar_url} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-bold text-gray-600">{caso.acusador?.apodo}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botones de Sentencia */}
                    <div className="grid grid-cols-2 gap-3">
                        <form action={sentenciarMulta.bind(null, caso.id, 'rechazada')} className="w-full">
                            <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                                <XCircle size={20} /> Desestimar
                            </button>
                        </form>
                        <form action={sentenciarMulta.bind(null, caso.id, 'aprobada')} className="w-full">
                            <button className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2">
                                <Gavel size={20} /> Sentenciar
                            </button>
                        </form>
                    </div>

                </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Scale size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">La Corte está en receso</h3>
            <p className="text-gray-500 mt-2">No hay multas pendientes de aprobación.</p>
        </div>
      )}
    </div>
  )
}