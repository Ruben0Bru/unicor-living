import { createClient } from '@/utils/supabase/server';
import { AlertCircle, PlusCircle, CheckCircle, XCircle, Clock, Eye, Send } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function MultasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. CONSULTA A: Multas en MI CONTRA (Soy el acusado)
  const { data: misMultas } = await supabase
    .from('multas')
    .select(`
      *,
      sanciones ( codigo_referencia ),
      acusador:perfiles!acusador_id ( apodo ) 
    `) 
    .eq('residente_id', user.id)
    .order('created_at', { ascending: false });

  // 2. CONSULTA B: Multas que YO REPORTÉ (Soy el acusador)
  const { data: misReportes } = await supabase
    .from('multas')
    .select(`
      *,
      sanciones ( codigo_referencia ),
      acusado:perfiles!residente_id ( apodo, nombre_completo )
    `) 
    .eq('acusador_id', user.id)
    .order('created_at', { ascending: false });

  // Función auxiliar para badges de estado
  const EstadoBadge = ({ estado }: { estado: string }) => {
    const estilos = {
      pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      aprobada: 'bg-red-50 text-red-700 border-red-200',
      pagada: 'bg-green-50 text-green-700 border-green-200',
      rechazada: 'bg-gray-50 text-gray-500 border-gray-200'
    };
    
    // Fallback por si el estado no coincide
    const clase = estilos[estado as keyof typeof estilos] || 'bg-gray-100';

    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${clase}`}>
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-unicor-primary flex items-center gap-2">
            <AlertCircle className="text-unicor-danger" />
            Centro de Justicia
          </h1>
          <p className="text-gray-500 text-sm">Gestiona tus sanciones y reportes.</p>
        </div>
        <Link href="/multas/nueva" 
          className="mt-4 md:mt-0 flex items-center gap-2 bg-unicor-primary hover:bg-unicor-secondary text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm">
          <PlusCircle size={18} />
          Reportar Infracción
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          
          {/* SECCIÓN IZQUIERDA: EN MI CONTRA 🛑 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-8 bg-red-500 rounded-full"></div>
                Sanciones Recibidas
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
                {misMultas && misMultas.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {misMultas.map((multa) => (
                            <div key={multa.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-800">{multa.sanciones?.codigo_referencia}</span>
                                    <EstadoBadge estado={multa.estado} />
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    Reportado por: <strong className="text-unicor-primary">{multa.acusador?.apodo || "Anónimo"}</strong>
                                </p>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-gray-400">{new Date(multa.created_at).toLocaleDateString()}</span>
                                    <span className="font-mono font-bold text-gray-800">${multa.valor?.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                        <CheckCircle size={40} className="text-green-200 mb-2" />
                        <p className="text-sm">¡Limpio! No tienes multas.</p>
                    </div>
                )}
            </div>
          </div>

          {/* SECCIÓN DERECHA: LO QUE YO REPORTÉ 👁️ */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                Mis Reportes Realizados
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
                {misReportes && misReportes.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {misReportes.map((reporte) => (
                            <div key={reporte.id} className="p-4 hover:bg-gray-50 transition-colors bg-blue-50/10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-700 text-sm">vs. {reporte.acusado?.apodo}</span>
                                    <EstadoBadge estado={reporte.estado} />
                                </div>
                                <p className="text-xs text-gray-500 mb-2 italic">
                                    "{reporte.sanciones?.codigo_referencia}"
                                </p>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-gray-400">Enviado el {new Date(reporte.created_at).toLocaleDateString()}</span>
                                    <Eye size={16} className="text-gray-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                        <Send size={40} className="text-blue-200 mb-2" />
                        <p className="text-sm">No has reportado a nadie.</p>
                        <p className="text-xs mt-1">¿Eres un buen vecino o no ves nada?</p>
                    </div>
                )}
            </div>
          </div>

      </div>
    </div>
  );
}