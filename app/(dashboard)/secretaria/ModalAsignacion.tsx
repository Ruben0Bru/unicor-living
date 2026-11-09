"use client";

import { useState } from "react";
import {
  X,
  Save,
  Utensils,
  Home,
  Bath,
  Trash2,
  Sparkles,
  PlusCircle,
  Trash,
  Users,
  Snowflake,
} from "lucide-react";
import { guardarAsignacionesDia } from "./actions";

// ==========================================
// 1. TIPOS Y CONSTANTES AISLADAS
// ==========================================
type Residente = {
  id: string;
  apodo: string;
  es_adjudicado: boolean;
  equipo_aseo: string;
};

type TareaGeneral = {
  id: string;
  nombre: string;
  limite: string;
  residente_id: string;
};

const TIPOS_FIJOS = [
  {
    id: "Cocina",
    label: "Cocina",
    icon: Utensils,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    id: "Casa",
    label: "Casa General",
    icon: Home,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: "Baño 1",
    label: "Baño 1",
    icon: Bath,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
  {
    id: "Baño 2",
    label: "Baño 2",
    icon: Bath,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
  {
    id: "Nevera 1",
    label: "Nevera 1",
    icon: Snowflake,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "Nevera 2",
    label: "Nevera 2",
    icon: Snowflake,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "Basura",
    label: "Basura",
    icon: Trash2,
    color: "text-red-500",
    bg: "bg-red-50",
  },
];

// ==========================================
// 2. SUB-COMPONENTE: FORMULARIO DE TAREAS FIJAS
// ==========================================
function FormularioFijos({
  seleccion,
  onChange,
  candidatos,
}: {
  seleccion: Record<string, string>;
  onChange: (tipo: string, id: string) => void;
  candidatos: Residente[];
}) {
  return (
    <div className="space-y-4">
      {TIPOS_FIJOS.map((tipo) => {
        const Icon = tipo.icon;
        return (
          <div key={tipo.id} className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tipo.bg} ${tipo.color}`}
            >
              <Icon size={24} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                {tipo.label}
              </label>
              <select
                value={seleccion[tipo.id] || ""}
                onChange={(e) => onChange(tipo.id, e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
              >
                <option value="">-- Sin Asignar --</option>
                {candidatos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.apodo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 3. SUB-COMPONENTE: FORMULARIO DE TAREAS GENERALES/EXTRAS
// ==========================================
function FormularioGenerales({
  tareas,
  onAdd,
  onUpdate,
  onDelete,
  candidatos,
  fechaIso,
}: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-700 flex items-center gap-2">
          <Users size={18} className="text-purple-600" /> Aseos Generales
        </h4>
        <button
          onClick={onAdd}
          className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors flex items-center gap-1"
        >
          <PlusCircle size={14} /> Nueva Orden
        </button>
      </div>

      {tareas.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 italic">
            No hay órdenes generales para hoy.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tareas.map((tarea: TareaGeneral) => (
            <div
              key={tarea.id}
              className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 flex flex-col gap-2 animate-in slide-in-from-left-2"
            >
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg text-purple-500 shadow-sm shrink-0">
                  <Sparkles size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Descripción (Ej: Aseo de Patio)"
                  value={tarea.nombre}
                  onChange={(e) => onUpdate(tarea.id, "nombre", e.target.value)}
                  className="w-full text-sm bg-transparent border-none p-0 focus:ring-0 font-bold text-gray-700 placeholder:text-gray-400 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => onDelete(tarea.id)}
                  className="text-red-300 hover:text-red-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="pl-11 mt-1">
                <select
                  value={tarea.residente_id}
                  onChange={(e) =>
                    onUpdate(tarea.id, "residente_id", e.target.value)
                  }
                  className="w-full text-xs font-bold bg-white border border-purple-200 text-purple-700 rounded-lg px-2 py-1.5 outline-none focus:border-purple-500"
                >
                  <option value="">-- Asignar a... --</option>
                  {candidatos.map((r: Residente) => (
                    <option key={r.id} value={r.id}>
                      {r.apodo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pl-11 mt-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
                  Vence:
                </span>
                <input
                  type="date"
                  value={tarea.limite}
                  min={fechaIso}
                  onChange={(e) => onUpdate(tarea.id, "limite", e.target.value)}
                  className="bg-white border border-purple-200 text-purple-700 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. COMPONENTE PRINCIPAL (EL CEREBRO)
// ==========================================
export function ModalAsignacion({
  isOpen,
  onClose,
  fecha,
  residentes,
  asignacionesDelDia,
}: any) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const fechaIso = fecha.toISOString().split("T")[0];

  // Estado Tareas Fijas
  const [seleccion, setSeleccion] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    asignacionesDelDia.forEach((a: any) => {
      if (TIPOS_FIJOS.find((t) => t.id === a.tipo_aseo)) {
        inicial[a.tipo_aseo] = a.residente_id;
      }
    });
    return inicial;
  });

  // Estado Tareas Generales
  const [tareasGenerales, setTareasGenerales] = useState<TareaGeneral[]>(() => {
    return asignacionesDelDia
      .filter((a: any) => !TIPOS_FIJOS.find((t) => t.id === a.tipo_aseo))
      .map((a: any) => ({
        id: Math.random().toString(),
        nombre: a.tipo_aseo,
        limite: a.fecha_limite || fechaIso,
        residente_id: a.residente_id || "",
      }));
  });

  // Operaciones
  const updateGeneral = (
    id: string,
    campo: keyof TareaGeneral,
    valor: string,
  ) => {
    setTareasGenerales((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payloadFijas = Object.entries(seleccion)
        .map(([tipo, residenteId]) => {
          if (!residenteId) return null;
          return {
            residente_id: residenteId,
            tipo_aseo: tipo,
            descripcion: `Aseo de ${TIPOS_FIJOS.find((t) => t.id === tipo)?.label || tipo}`,
            fecha_asignada: fechaIso,
            fecha_limite: fechaIso,
            realizado: false,
          };
        })
        .filter(Boolean);

      const payloadGenerales = tareasGenerales
        .filter((t) => t.nombre.trim() && t.residente_id)
        .map((tarea) => ({
          residente_id: tarea.residente_id,
          tipo_aseo: tarea.nombre,
          descripcion: "Aseo Especial/General",
          fecha_asignada: fechaIso,
          fecha_limite: tarea.limite,
          realizado: false,
        }));

      await guardarAsignacionesDia(fechaIso, [
        ...payloadFijas,
        ...payloadGenerales,
      ]);
      onClose();
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[95%] md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* CABECERA */}
        <div className="bg-gray-900 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold">Asignar Tareas</h3>
            <p className="text-gray-400 text-sm capitalize">
              {fecha.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO CENTRAL (Donde inyectamos los componentes limpios) */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <FormularioFijos
            seleccion={seleccion}
            onChange={(t, id) => setSeleccion((p) => ({ ...p, [t]: id }))}
            candidatos={residentes}
          />

          <div className="border-t border-gray-100 my-4"></div>

          <FormularioGenerales
            tareas={tareasGenerales}
            onAdd={() =>
              setTareasGenerales((p) => [
                ...p,
                {
                  id: Math.random().toString(),
                  nombre: "",
                  limite: fechaIso,
                  residente_id: "",
                },
              ])
            }
            onUpdate={updateGeneral}
            onDelete={(id: string) =>
              setTareasGenerales((p) => p.filter((t) => t.id !== id))
            }
            candidatos={residentes}
            fechaIso={fechaIso}
          />
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center gap-2"
          >
            {loading ? (
              "..."
            ) : (
              <>
                <Save size={20} /> Guardar Todo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
