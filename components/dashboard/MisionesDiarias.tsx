"use client";

import {
  AlertCircle,
  Sparkles,
  CheckSquare,
  Square,
  ClipboardCheck,
  Coffee,
  PartyPopper,
  CheckCircle2,
  Megaphone,
} from "lucide-react";
import { marcarTareaCompletada } from "@/app/(dashboard)/actions";
import { SubmitButton } from "@/components/dashboard/ui/SubmitButton";

interface MisionesDiariasProps {
  pendientesDiarios: any[];
  enRevision: any[];
  aprobadas: any[];
  perfil: any;
}

export function MisionesDiarias({
  pendientesDiarios,
  enRevision,
  aprobadas,
  perfil,
}: MisionesDiariasProps) {
  const mostrarPendientes = pendientesDiarios.length > 0;
  const mostrarEnRevision = !mostrarPendientes && enRevision.length > 0;
  const mostrarExito =
    !mostrarPendientes && !mostrarEnRevision && aprobadas.length > 0;

  return (
    <>
      {mostrarPendientes && (
        <div className="space-y-4">
          {pendientesDiarios.map((tarea) => {
            const esRechazo =
              tarea.observaciones_fiscal &&
              tarea.observaciones_fiscal.length > 0;
            return (
              <div
                key={tarea.id}
                className={`rounded-2xl p-1 shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${esRechazo ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/20" : "bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/20"}`}
              >
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-1 ${esRechazo ? "text-red-100" : "text-amber-100"}`}
                    >
                      {esRechazo ? (
                        <>
                          <AlertCircle
                            size={14}
                            className="text-red-200 animate-pulse"
                          />{" "}
                          CORRECCIÓN
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-yellow-300" />{" "}
                          MISIÓN DIARIA
                        </>
                      )}
                    </p>
                    <h3 className="text-2xl font-black tracking-tight truncate">
                      {tarea.tipo_aseo}
                    </h3>
                    <p
                      className={`text-sm mt-1 font-medium opacity-90 ${esRechazo ? "text-red-50" : "text-orange-50"}`}
                    >
                      "{tarea.descripcion}"
                    </p>
                  </div>
                  <form
                    action={marcarTareaCompletada.bind(null, tarea.id)}
                    className="shrink-0"
                  >
                    <SubmitButton
                      loadingText="Guardando..."
                      className={`group px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-3 hover:scale-105 ${esRechazo ? "bg-white text-red-600 hover:bg-red-50" : "bg-white text-orange-600 hover:bg-orange-50"}`}
                    >
                      <span className="relative flex items-center justify-center w-5 h-5">
                        <Square
                          size={20}
                          className="absolute transition-opacity duration-300 group-hover:opacity-0"
                          strokeWidth={2.5}
                        />
                        <CheckSquare
                          size={20}
                          className="absolute opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span>{esRechazo ? "Corregir" : "Marcar Listo"}</span>
                    </SubmitButton>
                  </form>
                </div>
                {esRechazo && (
                  <div className="bg-black/20 rounded-lg p-3 mx-4 mb-4 flex items-start gap-3 border border-white/10">
                    <Megaphone
                      size={16}
                      className="text-red-100 mt-1 shrink-0"
                    />
                    <p className="text-sm text-white font-medium italic">
                      {tarea.observaciones_fiscal}
                    </p>
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
            <h3 className="text-xl font-bold text-gray-800">
              ¡Buen trabajo, {perfil?.apodo}!
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Esperando aprobación del Fiscal.
            </p>
          </div>
          <div className="relative z-10 hidden sm:flex bg-blue-50 h-16 w-16 rounded-2xl items-center justify-center text-blue-500 shadow-sm">
            <Coffee size={32} strokeWidth={1.5} />
          </div>
        </div>
      )}

      {mostrarExito && (
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-1 shadow-lg shadow-green-500/20">
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl flex items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <PartyPopper size={100} className="text-green-600 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verificado
                </span>
              </div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">
                ¡Día Completado! 🌟
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                El Fiscal ha aprobado tus tareas. ¡A descansar!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
