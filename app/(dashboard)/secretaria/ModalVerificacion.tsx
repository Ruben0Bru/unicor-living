"use client";

import {
  X,
  CheckCircle,
  Clock,
  PenTool,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { firmarAseoComoTestigo } from "@/app/(dashboard)/actions";

export function ModalVerificacion({
  isOpen,
  onClose,
  fecha,
  asignacionesDelDia,
  residentes,
  miPerfilId,
}: any) {
  const [firmandoId, setFirmandoId] = useState<string | null>(null);

  const handleFirmar = async (asignacionId: string) => {
    setFirmandoId(asignacionId);
    try {
      await firmarAseoComoTestigo(asignacionId);
    } catch (error) {
      console.error("Error al firmar:", error);
      alert("No se pudo registrar la firma.");
    } finally {
      setFirmandoId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[90%] max-w-lg rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        {/* CABECERA */}
        <div className="bg-purple-900 text-white p-5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg">Cronograma de Aseos</h3>
            <p className="text-purple-200 text-sm capitalize">
              {fecha.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* LISTA DE TAREAS */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 custom-scrollbar">
          {asignacionesDelDia.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-2">✨</span>
              <p className="text-gray-500 font-medium">
                Día libre. No hay tareas programadas.
              </p>
            </div>
          ) : (
            asignacionesDelDia.map((a: any) => {
              const residente = residentes?.find(
                (r: any) => r.id === a.residente_id,
              );

              // 👇 LÓGICA DE ESTADOS VISUALES
              let BadgeEstado = null;
              if (a.verificado) {
                BadgeEstado = (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                    <CheckCircle2 size={12} /> Verificado
                  </span>
                );
              } else if (a.realizado) {
                if (a.testigo_id) {
                  BadgeEstado = (
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                      <CheckCircle size={12} /> Respaldado
                    </span>
                  );
                } else {
                  BadgeEstado = (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                      <Clock size={12} /> En Revisión
                    </span>
                  );
                }
              } else {
                if (a.observaciones_fiscal) {
                  BadgeEstado = (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                      <AlertCircle size={12} /> Rechazado
                    </span>
                  );
                } else {
                  BadgeEstado = (
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                      <Clock size={12} /> Pendiente
                    </span>
                  );
                }
              }

              return (
                <div
                  key={a.id}
                  className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* AVATAR */}
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border-2 border-purple-100 shadow-sm mt-1">
                      {residente?.avatar_url ? (
                        <img
                          src={residente.avatar_url}
                          alt={residente.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement("span");
                              fallback.className =
                                "text-purple-700 font-black text-lg";
                              fallback.innerText =
                                residente?.nombre?.charAt(0) || "?";
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-purple-700 font-black text-lg">
                          {residente?.nombre?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>

                    {/* INFO DE LA TAREA */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-black text-gray-800 leading-tight">
                          {a.descripcion}
                        </p>
                      </div>
                      {BadgeEstado}
                      <p className="text-xs text-gray-500 font-bold mt-1.5">
                        Responsable:{" "}
                        <span className="text-purple-600">
                          {residente?.nombre || "Desconocido"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* LÓGICA DE FIRMA / TESTIGO */}
                  {a.realizado && !a.verificado && (
                    <div className="mt-1 border-t border-gray-200 pt-3">
                      {a.testigo_id ? (
                        <div className="bg-green-50 text-green-700 p-2 rounded-lg text-xs font-bold flex items-center gap-2">
                          <CheckCircle size={14} />
                          Aseo respaldado por un testigo. Listo para revisión
                          fiscal.
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium">
                            ¿Viste este aseo limpio? Respalda a tu compañero.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleFirmar(a.id)}
                            disabled={
                              a.residente_id === miPerfilId ||
                              firmandoId === a.id
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {firmandoId === a.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <PenTool size={14} />
                            )}
                            {firmandoId === a.id ? "Firmando..." : "Dar Fe"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
