import { Sparkles, Clock, Square, CheckCircle2 } from "lucide-react";
import { marcarTareaCompletada } from "@/app/(dashboard)/actions";

export function TareasEspeciales({
  especialesPendientes,
}: {
  especialesPendientes: any[];
}) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <Sparkles size={18} />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">Especiales & Extras</h3>
      </div>
      {especialesPendientes.length > 0 ? (
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1">
          {especialesPendientes.map((tarea) => {
            const fechaLimite = new Date(tarea.fecha_limite);
            const ahora = new Date();
            const diffTime = fechaLimite.getTime() - ahora.getTime();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const vencida = diasRestantes < 0;
            const urgente = diasRestantes <= 1 && diasRestantes >= 0;

            return (
              <div
                key={tarea.id}
                className={`p-3 rounded-xl border flex flex-col gap-2 relative overflow-hidden ${urgente || vencida ? "bg-red-50 border-red-100" : "bg-purple-50 border-purple-100"}`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${vencida ? "bg-red-500" : urgente ? "bg-orange-400" : "bg-purple-400"}`}
                ></div>
                <div className="pl-2">
                  <h4 className="font-bold text-gray-800 text-xs leading-tight">
                    {tarea.tipo_aseo}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] mt-1 font-medium uppercase tracking-wide">
                    <Clock size={10} />
                    <span
                      className={
                        vencida
                          ? "text-red-600 font-bold"
                          : urgente
                            ? "text-orange-600 font-bold"
                            : "text-purple-500"
                      }
                    >
                      {vencida
                        ? "¡Vencida!"
                        : urgente
                          ? "¡Vence pronto!"
                          : `Quedan ${diasRestantes} días`}
                    </span>
                  </div>
                </div>
                <form
                  action={marcarTareaCompletada.bind(null, tarea.id)}
                  className="w-full pl-2"
                >
                  <button className="w-full bg-white text-[10px] font-bold py-1.5 rounded-lg border border-gray-100 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-600 transition-colors">
                    <Square size={12} /> Marcar Listo
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-4">
          <CheckCircle2 size={32} className="text-gray-300 mb-2" />
          <p className="text-xs text-gray-400 max-w-[150px] leading-tight">
            No tienes encargos especiales pendientes.
          </p>
        </div>
      )}
    </div>
  );
}
