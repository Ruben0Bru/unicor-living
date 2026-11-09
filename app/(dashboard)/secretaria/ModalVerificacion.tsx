"use client";

import { X, CheckCircle, Clock } from "lucide-react";

export function ModalVerificacion({
  isOpen,
  onClose,
  fecha,
  asignacionesDelDia,
  residentes,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[90%] max-w-lg rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
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

              return (
                <div
                  key={a.id}
                  className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border-2 border-purple-100 shadow-sm">
                      {residente?.avatar_url ? (
                        <img
                          src={residente.avatar_url}
                          alt={residente.apodo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement("span");
                              fallback.className =
                                "text-purple-700 font-black text-lg";
                              fallback.innerText =
                                residente?.apodo?.charAt(0) || "?";
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-purple-700 font-black text-lg">
                          {residente?.apodo?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 leading-tight">
                        {a.descripcion}
                      </p>
                      <p className="text-xs text-gray-500 font-bold mt-0.5">
                        Responsable:{" "}
                        <span className="text-purple-600">
                          {residente?.apodo || "Desconocido"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200/60 pt-3">
                    {a.realizado ? (
                      <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1.5 rounded-xl font-bold text-xs">
                        <CheckCircle size={14} /> Tarea marcada como finalizada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-700 bg-orange-100 px-3 py-1.5 rounded-xl font-bold text-xs">
                        <Clock size={14} /> Pendiente de ejecución
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
