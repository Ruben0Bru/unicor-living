import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Trophy, Siren, Activity, CheckCircle2, AlertOctagon } from 'lucide-react'
import { CasaSelectorClient } from '@/components/dashboard/CasaSelectorCliente'

export default async function BienestarDashboard(props: {
  searchParams: Promise<{ casa?: string }>
}) {
  const searchParams = await props.searchParams
  const filtroCasaId = searchParams.casa

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. SEGURIDAD: Verificar Rol
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, roles(id, nombre)')
    .eq('id', user.id)
    .single()

  const rolId = miPerfil?.roles?.id;
  if (rolId !== 6 && rolId !== 7) redirect('/'); // Solo Bienestar(6) o Admin(7)

  // 2. OBTENER LISTA DE CASAS (Para el Dropdown)
  const { data: listaCasas } = await supabase
    .from('casas')
    .select('id, nombre, genero')
    .neq('nombre', 'Sede Administrativa') 
    .order('nombre')

  // --- CONSTRUCCIÓN DE CONSULTAS DINÁMICAS ---
  
  // 1. RESIDENTES (Población)
  // Filtramos para que NO cuente a Bienestar (6) ni Admins (7) como población.
  let queryResidentes = supabase
      .from('perfiles')
      .select('id, apodo, avatar_url, nombre_completo, casa_id, rol_id')
      .neq('rol_id', 6) // No contar Bienestar
      .neq('rol_id', 7) // No contar Admins
      .not('casa_id', 'is', null) // Solo gente con casa asignada

  let queryMultas = supabase.from('multas').select('residente_id, estado, casa_id')
  let queryTareas = supabase.from('asignaciones').select('residente_id, realizado, casa_id')

  // Aplicar filtro de casa si existe
  if (filtroCasaId && filtroCasaId !== 'all') {
      queryResidentes = queryResidentes.eq('casa_id', filtroCasaId)
      queryMultas = queryMultas.eq('casa_id', filtroCasaId)
      queryTareas = queryTareas.eq('casa_id', filtroCasaId)
  }

  // Ejecutar consultas en paralelo
  const [resResidentes, resMultas, resTareas] = await Promise.all([
      queryResidentes,
      queryMultas,
      queryTareas
  ])

  const residentes = resResidentes.data || []
  const multas = resMultas.data || []
  const tareas = resTareas.data || []

  // --- CÁLCULO DE ESTADÍSTICAS ---
  const totalResidentes = residentes.length
  
  const statsResidentes = residentes.map(res => {
      // Multas
      const misMultas = multas.filter(m => m.residente_id === res.id && (m.estado === 'aprobada' || m.estado === 'pendiente'))
      const multasCount = misMultas.length
      const deudaActiva = multas.some(m => m.residente_id === res.id && m.estado === 'aprobada')

      // Tareas
      const misTareas = tareas.filter(t => t.residente_id === res.id)
      const tareasHechas = misTareas.filter(t => t.realizado).length
      const totalAsignadas = misTareas.length || 1
      const efectividad = Math.round((tareasHechas / totalAsignadas) * 100)

      return { ...res, multasCount, deudaActiva, efectividad }
  })

  // Rankings
  const topProblematicos = [...statsResidentes]
      .sort((a, b) => b.multasCount - a.multasCount)
      .slice(0, 3)
      .filter(r => r.multasCount > 0)

  const topJuiciosos = [...statsResidentes]
      .filter(r => r.multasCount === 0)
      .sort((a, b) => b.efectividad - a.efectividad)
      .slice(0, 3)

  const morosos = statsResidentes.filter(r => r.deudaActiva).length
  const alDia = totalResidentes - morosos
  const porcentajeConvivencia = totalResidentes > 0 ? Math.round((alDia / totalResidentes) * 100) : 0

  // --- LÓGICA DEL TÍTULO DINÁMICO ---
  const casaSeleccionada = listaCasas?.find(c => c.id === filtroCasaId);
  let subTituloHeader = 'Panorama general de todas las sedes.';
  
  if (casaSeleccionada) {
      const g = casaSeleccionada.genero?.toLowerCase() || '';
      // Lógica simple para detectar género
      const etiqueta = g.startsWith('f') ? 'Mujeres' : (g.startsWith('m') && g.includes('asc') ? 'Varones' : 'Mixta');
      subTituloHeader = `Analizando: ${casaSeleccionada.nombre} (${etiqueta})`;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* HEADER CON SELECTOR DE CASA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-900 text-white rounded-2xl shadow-lg">
                <Activity size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900">Auditoría Global</h1>
                <p className="text-gray-500 font-medium">
                    {filtroCasaId && filtroCasaId !== 'all' 
                        ? subTituloHeader
                        : 'Panorama general de todas las sedes.'}
                </p>
            </div>
        </div>

        {/* COMPONENTE CLIENTE DE FILTRO */}
        <CasaSelectorClient casas={listaCasas || []} casaActual={filtroCasaId || 'all'} />
      </div>

      {/* --- KPIs GENERALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KPI 1: POBLACIÓN */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Estudiantes Residentes</p>
                  <h3 className="text-5xl font-black text-indigo-900 mt-2">{totalResidentes}</h3>
                  <p className="text-xs text-gray-400 mt-1">Total registrados</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Users size={32} /></div>
          </div>

          {/* KPI 2: ÍNDICE DE PAZ */}
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Convivencia Sana</p>
                  <h3 className={`text-5xl font-black mt-2 ${porcentajeConvivencia > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                      {porcentajeConvivencia}%
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Residentes sin deudas</p>
              </div>
              <div className={`p-4 rounded-2xl ${porcentajeConvivencia > 70 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                  <CheckCircle2 size={32} />
              </div>
          </div>

          {/* KPI 3: FOCOS ROJOS */}
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Requieren Atención</p>
                  <h3 className="text-5xl font-black text-red-600 mt-2">{morosos}</h3>
                  <p className="text-xs text-gray-400 mt-1">Con sanciones activas</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl text-red-600"><Siren size={32} /></div>
          </div>
      </div>

      {/* --- LISTAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CUADRO DE HONOR */}
          <div className="bg-gradient-to-br from-white to-green-50/50 rounded-3xl border border-green-100 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-green-800 flex items-center gap-2 mb-6">
                  <Trophy className="text-yellow-500" /> Los Más Juiciosos
              </h3>
              {topJuiciosos.length > 0 ? (
                <div className="space-y-4">
                  {topJuiciosos.map((res, idx) => (
                      <div key={res.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-green-50">
                          <div className="font-black text-2xl text-green-200 w-6">#{idx + 1}</div>
                          <div className="w-12 h-12 rounded-full border-2 border-green-200 overflow-hidden">
                              <img src={res.avatar_url} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-gray-800">{res.apodo}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{res.efectividad}% Efec.</span>
                                  {(!filtroCasaId || filtroCasaId === 'all') && (
                                     <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                        {listaCasas?.find(c => c.id === res.casa_id)?.nombre}
                                     </span>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10 text-sm">Aún no hay datos suficientes de tareas.</p>
              )}
          </div>

          {/* LISTA NEGRA */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                  <AlertOctagon className="text-red-500" /> Top Infractores
              </h3>
              {topProblematicos.length > 0 ? (
                <div className="space-y-4">
                  {topProblematicos.map((res, idx) => (
                      <div key={res.id} className="flex items-center gap-4 bg-red-50/30 p-4 rounded-2xl border border-red-50">
                           <div className="w-12 h-12 rounded-full border-2 border-red-100 overflow-hidden grayscale">
                                  <img src={res.avatar_url} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1">
                               <h4 className="font-bold text-gray-800">{res.apodo}</h4>
                               {(!filtroCasaId || filtroCasaId === 'all') && (
                                     <p className="text-[10px] text-gray-500 mt-0.5">
                                        {listaCasas?.find(c => c.id === res.casa_id)?.nombre}
                                     </p>
                               )}
                           </div>
                           <div className="text-right">
                               <span className="block font-black text-xl text-red-600">{res.multasCount}</span>
                               <span className="text-[10px] font-bold text-red-400 uppercase">Faltas</span>
                           </div>
                      </div>
                  ))}
                </div>
               ) : (
                 <div className="text-center py-10 flex flex-col items-center">
                    <CheckCircle2 size={40} className="text-green-100 mb-2" />
                    <p className="text-gray-400 text-sm">¡Excelente! No hay residentes problemáticos.</p>
                 </div>
               )}
          </div>
      </div>
    </div>
  )
}