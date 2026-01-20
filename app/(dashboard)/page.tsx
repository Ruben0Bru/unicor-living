import { createClient } from '@/utils/supabase/server';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { AlertCircle, PlusCircle, CheckCircle, ArrowRight, ShieldAlert, Sparkles, CheckSquare, Square, Coffee, ClipboardCheck, Megaphone, PartyPopper } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // --- 🕒 CORRECCIÓN DE ZONA HORARIA ---
  const fechaServer = new Date();
  fechaServer.setHours(fechaServer.getHours() - 5); 
  const hoy = fechaServer.toISOString().split('T')[0];
  // -------------------------------------

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
  // ---------------

  // 1. Perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*, casas(nombre)')
    .eq('id', user?.id)
    .single();

  // 2. Multas Activas
  const { data: multasActivas } = await supabase
    .from('multas')
    .select('valor, estado, sanciones(codigo_referencia)')
    .eq('residente_id', user?.id)
    .in('estado', ['pendiente', 'aprobada'])
    .order('created_at', { ascending: false })
    .limit(3);

  // 3. Lógica del Cobrador
  const deudasReales = multasActivas?.filter(m => m.estado === 'aprobada') || [];
  const totalDeuda = deudasReales.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // 4. Asignaciones de Hoy
  const { data: asignacionesHoy } = await supabase
    .from('asignaciones')
    .select('*')
    .eq('residente_id', user?.id)
    .eq('fecha_asignada', hoy);

  // --- 🧠 LÓGICA DE ESTADOS MEJORADA ---
  const hayTareas = asignacionesHoy && asignacionesHoy.length > 0;
  
  // 1. Lo que falta por hacer
  const pendientes = asignacionesHoy?.filter(t => !t.realizado) || [];
  
  // 2. Lo que hice, pero el fiscal NO ha verificado (Azul)
  // Nota: Usamos !t.verificado para atrapar false y null
  const enRevision = asignacionesHoy?.filter(t => t.realizado && !t.verificado) || [];

  // 3. Lo que hice Y el fiscal YA aprobó (Verde)
  const aprobadas = asignacionesHoy?.filter(t => t.realizado && t.verificado) || [];

  // ¿Qué tarjeta mostramos?
  const mostrarPendientes = pendientes.length > 0;
  // Solo mostramos "En Revisión" si ya no hay pendientes, pero hay cosas sin verificar
  const mostrarEnRevision = !mostrarPendientes && enRevision.length > 0;
  // Solo mostramos "Éxito Total" si no hay pendientes NI revisiones, y hay aprobadas
  const mostrarExito = !mostrarPendientes && !mostrarEnRevision && aprobadas.length > 0;
  // -------------------------------------

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Resumen</h1>
        <p className="text-gray-500">Vistazo general de tu estado en la casa.</p>
      </div>

      {/* --- ZONA DE COBRO --- */}
      {totalDeuda > 0 && (
        <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-500/30 flex items-start gap-4 animate-pulse">
            <div className="bg-white/20 p-2 rounded-lg shrink-0">
                <Megaphone size={24} className="text-white" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg">¡Póngase las pilas! 🤨</h3>
                <p className="text-sm text-red-50 opacity-90 leading-tight mt-1">
                    Tienes deudas pendientes por valor de <strong>${totalDeuda.toLocaleString()}</strong>. 
                    El tesorero está esperando.
                </p>
            </div>
            <Link href="/finanzas" className="bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors self-center">
                Pagar Ya
            </Link>
        </div>
      )}

      <WelcomeCard 
        apodo={perfil?.apodo}
        casa={perfil?.casas?.nombre}
        es_adjudicado={perfil?.es_adjudicado}
      />

      {/* --- ESTADO 1: LISTA DE MISIONES (NARANJA) --- */}
      {mostrarPendientes && (
        <div className="space-y-4">
            {pendientes.map((tarea) => (
                <div key={tarea.id} className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-1 shadow-lg shadow-orange-500/20 transform hover:-translate-y-1 transition-all duration-300">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-yellow-300" /> Misión Diaria
                            </p>
                            <h3 className="text-2xl font-black tracking-tight">{tarea.tipo_aseo}</h3>
                            <p className="text-sm text-orange-50 mt-1 font-medium opacity-90">"{tarea.descripcion}"</p>
                        </div>
                        <form action={marcarTareaCompletada.bind(null, tarea.id)}>
                            <button className="group bg-white text-orange-600 px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-orange-50 hover:scale-105 transition-all flex items-center gap-3">
                                <span className="relative flex items-center justify-center w-5 h-5">
                                    <Square size={20} className="absolute transition-opacity duration-300 group-hover:opacity-0" strokeWidth={2.5} />
                                    <CheckSquare size={20} className="absolute opacity-0 transition-opacity duration-300 group-hover:opacity-100" strokeWidth={2.5} />
                                </span>
                                <span>Marcar Listo</span>
                            </button>
                        </form>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* --- ESTADO 2: EN REVISIÓN (AZUL) --- */}
      {mostrarEnRevision && (
         <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                        <ClipboardCheck size={12} /> En Revisión
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">¡Buen trabajo, {perfil?.apodo}!</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md leading-relaxed">
                    Has reportado <strong>{enRevision.length} asignaciones</strong>.
                    <span className="block sm:inline"> Esperando aprobación del Fiscal.</span>
                </p>
            </div>
            <div className="relative z-10 hidden sm:flex bg-blue-50 h-16 w-16 rounded-2xl items-center justify-center text-blue-500 shadow-sm transform group-hover:rotate-12 transition-transform duration-500">
                <Coffee size={32} strokeWidth={1.5} />
            </div>
         </div>
      )}

      {/* --- ESTADO 3: APROBADO / CELEBRACIÓN (VERDE - NUEVO) --- */}
      {mostrarExito && (
         <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-1 shadow-lg shadow-green-500/20 animate-in zoom-in-95 duration-500">
             <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl flex items-center justify-between gap-6 relative overflow-hidden">
                {/* Confeti decorativo */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <PartyPopper size={100} className="text-green-600 rotate-12" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle size={12} /> Verificado
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">¡Día Completado! 🌟</h3>
                    <p className="text-sm text-gray-600 mt-1 max-w-md leading-relaxed">
                        El Fiscal ha aprobado tus tareas. Eres un ciudadano ejemplar.
                        ¡A descansar!
                    </p>
                </div>
             </div>
         </div>
      )}
      
      {/* Grid de Multas y Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Multas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[250px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                Pendientes
             </h3>
             <Link href="/multas" className="text-xs text-unicor-primary font-bold hover:underline">Ver todo</Link>
          </div>
          {multasActivas && multasActivas.length > 0 ? (
             <div className="space-y-3 flex-1">
                {multasActivas.map((m, i) => {
                    const sancionesRaw = m.sanciones as any;
                    const nombreSancion = Array.isArray(sancionesRaw) 
                        ? sancionesRaw[0]?.codigo_referencia 
                        : sancionesRaw?.codigo_referencia;

                    return (
                        <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                            <div>
                                <p className="font-bold text-sm text-gray-800 line-clamp-1">
                                    {nombreSancion || "Sanción"}
                                </p>
                                <p className="text-[10px] text-red-600 uppercase font-bold tracking-wide">{m.estado}</p>
                            </div>
                            <span className="font-mono font-bold text-gray-700 text-sm">${m.valor?.toLocaleString()}</span>
                        </div>
                    )
                })}
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <CheckCircle size={48} className="text-green-100 mb-2" />
                <p className="text-sm font-medium text-gray-500">Estás al día</p>
             </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[250px] flex flex-col justify-between group hover:border-unicor-primary/30 transition-colors">
           <div>
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                 <ShieldAlert className="text-blue-500" size={20} />
                 Acciones Rápidas
              </h3>
              <p className="text-sm text-gray-400 mb-6">¿Viste algo fuera de lugar? Reporta para mantener el orden.</p>
           </div>
           <Link href="/multas/nueva" className="w-full bg-gray-50 hover:bg-unicor-primary group-hover:bg-unicor-primary hover:text-white text-gray-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200 group-hover:border-unicor-primary">
              <PlusCircle size={20} />
              <span>Reportar Infracción</span>
              <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all" />
           </Link>
        </div>
      </div>
    </div>
  );
}