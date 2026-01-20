import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Wallet, MessageCircle, History, AlertCircle, CheckCircle2, TrendingUp, Landmark, Coins, Calculator } from 'lucide-react'

export default async function FinanzasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. MI PERFIL Y MI CASA
  // Traemos el perfil con las relaciones
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select(`
      id, 
      casa_id, 
      apodo, 
      roles ( nombre ), 
      casas ( valor_semestre, valor_mensual )
    `)
    .eq('id', user.id)
    .single()

  if (!miPerfil?.casa_id) return <div>Error: No tienes casa asignada.</div>

  // 2. BUSCAR AL TESORERO
  const { data: adminCasa } = await supabase
    .from('perfiles')
    .select('telefono')
    .eq('casa_id', miPerfil.casa_id)
    .eq('rol_id', 3) 
    .not('telefono', 'is', null)
    .limit(1)
    .single()

  // 3. CONSULTAR MULTAS
  const { data: multas } = await supabase
    .from('multas')
    .select('*, sanciones(codigo_referencia)')
    .eq('residente_id', user.id)
    .order('created_at', { ascending: false })

  const multasPendientes = multas?.filter(m => m.estado === 'aprobada') || []
  const historialPagos = multas?.filter(m => m.estado === 'pagada') || []

  // --- 🛠️ ZONA DE REPARACIÓN DE TYPESCRIPT 🛠️ ---
  
  // 1. Arreglamos ROLES:
  // TypeScript cree que es un array. Lo forzamos a 'any' y verificamos.
  const rolesRaw = miPerfil.roles as any;
  const rolData = Array.isArray(rolesRaw) ? rolesRaw[0] : rolesRaw;
  const nombreRol = rolData?.nombre?.toLowerCase() || '';
  
  // Verificamos si es "Representante" o "Admin"
  const esRepresentante = nombreRol.includes('representante') || nombreRol.includes('administrador') || nombreRol.includes('admin');

  // 2. Arreglamos CASAS:
  // Lo mismo, verificamos si Supabase nos mandó un array o un objeto.
  const casasRaw = miPerfil.casas as any;
  const casaData = Array.isArray(casasRaw) ? casasRaw[0] : casasRaw;
  
  const costoSemestre = esRepresentante ? 0 : (casaData?.valor_semestre || 0);
  const costoMensual = casaData?.valor_mensual || 0;
  const totalMultas = multasPendientes.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // ----------------------------------------------------

  // 5. CÁLCULO DEUDA TOTAL 💰
  const deudaTotal = costoSemestre + costoMensual + totalMultas

  // Helpers
  const generarLinkPago = (concepto: string, valor: number) => {
    if (!adminCasa?.telefono) return null
    const mensaje = `Hola, soy ${miPerfil.apodo}. Envío comprobante por: ${concepto} - Valor: $${valor.toLocaleString()}.`
    return `https://wa.me/${adminCasa.telefono}?text=${encodeURIComponent(mensaje)}`
  }

  const linkSemestre = generarLinkPago("Cuota Semestral (Casa)", costoSemestre)
  const linkMensual = generarLinkPago("Aporte Mensual (Insumos)", costoMensual)
  const linkPagarTodo = generarLinkPago("PAGO TOTAL (Semestre + Mes + Multas)", deudaTotal)

  return (
    <div className="space-y-8">
      
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

      {/* --- TARJETA DEUDA TOTAL --- */}
      <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Calculator size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Total a Pagar</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter">
                      ${deudaTotal.toLocaleString()}
                  </h2>
                  <p className="text-sm text-gray-400 mt-2">
                      Incluye: Semestre + Mensualidad + {multasPendientes.length} Multas
                  </p>
              </div>

              {deudaTotal > 0 && linkPagarTodo ? (
                  <a href={linkPagarTodo} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2">
                      <MessageCircle size={20} className="text-green-600" />
                      <span>Saldar Todo</span>
                  </a>
              ) : (
                  <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/10 backdrop-blur-sm">
                      <span className="font-bold text-green-400 flex items-center gap-2">
                          <CheckCircle2 size={18} /> Paz y Salvo
                      </span>
                  </div>
              )}
          </div>
      </div>

      {/* --- COSTOS FIJOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Semestre */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
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
                                <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium border border-white/20">
                                    Beneficio Representante
                                </span>
                            </div>
                        ) : (
                            <h3 className="text-3xl font-black">${costoSemestre.toLocaleString()}</h3>
                        )}
                      </div>
                      {!esRepresentante && linkSemestre && (
                          <a href={linkSemestre} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 backdrop-blur-sm">
                              <MessageCircle size={14} /> Pagar
                          </a>
                      )}
                  </div>
              </div>
          </div>

          {/* Mensual */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-700 relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-500 mb-2">
                      <Coins size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Aporte Mensual</span>
                  </div>
                  <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-3xl font-black text-gray-800">${costoMensual.toLocaleString()}</h3>
                        <p className="text-xs text-gray-400">Insumos y gastos comunes</p>
                      </div>
                      {linkMensual && (
                          <a href={linkMensual} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1">
                              <MessageCircle size={14} /> Pagar
                          </a>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* --- MULTAS PENDIENTES --- */}
      <div>
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            Sanciones Pendientes
        </h3>
        
        {multasPendientes.length > 0 ? (
            <div className="grid gap-4">
                {multasPendientes.map((m) => {
                    // FIX: Casteamos a 'any' para evitar errores de TS al leer sanciones
                    const sancionesRaw = m.sanciones as any;
                    const concepto = Array.isArray(sancionesRaw) 
                        ? sancionesRaw[0]?.codigo_referencia 
                        : sancionesRaw?.codigo_referencia || "Multa";
                    
                    const valor = m.valor || 0;
                    const link = generarLinkPago(`Multa: ${concepto}`, valor);

                    return (
                        <div key={m.id} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-red-200 transition-colors">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="p-3 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-100 transition-colors">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{concepto}</p>
                                    <p className="text-xs text-gray-500">Fecha: {new Date(m.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-xl font-black text-gray-800">${valor.toLocaleString()}</span>
                                
                                {link ? (
                                    <a href={link} target="_blank" rel="noopener noreferrer" 
                                       className="bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2">
                                        <MessageCircle size={16} />
                                        Pagar
                                    </a>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Sin tesorero</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center opacity-70">
                <p className="text-sm text-gray-400 font-medium">No tienes multas pendientes.</p>
            </div>
        )}
      </div>

      {/* --- HISTORIAL --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 opacity-80 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-3 mb-4">
            <History className="text-gray-400" size={20} />
            <h3 className="font-bold text-gray-700 text-sm">Historial de Multas Pagadas</h3>
         </div>
         {historialPagos.length > 0 ? (
            <div className="space-y-2">
               {historialPagos.map((pago) => {
                  const sancionesRaw = pago.sanciones as any;
                  const concepto = Array.isArray(sancionesRaw) 
                      ? sancionesRaw[0]?.codigo_referencia 
                      : sancionesRaw?.codigo_referencia || "Pago";

                  return (
                    <div key={pago.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-600">{concepto}</span>
                        <span className="text-xs font-mono text-gray-500">${pago.valor?.toLocaleString()}</span>
                    </div>
                  )
               })}
            </div>
         ) : <p className="text-xs text-gray-400 italic">Sin registros.</p>}
      </div>
    </div>
  )
}