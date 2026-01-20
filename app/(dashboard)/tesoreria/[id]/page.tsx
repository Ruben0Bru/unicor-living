import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { User, Wallet, Calendar, CheckCircle2, History, ArrowLeft, AlertCircle, Coins, Landmark } from 'lucide-react'
import Link from 'next/link'
import { registrarPago } from '../actions'

export default async function DetalleDeudorPage({ params }: { params: { id: string } }) {
  // Await params antes de usarlos (Requisito de Next.js recientes)
  const { id } = await params
    
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. VERIFICAR PERMISOS (Solo Tesorero entra aquí)
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, roles(nombre)')
    .eq('id', user.id)
    .single()

  const nombreRol = miPerfil?.roles?.nombre?.toLowerCase() || ''
  const esTesorero = nombreRol.includes('tesorero') || nombreRol.includes('admin') || nombreRol.includes('representante')

  if (!esTesorero) redirect('/tesoreria')

  // 2. OBTENER AL DEUDOR
  const { data: deudor } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!deudor) notFound()

  // 3. OBTENER SUS DEUDAS (Pendientes e Historial)
  const { data: multas } = await supabase
    .from('multas')
    .select('*, sanciones(codigo_referencia)')
    .eq('residente_id', id)
    .order('created_at', { ascending: false })

  const pendientes = multas?.filter(m => m.estado === 'aprobada') || []
  const pagadas = multas?.filter(m => m.estado === 'pagada') || []

  const totalDeuda = pendientes.reduce((acc, curr) => acc + (curr.valor || 0), 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Botón Volver */}
      <Link href="/tesoreria" className="inline-flex items-center text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={18} className="mr-1" /> Volver a la lista
      </Link>

      {/* ENCABEZADO DEL PERFIL */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md">
              {deudor.avatar_url ? (
                  <img src={deudor.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : <User className="w-full h-full p-6 text-gray-400" />}
          </div>
          
          <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{deudor.apodo}</h1>
              <p className="text-gray-500">{deudor.nombre_completo}</p>
              
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-bold border border-red-100 flex items-center gap-2">
                      <Wallet size={16} />
                      Debe: ${totalDeuda.toLocaleString()}
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold border border-gray-200">
                      Historial: {pagadas.length} pagos
                  </div>
              </div>
          </div>
      </div>

      {/* FORMULARIO DE PAGO (CAJA REGISTRADORA) */}
      <div className="bg-white rounded-3xl shadow-lg border border-indigo-100 overflow-hidden">
          <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                  <Coins className="text-yellow-400" />
                  Caja Registradora
              </h2>
              <span className="text-xs bg-white/20 px-2 py-1 rounded text-gray-300">Selecciona para pagar</span>
          </div>

          {pendientes.length > 0 ? (
              <form action={registrarPago} className="p-0">
                  <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                      {pendientes.map((m) => {
                          const sancionesRaw = m.sanciones as any;
                          let concepto = m.descripcion_personalizada;
                          if (!concepto) {
                              concepto = Array.isArray(sancionesRaw) 
                                ? sancionesRaw[0]?.codigo_referencia 
                                : sancionesRaw?.codigo_referencia || "Cobro";
                          }

                          return (
                              <label key={m.id} className="flex items-center gap-4 p-4 hover:bg-indigo-50 transition-colors cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    name="multa_id" 
                                    value={m.id} 
                                    className="w-6 h-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                  />
                                  
                                  <div className="flex-1">
                                      <div className="flex justify-between items-center">
                                          <span className="font-bold text-gray-800 group-hover:text-indigo-700">{concepto}</span>
                                          <span className="font-mono font-bold text-gray-900">${m.valor?.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold
                                              ${m.categoria === 'mensualidad' ? 'bg-orange-100 text-orange-600' : 
                                                m.categoria === 'semestre' ? 'bg-indigo-100 text-indigo-600' : 
                                                'bg-red-100 text-red-600'}
                                          `}>
                                              {m.categoria}
                                          </span>
                                          <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                              </label>
                          )
                      })}
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center gap-2">
                          <CheckCircle2 size={20} />
                          Registrar Pago
                      </button>
                  </div>
              </form>
          ) : (
              <div className="p-10 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800">¡Paz y Salvo!</h3>
                  <p className="text-gray-400 mt-2">Este residente no tiene deudas pendientes.</p>
              </div>
          )}
      </div>

      {/* HISTORIAL DE PAGOS */}
      {pagadas.length > 0 && (
          <div className="opacity-70 hover:opacity-100 transition-opacity">
              <h3 className="font-bold text-gray-500 mb-3 flex items-center gap-2 px-2">
                  <History size={18} /> Historial Reciente
              </h3>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {pagadas.map((p) => {
                      const concepto = p.descripcion_personalizada || "Pago antiguo";
                      return (
                          <div key={p.id} className="p-4 flex justify-between items-center">
                              <div>
                                  <p className="font-medium text-gray-600 line-through decoration-green-400 decoration-2">{concepto}</p>
                                  <p className="text-xs text-gray-400">Pagado el: {new Date(p.updated_at || p.created_at).toLocaleDateString()}</p>
                              </div>
                              <span className="text-gray-400 font-mono text-sm">${p.valor?.toLocaleString()}</span>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

    </div>
  )
}