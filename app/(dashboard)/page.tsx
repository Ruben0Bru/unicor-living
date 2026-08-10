import { createClient } from '@/utils/supabase/server';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
    AlertCircle, PlusCircle, Sparkles, CheckSquare, Square, 
    Coffee, ClipboardCheck, Megaphone, PartyPopper, Clock, 
    AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight 
} from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. OBTENER PERFIL (Una sola vez)
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, casas(nombre), roles(nombre)')
    .eq('id', user.id)
    .single();

// 2. REDIRECCIÓN BASADA EN ROLES 🚨
  const rawRol = perfil?.roles as any;
  const nombreRol = (rawRol?.nombre || rawRol?.[0]?.nombre || '').toLowerCase();

  // El Admin tiene prioridad y va a su propio panel
  if (nombreRol.includes('admin')) {
      redirect('/admin');
  }

  // Bienestar va a su vista específica
  if (nombreRol.includes('bienestar')) {
      redirect('/bienestar');
  }

  // --- ZONA HORARIA ---
  const fechaServer = new Date();
  fechaServer.setHours(fechaServer.getHours() - 5); 
  const hoy = fechaServer.toISOString().split('T')[0];

  // --- ACTIONS ---
  async function marcarTareaCompletada(asignacionId: string) {
    'use server'
    const supabaseServer = await createClient();
    await supabaseServer
        .from('asignaciones')
        .update({ realizado: true })
        .eq('id', asignacionId);
    revalidatePath('/');
  }

  // 3. CARGA DE DATOS DE RESIDENTE (Usamos el 'perfil' que ya trajimos arriba)
  // Multas Activas
  const { data: multasActivas } = await supabase
    .from('multas')
    .select('valor, estado, sanciones(codigo_referencia)')
    .eq('residente_id', user.id)
    .in('estado', ['pendiente', 'aprobada'])
    .order('created_at', { ascending: false })
    .limit(3);

  const deudasReales = multasActivas?.filter(m => m.estado === 'aprobada') || [];
  const totalDeuda = deudasReales.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // Asignaciones Pendientes
  const { data: asignacionesPendientes } = await supabase
    .from('asignaciones')
    .select('*')
    .eq('residente_id', user.id)
    .eq('realizado', false)

  const { data: asignacionesHoy } = await supabase
    .from('asignaciones')
    .select('*')
    .eq('residente_id', user.id)
    .eq('fecha_asignada', hoy);

  // Lógica de Tareas
  const TIPOS_COMUNES = ['Cocina', 'Casa', 'Baño', 'Basura'];
  const misionesDiarias = asignacionesHoy?.filter(t => TIPOS_COMUNES.includes(t.tipo_aseo)) || [];
  const pendientesDiarios = misionesDiarias.filter(t => !t.realizado);
  const enRevision = misionesDiarias.filter(t => t.realizado && !t.verificado);
  const aprobadas = misionesDiarias.filter(t => t.realizado && t.verificado);
  const mostrarPendientes = pendientesDiarios.length > 0;
  const mostrarEnRevision = !mostrarPendientes && enRevision.length > 0;
  const mostrarExito = !mostrarPendientes && !mostrarEnRevision && aprobadas.length > 0;
  const especialesPendientes = asignacionesPendientes?.filter(t => !TIPOS_COMUNES.includes(t.tipo_aseo)) || [];

  return (
    // ✨ max-w-full y overflow-x-hidden para evitar scroll horizontal
    <div className="space-y-8 w-full max-w-full overflow-x-hidden pb-10">
      
      {/* GRID SUPERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 space-y-6 flex flex-col justify-center min-w-0">
              {totalDeuda > 0 && (
                <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse">
                    <div className="bg-white/20 p-2 rounded-lg shrink-0 hidden sm:block"><Megaphone size={24} className="text-white" /></div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">¡Póngase las pilas! 🤨</h3>
                        <p className="text-sm text-red-50 opacity-90 leading-tight mt-1">Tienes deudas pendientes por valor de <strong>${totalDeuda.toLocaleString()}</strong>.</p>
                    </div>
                    <Link href="/finanzas" className="bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors self-start sm:self-center">Pagar Ya</Link>
                </div>
              )}
              <WelcomeCard apodo={perfil?.apodo} casa={perfil?.casas?.nombre} es_adjudicado={perfil?.es_adjudicado} />
          </div>

          <div className="lg:col-span-1 min-w-0">
             <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Sparkles size={18} /></div>
                    <h3 className="font-bold text-gray-800 text-sm">Especiales & Extras</h3>
                </div>
                {especialesPendientes.length > 0 ? (
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
                        {especialesPendientes.map(tarea => {
                            const fechaLimite = new Date(tarea.fecha_limite);
                            const ahora = new Date();
                            const diffTime = fechaLimite.getTime() - ahora.getTime();
                            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const vencida = diasRestantes < 0;
                            const urgente = diasRestantes <= 1 && diasRestantes >= 0;
                            return (
                                <div key={tarea.id} className={`p-3 rounded-xl border flex flex-col gap-2 relative overflow-hidden ${urgente || vencida ? 'bg-red-50 border-red-100' : 'bg-purple-50 border-purple-100'}`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${vencida ? 'bg-red-500' : urgente ? 'bg-orange-400' : 'bg-purple-400'}`}></div>
                                    <div className="pl-2">
                                        <h4 className="font-bold text-gray-800 text-xs leading-tight">{tarea.tipo_aseo}</h4>
                                        <div className="flex items-center gap-1 text-[10px] mt-1 font-medium uppercase tracking-wide">
                                            <Clock size={10} />
                                            <span className={vencida ? 'text-red-600 font-bold' : urgente ? 'text-orange-600 font-bold' : 'text-purple-500'}>
                                                {vencida ? '¡Vencida!' : urgente ? '¡Vence pronto!' : `Quedan ${diasRestantes} días`}
                                            </span>
                                        </div>
                                    </div>
                                    <form action={marcarTareaCompletada.bind(null, tarea.id)} className="w-full pl-2">
                                        <button className="w-full bg-white text-[10px] font-bold py-1.5 rounded-lg border border-gray-100 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600 transition-colors">
                                            <Square size={12} /> Marcar Listo
                                        </button>
                                    </form>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-4">
                        <CheckCircle2 size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400 max-w-[150px] leading-tight">No tienes encargos especiales pendientes.</p>
                    </div>
                )}
             </div>
          </div>
      </div>

      {/* SECCIÓN CENTRAL: MISIONES DIARIAS */}
      {mostrarPendientes && (
        <div className="space-y-4">
            {pendientesDiarios.map((tarea) => {
              const esRechazo = tarea.observaciones_fiscal && tarea.observaciones_fiscal.length > 0;
              return (
                <div key={tarea.id} className={`rounded-2xl p-1 shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${esRechazo ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/20' : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/20'}`}>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1 ${esRechazo ? 'text-red-100' : 'text-amber-100'}`}>
                          {esRechazo ? <><AlertCircle size={14} className="text-red-200 animate-pulse" /> CORRECCIÓN</> : <><Sparkles size={14} className="text-yellow-300" /> MISIÓN DIARIA</>}
                        </p>
                        <h3 className="text-2xl font-black tracking-tight truncate">{tarea.tipo_aseo}</h3>
                        <p className={`text-sm mt-1 font-medium opacity-90 ${esRechazo ? 'text-red-50' : 'text-orange-50'}`}>"{tarea.descripcion}"</p>
                    </div>
                    <form action={marcarTareaCompletada.bind(null, tarea.id)} className="shrink-0">
                        <button className={`group px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-3 hover:scale-105 ${esRechazo ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white text-orange-600 hover:bg-orange-50'}`}>
                            <span className="relative flex items-center justify-center w-5 h-5">
                                <Square size={20} className="absolute transition-opacity duration-300 group-hover:opacity-0" strokeWidth={2.5} />
                                <CheckSquare size={20} className="absolute opacity-0 transition-opacity duration-300 group-hover:opacity-100" strokeWidth={2.5} />
                            </span>
                            <span>{esRechazo ? 'Corregir' : 'Marcar Listo'}</span>
                        </button>
                    </form>
                  </div>
                  {esRechazo && (
                      <div className="bg-black/20 rounded-lg p-3 mx-4 mb-4 flex items-start gap-3 border border-white/10">
                        <Megaphone size={16} className="text-red-100 mt-1 shrink-0" />
                        <p className="text-sm text-white font-medium italic">{tarea.observaciones_fiscal}</p>
                      </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {mostrarEnRevision && (
         <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6 relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                        <ClipboardCheck size={12} /> En Revisión
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">¡Buen trabajo, {perfil?.apodo}!</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">Esperando aprobación del Fiscal.</p>
            </div>
            <div className="relative z-10 hidden sm:flex bg-blue-50 h-16 w-16 rounded-2xl items-center justify-center text-blue-500 shadow-sm"><Coffee size={32} strokeWidth={1.5} /></div>
         </div>
      )}

      {mostrarExito && (
         <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-1 shadow-lg shadow-green-500/20">
             <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl flex items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><PartyPopper size={100} className="text-green-600 rotate-12" /></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1"><CheckCircle2 size={12} /> Verificado</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">¡Día Completado! 🌟</h3>
                    <p className="text-sm text-gray-600 mt-1">El Fiscal ha aprobado tus tareas. ¡A descansar!</p>
                </div>
             </div>
         </div>
      )}
      
      {/* GRID INFERIOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700 flex items-center gap-2"><AlertCircle className="text-red-500" size={20} /> Pendientes</h3>
             <Link href="/multas" className="text-xs text-unicor-primary font-bold hover:underline">Ver todo</Link>
          </div>
          {multasActivas && multasActivas.length > 0 ? (
             <div className="space-y-3 flex-1">
                {multasActivas.map((m, i) => {
                    const sancionesRaw = m.sanciones as any;
                    const nombreSancion = Array.isArray(sancionesRaw) ? sancionesRaw[0]?.codigo_referencia : sancionesRaw?.codigo_referencia;
                    return (
                        <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                            <div className="min-w-0 pr-2">
                                <p className="font-bold text-sm text-gray-800 truncate">{nombreSancion || "Sanción"}</p>
                                <p className="text-[10px] text-red-600 uppercase font-bold tracking-wide">{m.estado}</p>
                            </div>
                            <span className="font-mono font-bold text-gray-700 text-sm whitespace-nowrap">${m.valor?.toLocaleString()}</span>
                        </div>
                    )
                })}
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <CheckCircle2 size={48} className="text-green-100 mb-2" />
                <p className="text-sm font-medium text-gray-500">Estás al día</p>
             </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] flex flex-col justify-between group hover:border-unicor-primary/30 transition-colors">
           <div>
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><ShieldAlert className="text-blue-500" size={20} /> Acciones Rápidas</h3>
              <p className="text-sm text-gray-400 mb-6">¿Viste algo fuera de lugar? Reporta para mantener el orden.</p>
           </div>
           <Link href="/multas/nueva" className="w-full bg-gray-50 hover:bg-unicor-primary group-hover:bg-unicor-primary group-hover:text-white text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200 group-hover:border-unicor-primary">
              <PlusCircle size={20} />
              <span>Reportar Infracción</span>
              <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all" />
           </Link>
        </div>
      </div>
    </div>
  );
}