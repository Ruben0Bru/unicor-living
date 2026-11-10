import { createClient } from "@/utils/supabase/server";
import {
  AlertCircle,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Users,
  Gavel,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MultasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. CONSULTA A: Multas en MI CONTRA
  const { data: misMultas } = await supabase
    .from("multas")
    .select(
      `
      *,
      sanciones ( codigo_referencia ),
      acusador:perfiles!acusador_id ( apodo ) 
    `,
    )
    .eq("residente_id", user.id)
    .order("created_at", { ascending: false });

  // 2. CONSULTA B: Multas que YO REPORTÉ
  const { data: misReportes } = await supabase
    .from("multas")
    .select(
      `
      *,
      sanciones ( codigo_referencia ),
      acusado:perfiles!residente_id ( apodo, nombre_completo )
    `,
    )
    .eq("acusador_id", user.id)
    .order("created_at", { ascending: false });

  // 3. CONSULTA C: Mis LLAMADOS A TESTIFICAR
  const { data: misLlamados } = await supabase
    .from("testimonios_multas")
    .select(
      `
      id,
      estado,
      declaracion,
      created_at,
      multa:multas (
          id,
          descripcion_personalizada,
          acusador:perfiles!acusador_id(apodo),
          acusado:perfiles!residente_id(apodo)
      )
    `,
    )
    .eq("testigo_id", user.id)
    .order("created_at", { ascending: false });

  const EstadoBadge = ({ estado }: { estado: string }) => {
    const estilos = {
      pendiente: "bg-yellow-50 text-yellow-700 border-yellow-200",
      aprobada: "bg-red-50 text-red-700 border-red-200",
      pagada: "bg-green-50 text-green-700 border-green-200",
      rechazada: "bg-gray-50 text-gray-500 border-gray-200",
      // Nuevos estados de testigos
      aceptado: "bg-indigo-50 text-indigo-700 border-indigo-200",
      declinado: "bg-slate-50 text-slate-500 border-slate-200",
    };

    const clase = estilos[estado as keyof typeof estilos] || "bg-gray-100";

    return (
      <span
        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${clase}`}
      >
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-unicor-primary flex items-center gap-2">
            <AlertCircle className="text-unicor-danger" />
            Centro de Justicia
          </h1>
          <p className="text-gray-500 text-sm">
            Gestiona tus sanciones, reportes y testimonios.
          </p>
        </div>
        <Link
          href="/multas/nueva"
          className="mt-4 md:mt-0 flex items-center gap-2 bg-unicor-primary hover:bg-unicor-secondary text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm"
        >
          <PlusCircle size={18} />
          Reportar Infracción
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: EN MI CONTRA 🛑 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-8 bg-red-500 rounded-full"></div>
            Sanciones Recibidas
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
            {misMultas && misMultas.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {misMultas.map((multa) => (
                  <div
                    key={multa.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-800">
                        {multa.sanciones?.codigo_referencia}
                      </span>
                      <EstadoBadge estado={multa.estado} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Por:{" "}
                      <strong className="text-unicor-primary">
                        {multa.acusador?.apodo || "Anónimo"}
                      </strong>
                    </p>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-400">
                        {new Date(multa.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-mono font-bold text-gray-800">
                        ${multa.valor?.toLocaleString()}
                      </span>
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

        {/* COLUMNA 2: MIS REPORTES 👁️ */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            Mis Reportes Realizados
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
            {misReportes && misReportes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {misReportes.map((reporte) => (
                  <div
                    key={reporte.id}
                    className="p-4 hover:bg-gray-50 transition-colors bg-blue-50/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-700 text-sm">
                        vs. {reporte.acusado?.apodo}
                      </span>
                      <EstadoBadge estado={reporte.estado} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2 italic">
                      "{reporte.sanciones?.codigo_referencia}"
                    </p>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-400">
                        Enviado el{" "}
                        {new Date(reporte.created_at).toLocaleDateString()}
                      </span>
                      <Eye size={16} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <Send size={40} className="text-blue-200 mb-2" />
                <p className="text-sm">No has reportado a nadie.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: TESTIGOS (NUEVA) ⚖️ */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
            Llamados a Testificar
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] border-t-4 border-t-indigo-500">
            {misLlamados && misLlamados.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {misLlamados.map((llamado: any) => (
                  <div
                    key={llamado.id}
                    className="p-4 hover:bg-indigo-50/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-indigo-900 text-sm flex items-center gap-1">
                        <Gavel size={14} /> Caso
                      </span>
                      <EstadoBadge estado={llamado.estado} />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      <strong className="text-gray-800">
                        {llamado.multa?.acusador?.apodo || "Desconocido"}
                      </strong>{" "}
                      acusa a{" "}
                      <strong className="text-gray-800">
                        {llamado.multa?.acusado?.apodo || "Desconocido"}
                      </strong>
                    </p>

                    {llamado.estado === "pendiente" ? (
                      <Link
                        href={`/multas/testimonio/${llamado.id}`}
                        className="mt-3 w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1"
                      >
                        <UserCheck size={14} /> Dar Declaración
                      </Link>
                    ) : (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-500 italic border border-gray-100">
                        {llamado.declaracion
                          ? `"${llamado.declaracion.substring(0, 50)}..."`
                          : "Sin detalles."}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <Users size={40} className="text-indigo-200 mb-2" />
                <p className="text-sm">Nadie te ha llamado como testigo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
