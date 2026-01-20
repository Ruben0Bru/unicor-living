import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Wallet, MessageCircle, History, AlertCircle, CheckCircle2, Coins, Calculator, PiggyBank, Landmark, TrendingUp } from 'lucide-react'

export default async function FinanzasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. MI PERFIL
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, casas(*), roles(nombre)')
    .eq('id', user.id)
    .single()

  if (!miPerfil?.casa_id) return <div>Error: No tienes casa asignada.</div>

  // Check para ver si es representante (Evitamos error de TS con safe navigation)
  const rolNombre = Array.isArray(miPerfil.roles) ? miPerfil.roles[0]?.nombre : miPerfil.roles?.nombre;
  const esRepresentante = rolNombre?.toLowerCase().includes('representante');

  // 2. TESORERO
  const { data: adminCasa } = await supabase
    .from('perfiles')
    .select('telefono')
    .eq('casa_id', miPerfil.casa_id)
    .not('telefono', 'is', null)
    .limit(1)
    .single()

  // 3. DEUDAS
  const { data: multas } = await supabase
    .from('multas')
    .select('*, sanciones(codigo_referencia)')
    .eq('residente_id', user.id)
    .order('created_at', { ascending: false })

  // 4. CLASIFICACIÓN
  const pendientes = multas?.filter(m => m.estado === 'aprobada') || []
  const historialPagos = multas?.filter(m => m.estado === 'pagada') || []

  const totalDeuda = pendientes.reduce((acc, curr) => acc + (curr.valor || 0), 0)
  
  const deudaMensualidades = pendientes
    .filter(m => m.categoria === 'mensualidad')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const deudaSanciones = pendientes
    .filter(m => m.categoria === 'sancion')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  const deudaSemestre = pendientes
    .filter(m => m.categoria === 'semestre')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0)

  // 5. LINKS
  const generarLinkPago = (concepto: string, valor: number) => {
    if (!adminCasa?.telefono || valor <= 0) return null
    const mensaje = `Hola, soy ${miPerfil.apodo}. Envío comprobante por: ${concepto} - Valor: $${valor.toLocaleString()}.`
    return `https://wa.me/${adminCasa.telefono}?text=${encodeURIComponent(mensaje)}`
  }

  const linkPagarTodo = generarLinkPago("PAGO TOTAL DEUDA", totalDeuda)
  const linkMensualidades = generarLinkPago("Pago Mensualidad", deudaMensualidades)
  const linkSanciones = generarLinkPago("Pago Sanciones", deudaSanciones)
  const linkSemestre = generarLinkPago("Pago Cuota Semestral", deudaSemestre)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
             <Wallet size={24} />
           </span>
           Billetera
        </h1>
        <p className="text-gray-500">Gestión financiera de {miPerfil.apodo}.</p>
      </div>

      {/* --- TARJETA PRINCIPAL (Total) --- */}
      <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-3xl group-hover:bg-indigo-400 transition-colors duration-700"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Calculator size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Total Pendiente</span>
                  </div>
                  <h2 className={`text-5xl font-black tracking-tighter ${totalDeuda > 0 ? 'text-white' : 'text-green-400'}`}>
                      ${totalDeuda.toLocaleString()}
                  </h2>
                  <p className="text-sm text-gray-400 mt-2">
                      {totalDeuda > 0 ? "Tienes cobros pendientes." : "¡Estás al día!"}
                  </p>
              </div>

              {totalDeuda > 0 && linkPagarTodo ? (
                  <a href={linkPagarTodo} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2 transform hover:-translate-y-1">
                      <MessageCircle size={20} className="text-green-600" />
                      <span>Saldar Todo</span>
                  </a>
              ) : (
                  <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/10 backdrop-blur-sm animate-pulse">
                      <span className="font-bold text-green-400 flex items-center gap-2">
                          <CheckCircle2 size={18} /> Paz y Salvo
                      </span>
                  </div>
              )}
          </div>
      </div>

      {/* --- GRID DE TARJETAS (Semestre + Mes) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 🏛️ LA CARD AZUL (Semestre) - ¡Regresó! */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg group hover:shadow-indigo-500/40 transition-shadow">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 opacity-80 mb-2">
                      <Landmark size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Valor Semestral</span>
                  </div>
                  <div className="flex items-end justify-between">
                      <div>
                        {esRepresentante ? (
                            <div>
                                <h3 className="text-3xl font-black">$0</h3>
                                <span className="text-[10px] bg-white/20 px-2 py-1 rounded text-white font-medium border border-white/20">
                                    Beneficio Representante
                                </span>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-3xl font-black">
                                    ${deudaSemestre > 0 ? deudaSemestre.toLocaleString() : "0"}
                                </h3>
                                <p className="text-xs text-indigo-200 mt-1">
                                    {deudaSemestre > 0 ? "Cuota pendiente" : "Pagado / No generado"}
                                </p>
                            </div>
                        )}
                      </div>
                      
                      {deudaSemestre > 0 && linkSemestre && (
                          <a href={linkSemestre} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 backdrop-blur-sm">
                              <MessageCircle size={14} /> Pagar
                          </a>
                      )}
                  </div>
              </div>
          </div>

          {/* 🪙 Tarjeta Mes */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                      <Coins size={20} />
                      <span className="text-xs font-bold uppercase tracking-widest">Mensualidades</span>
                  </div>
                  {deudaMensualidades > 0 && (
                      <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Pendiente</span>
                  )}
              </div>
              
              <div className="flex items-end justify-between">
                  <div>
                    <h3 className={`text-3xl font-black ${deudaMensualidades > 0 ? 'text-gray-800' : 'text-green-500'}`}>
                        ${deudaMensualidades.toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Acumulado</p>
                  </div>
                  
                  {deudaMensualidades > 0 && linkMensualidades && (
                      <a href={linkMensualidades} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1">
                          <MessageCircle size={14} /> Pagar
                      </a>
                  )}
              </div>
          </div>
      </div>

      {/* --- OTRAS SANCIONES --- */}
      {deudaSanciones > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <div className="bg-red-100 p-3 rounded-full text-red-500">
                    <AlertCircle size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-red-700">Multas de Convivencia</h3>
                    <p className="text-sm text-red-500">Tienes sanciones por pagar.</p>
                 </div>
            </div>
            <div className="text-right">
                <p className="text-2xl font-black text-red-600">${deudaSanciones.toLocaleString()}</p>
                {linkSanciones && (
                    <a href={linkSanciones} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-red-700 hover:underline">
                        Pagar ahora &rarr;
                    </a>
                )}
            </div>
        </div>
      )}

      {/* --- DETALLE --- */}
      <div className="mt-8">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="text-gray-400" size={20} />
            Detalle de Cobros
        </h3>
        
        {pendientes.length > 0 ? (
            <div className="grid gap-3">
                {pendientes.map((m) => {
                    const sancionesRaw = m.sanciones as any;
                    let concepto = m.descripcion_personalizada;
                    if (!concepto) {
                         concepto = Array.isArray(sancionesRaw) 
                            ? sancionesRaw[0]?.codigo_referencia 
                            : sancionesRaw?.codigo_referencia || "Cobro General";
                    }
                    
                    const valor = m.valor || 0;
                    const link = generarLinkPago(`Pago de: ${concepto}`, valor);

                    return (
                        <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-indigo-100 transition-colors">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className={`p-3 rounded-xl transition-colors ${m.categoria === 'mensualidad' ? 'bg-orange-50 text-orange-500' : m.categoria === 'semestre' ? 'bg-indigo-50 text-indigo-500' : 'bg-red-50 text-red-500'}`}>
                                    {m.categoria === 'mensualidad' ? <Coins size={20} /> : m.categoria === 'semestre' ? <Landmark size={20} /> : <AlertCircle size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{concepto}</p>
                                    <p className="text-xs text-gray-500 capitalize">{m.categoria} • {new Date(m.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-lg font-bold text-gray-700">${valor.toLocaleString()}</span>
                                {link && (
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="bg-gray-50 text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2">
                                        <MessageCircle size={16} /> Pagar
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center opacity-70">
                <PiggyBank className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-400 font-medium">No tienes cobros pendientes.</p>
            </div>
        )}
      </div>
      
      {/* HISTORIAL */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 opacity-80 hover:opacity-100 transition-opacity mt-8">
         <div className="flex items-center gap-3 mb-4">
            <History className="text-gray-400" size={20} />
            <h3 className="font-bold text-gray-700 text-sm">Historial de Pagos</h3>
         </div>
         {historialPagos.length > 0 ? (
            <div className="space-y-2">
               {historialPagos.map((pago) => {
                  const concepto = pago.descripcion_personalizada || "Pago realizado";
                  return (
                    <div key={pago.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-600">{concepto}</span>
                        <span className="text-xs font-mono text-gray-500 line-through decoration-green-500 decoration-2">${pago.valor?.toLocaleString()}</span>
                    </div>
                  )
               })}
            </div>
         ) : <p className="text-xs text-gray-400 italic">Sin registros de pagos anteriores.</p>}
      </div>

    </div>
  )
}