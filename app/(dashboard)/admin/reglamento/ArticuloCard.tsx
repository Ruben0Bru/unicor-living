"use client";

import { useState } from "react";
import { Scale, Trash2, Pencil, X, Check, Building2 } from "lucide-react";
import {
  editarArticulo,
  eliminarArticulo,
  editarSancion,
  eliminarSancion,
} from "../actions";
import { BotonAgregarSancion } from "./BotonAgregarSancion";

type Sancion = {
  id: string;
  valor_base: number;
  codigo_referencia: string;
};

type Casa = {
  id: string;
  nombre: string;
  genero?: string;
};

export type ArticuloReglamento = {
  id: string;
  casa_id: string | null;
  numero_articulo: string;
  capitulo: string;
  titulo: string;
  descripcion_texto: string;
  casas: Casa | Casa[] | null;
  sanciones: Sancion[];
};

const getCasaLabel = (nombre: string, genero?: string) => {
  const g = (genero || "").toLowerCase();
  let suffix = "";
  if (g.startsWith("m") && g.includes("asc")) suffix = "Varones";
  else if (g.startsWith("f")) suffix = "Mujeres";
  else if (g.includes("mix")) suffix = "Mixta";
  return suffix ? `${nombre} (${suffix})` : nombre;
};

export function ArticuloCard({
  art,
  esAdmin,
  miCasaId,
  casasDisponibles,
}: {
  art: ArticuloReglamento;
  esAdmin: boolean;
  miCasaId: string | null;
  casasDisponibles: Casa[];
}) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sancionEditandoId, setSancionEditandoId] = useState<string | null>(
    null,
  );
  const [guardandoSancion, setGuardandoSancion] = useState(false);

  const esGlobal = art.casa_id === null;
  const puedeEditar = esAdmin || art.casa_id === miCasaId;

  const casaNombre = esGlobal
    ? "🌍 GLOBAL"
    : Array.isArray(art.casas)
      ? art.casas[0]?.nombre
      : (art.casas as any)?.nombre || "Sin Sede";

  const handleGuardarArticulo = async (formData: FormData) => {
    setGuardando(true);
    try {
      await editarArticulo(formData);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarSancion = async (formData: FormData) => {
    setGuardandoSancion(true);
    try {
      await editarSancion(formData);
      setSancionEditandoId(null);
    } finally {
      setGuardandoSancion(false);
    }
  };

  if (editando) {
    return (
      <form
        action={handleGuardarArticulo}
        className="bg-indigo-50/60 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4"
      >
        <input type="hidden" name="id" value={art.id} />

        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
            Editando Art. {art.numero_articulo}
          </span>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Sede / Global (Solo Admin) */}
        {esAdmin && (
          <div className="bg-white p-3 rounded-xl border border-indigo-200">
            <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-1 flex items-center gap-1">
              <Building2 size={12} /> Alcance / Sede:
            </label>
            <select
              name="casa_id"
              defaultValue={art.casa_id ?? "GLOBAL"}
              className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="GLOBAL">
                🌍 Reglamento Global (Todas las sedes)
              </option>
              {casasDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCasaLabel(c.nombre, c.genero)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Capítulo
            </label>
            <input
              type="text"
              name="capitulo"
              defaultValue={art.capitulo}
              required
              className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              No.
            </label>
            <input
              type="number"
              name="numero"
              defaultValue={art.numero_articulo}
              required
              className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Título
            </label>
            <input
              type="text"
              name="titulo"
              defaultValue={art.titulo}
              required
              className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Descripción Legal
          </label>
          <textarea
            name="descripcion"
            rows={4}
            defaultValue={art.descripcion_texto}
            required
            className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={guardando}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 disabled:opacity-60"
          >
            <Check size={14} /> {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 group hover:border-indigo-200 transition-colors relative">
      {(esAdmin || esGlobal) && (
        <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-gray-200">
          {casaNombre}
        </div>
      )}

      <div className="flex-1 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            {art.capitulo}
          </span>
          <span className="text-indigo-600 font-black text-sm">
            Art. {art.numero_articulo}
          </span>
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{art.titulo}</h3>
        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
          {art.descripcion_texto}
        </p>

        {/* LISTA DE SANCIONES (Con edición y borrado inline) */}
        {art.sanciones && art.sanciones.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {art.sanciones.map((s) =>
              sancionEditandoId === s.id ? (
                <form
                  key={s.id}
                  action={handleGuardarSancion}
                  className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-200"
                >
                  <input type="hidden" name="sancion_id" value={s.id} />
                  <input
                    name="codigo"
                    defaultValue={s.codigo_referencia}
                    required
                    className="w-36 text-[11px] px-2 py-1 bg-white rounded-lg border border-red-200 outline-none font-bold text-gray-700"
                  />
                  <input
                    name="valor"
                    type="number"
                    defaultValue={s.valor_base}
                    required
                    className="w-20 text-[11px] px-2 py-1 bg-white rounded-lg border border-red-200 outline-none font-bold text-gray-700"
                  />
                  <button
                    type="submit"
                    disabled={guardandoSancion}
                    className="p-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    title="Guardar sanción"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSancionEditandoId(null)}
                    className="p-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                    title="Cancelar"
                  >
                    <X size={12} />
                  </button>
                </form>
              ) : (
                <div
                  key={s.id}
                  className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-red-100"
                >
                  <Scale size={10} />
                  <span>
                    {s.codigo_referencia}: ${s.valor_base.toLocaleString()}
                  </span>
                  {puedeEditar && (
                    <span className="flex items-center gap-1 ml-1 pl-1.5 border-l border-red-200">
                      <button
                        type="button"
                        onClick={() => setSancionEditandoId(s.id)}
                        className="text-red-400 hover:text-indigo-600 transition-colors"
                        title="Editar sanción"
                      >
                        <Pencil size={10} />
                      </button>
                      <form
                        action={eliminarSancion.bind(null, s.id)}
                        className="inline-flex"
                      >
                        <button
                          type="submit"
                          className="text-red-400 hover:text-red-700 transition-colors"
                          title="Eliminar sanción"
                        >
                          <Trash2 size={10} />
                        </button>
                      </form>
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        )}

        {puedeEditar && <BotonAgregarSancion reglamentoId={art.id} />}
      </div>

      {puedeEditar && (
        <div className="flex items-start justify-end gap-1 mt-2 md:mt-4">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Editar Ley"
          >
            <Pencil size={18} />
          </button>
          <form action={eliminarArticulo.bind(null, art.id)}>
            <button
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Derogar Ley"
            >
              <Trash2 size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
