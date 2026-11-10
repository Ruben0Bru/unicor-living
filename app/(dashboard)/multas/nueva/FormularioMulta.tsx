"use client";

import { useState, useMemo } from "react";
import { crearMulta } from "../actions";
import {
  User,
  DollarSign,
  AlertOctagon,
  Building2,
  Ticket,
  Gavel,
  Users,
  FileText,
} from "lucide-react";

type Vecino = {
  id: string;
  apodo: string;
  nombre_completo: string | null;
  casa_id?: string;
};
type Sancion = {
  id: string;
  codigo_referencia: string;
  descripcion: string;
  valor_base: number;
};
type Casa = { id: string; nombre: string; genero?: string };

export function FormularioMulta({
  vecinos,
  sanciones,
  casas = [],
}: {
  vecinos: Vecino[];
  sanciones: Sancion[];
  casas?: Casa[];
}) {
  const [acusadoId, setAcusadoId] = useState("");
  const [sancionId, setSancionId] = useState("");
  const [casaSeleccionada, setCasaSeleccionada] = useState("");

  // Nuevos estados para los testigos
  const [testigo1Id, setTestigo1Id] = useState("");
  const [testigo2Id, setTestigo2Id] = useState("");

  // Filtrado de residentes
  const listaResidentesVisibles = useMemo(() => {
    if (casas.length > 0 && casaSeleccionada) {
      return vecinos.filter((v) => v.casa_id === casaSeleccionada);
    }
    if (casas.length > 0 && !casaSeleccionada) {
      return [];
    }
    return vecinos;
  }, [vecinos, casas, casaSeleccionada]);

  const sancionSeleccionada = sanciones.find((s) => s.id === sancionId);
  const esBienestarMode = casas.length > 0;

  // Cálculo de valor
  const valorOriginal = sancionSeleccionada?.valor_base || 0;
  const valorFinal = esBienestarMode ? valorOriginal * 2 : valorOriginal;

  const getCasaLabel = (nombre: string, genero?: string) => {
    const g = (genero || "").toLowerCase();
    let suffix = "";
    if (g.startsWith("m") && g.includes("asc")) suffix = "Varones";
    else if (g.startsWith("f")) suffix = "Mujeres";
    else if (g.includes("mix")) suffix = "Mixta";
    return suffix ? `${nombre} (${suffix})` : nombre;
  };

  // Validación de seguridad para habilitar el botón
  const isBotonDeshabilitado =
    !acusadoId ||
    !sancionId ||
    (!esBienestarMode &&
      (!testigo1Id ||
        !testigo2Id ||
        testigo1Id === testigo2Id ||
        testigo1Id === acusadoId ||
        testigo2Id === acusadoId));

  return (
    <form
      action={crearMulta}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <div
        className={`h-2 bg-gradient-to-r ${esBienestarMode ? "from-indigo-600 to-purple-600" : "from-red-500 to-orange-500"}`}
      ></div>

      <div className="p-8 space-y-8">
        {/* 1. SELECCIÓN DE CASA (BIENESTAR) */}
        {esBienestarMode && (
          <div className="space-y-2 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-bold text-indigo-800 uppercase tracking-wide flex items-center gap-2">
              <Building2 size={18} /> Paso 1: Seleccionar Sede
            </label>
            <div className="relative">
              <select
                className="w-full p-4 bg-white border border-indigo-200 rounded-xl appearance-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                onChange={(e) => {
                  setCasaSeleccionada(e.target.value);
                  setAcusadoId("");
                }}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  -- Elige una casa --
                </option>
                {casas.map((casa) => (
                  <option key={casa.id} value={casa.id}>
                    {getCasaLabel(casa.nombre, casa.genero)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 2. SELECCIÓN DEL ACUSADO */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <User size={18} />{" "}
            {esBienestarMode ? "Paso 2: Residente" : "¿Quién cometió la falta?"}
          </label>
          <div className="relative group">
            <select
              name="residente_id"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-bold text-gray-700 focus:ring-2 focus:ring-unicor-primary outline-none transition-all cursor-pointer disabled:opacity-50"
              onChange={(e) => {
                setAcusadoId(e.target.value);
                if (testigo1Id === e.target.value) setTestigo1Id("");
                if (testigo2Id === e.target.value) setTestigo2Id("");
              }}
              value={acusadoId}
              disabled={esBienestarMode && !casaSeleccionada}
            >
              <option value="" disabled>
                {esBienestarMode && !casaSeleccionada
                  ? "Primero selecciona una casa..."
                  : "-- Selecciona al infractor --"}
              </option>
              {listaResidentesVisibles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.apodo} {v.nombre_completo ? `(${v.nombre_completo})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. SELECCIÓN DE INFRACCIÓN */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <AlertOctagon size={18} /> ¿Qué hizo?
          </label>
          <div className="relative group">
            <select
              name="sancion_id"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium text-gray-700 focus:ring-2 focus:ring-unicor-primary outline-none transition-all cursor-pointer"
              onChange={(e) => setSancionId(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                -- Selecciona la falta del catálogo --
              </option>
              {sanciones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo_referencia}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>

          {sancionSeleccionada && (
            <div
              className={`mt-4 border-2 rounded-2xl p-5 shadow-lg flex justify-between items-center gap-4 animate-in zoom-in-95 duration-200 relative overflow-hidden group
                    ${esBienestarMode ? "bg-indigo-50 border-indigo-200" : "bg-white border-unicor-primary/10"}
                `}
            >
              <div className="relative z-10 flex-1">
                <p
                  className={`text-sm italic leading-snug mt-1 ${esBienestarMode ? "text-indigo-800" : "text-gray-600"}`}
                >
                  "{sancionSeleccionada.descripcion}"
                </p>
              </div>
              <div className="relative z-10 text-right shrink-0 border-l pl-4 border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Valor a Pagar
                </span>
                <span
                  className={`block text-3xl font-black tracking-tight ${esBienestarMode ? "text-indigo-700" : "text-unicor-primary"}`}
                >
                  ${valorFinal.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. RELATO DE LOS HECHOS (Reemplaza a la foto) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <FileText size={18} /> Relato de los Hechos
          </label>
          <textarea
            name="descripcion_personalizada"
            required
            placeholder="Describe qué sucedió, cuándo y dónde..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-unicor-primary outline-none transition-all resize-none min-h-[120px]"
          ></textarea>
        </div>

        {/* 5. TESTIGOS (Solo para residentes) */}
        {!esBienestarMode && (
          <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-unicor-primary" size={24} />
              <h3 className="font-bold text-gray-800 text-lg">
                Testigos Requeridos
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona dos residentes que presenciaron los hechos para validar
              tu versión.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Testigo 1
                </label>
                <select
                  name="testigo1_id"
                  required
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none"
                  onChange={(e) => setTestigo1Id(e.target.value)}
                  value={testigo1Id}
                >
                  <option value="" disabled>
                    -- Seleccionar --
                  </option>
                  {listaResidentesVisibles.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                      disabled={v.id === acusadoId || v.id === testigo2Id}
                    >
                      {v.apodo}{" "}
                      {v.nombre_completo ? `(${v.nombre_completo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Testigo 2
                </label>
                <select
                  name="testigo2_id"
                  required
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none"
                  onChange={(e) => setTestigo2Id(e.target.value)}
                  value={testigo2Id}
                >
                  <option value="" disabled>
                    -- Seleccionar --
                  </option>
                  {listaResidentesVisibles.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                      disabled={v.id === acusadoId || v.id === testigo1Id}
                    >
                      {v.apodo}{" "}
                      {v.nombre_completo ? `(${v.nombre_completo})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isBotonDeshabilitado}
          className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed
                ${esBienestarMode ? "bg-indigo-600 hover:bg-indigo-700" : "bg-unicor-primary hover:bg-unicor-secondary"}
            `}
        >
          <DollarSign size={24} /> Generar Multa
        </button>
      </div>
    </form>
  );
}
