import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Scale, Plus, ArrowLeft, Building2, UserCog } from "lucide-react";
import Link from "next/link";
import { crearArticulo } from "./actions";
import { ArticuloCard, type ArticuloReglamento } from "./ArticuloCard";
import { SubmitButton } from "@/components/dashboard/ui/SubmitButton";

type Casa = {
  id: string;
  nombre: string;
  genero?: string;
};

export default async function EditorLegislativoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Verificar Permisos y Rol
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("casa_id, roles(nombre)")
    .eq("id", user.id)
    .single();

  if (!perfil) redirect("/login");

  const rolesData = perfil.roles as any;
  const nombreRol = (
    Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData?.nombre || ""
  ).toLowerCase();

  const esAdmin = nombreRol.includes("admin");
  const esRepresentante = nombreRol.includes("representante");

  if (!esAdmin && !esRepresentante) {
    return (
      <div className="p-10 text-center text-gray-500">Acceso denegado.</div>
    );
  }

  // 2. Obtener datos según el rol
  let articulos: ArticuloReglamento[] = [];
  let casasDisponibles: Casa[] = [];

  if (esAdmin) {
    // ADMIN: Trae TODO en paralelo
    const [{ data: allReglamento }, { data: allCasas }] = await Promise.all([
      supabase
        .from("reglamento")
        .select(
          `
            *,
            casas (id, nombre),
            sanciones (id, valor_base, codigo_referencia)
          `,
        )
        .order("casa_id")
        .order("numero_articulo", { ascending: true }),
      supabase.from("casas").select("id, nombre, genero").order("nombre"),
    ]);

    articulos = (allReglamento as unknown as ArticuloReglamento[]) || [];
    casasDisponibles = allCasas || [];
  } else {
    // REPRESENTANTE: Trae Globales + Su casa
    const { data: myReglamento } = await supabase
      .from("reglamento")
      .select(
        `
          *,
          casas (id, nombre),
          sanciones (id, valor_base, codigo_referencia)
        `,
      )
      .or(`casa_id.eq.${perfil.casa_id},casa_id.is.null`)
      .order("numero_articulo", { ascending: true });

    articulos = (myReglamento as unknown as ArticuloReglamento[]) || [];
  }

  // Helper para mostrar género
  const getCasaLabel = (nombre: string, genero?: string) => {
    const g = (genero || "").toLowerCase();
    let suffix = "";
    if (g.startsWith("m") && g.includes("asc")) suffix = "Varones";
    else if (g.startsWith("f")) suffix = "Mujeres";
    else if (g.includes("mix")) suffix = "Mixta";
    return suffix ? `${nombre} (${suffix})` : nombre;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <Link
            href={esAdmin ? "/admin" : "/"}
            className="text-sm text-gray-400 hover:text-gray-800 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Volver
          </Link>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Scale className="text-slate-800" />
            {esAdmin ? "Legislación Global" : "Reglamento Interno"}
          </h1>
          <p className="text-gray-500">
            {esAdmin
              ? "Gestión de normas para todas las sedes."
              : "Edición de normas de tu casa."}
          </p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl text-slate-600 text-sm font-bold flex items-center gap-2">
          <UserCog size={16} />
          {esAdmin ? "Modo Administrador" : "Modo Representante"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- COLUMNA 1: FORMULARIO DE CREACIÓN --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 sticky top-4">
            <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Plus
                className="bg-indigo-100 text-indigo-600 rounded p-0.5"
                size={20}
              />
              Nueva Norma
            </h2>

            <form action={crearArticulo} className="space-y-4">
              {/* SELECTOR DE CASA (SOLO ADMIN) */}
              {esAdmin ? (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-800 uppercase mb-1 flex items-center gap-1">
                    <Building2 size={12} /> Asignar a Sede:
                  </label>
                  <select
                    name="casa_id"
                    required
                    defaultValue="GLOBAL"
                    className="w-full p-2 bg-white rounded-lg border border-indigo-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="GLOBAL">
                      🌍 Reglamento Global (Todas las sedes)
                    </option>
                    <option value="" disabled>
                      -- Reglas Específicas --
                    </option>
                    {casasDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCasaLabel(c.nombre, c.genero)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input type="hidden" name="casa_id" value={perfil.casa_id} />
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Capítulo
                </label>
                <input
                  type="text"
                  name="capitulo"
                  placeholder="Ej: Convivencia"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-700"
                  required
                />
              </div>

              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    No.
                  </label>
                  <input
                    type="number"
                    name="numero"
                    placeholder="1"
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-700"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    placeholder="Prohibido Fumar"
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Descripción Legal
                </label>
                <textarea
                  name="descripcion"
                  rows={3}
                  placeholder="Texto completo..."
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 resize-none"
                  required
                ></textarea>
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    name="crear_sancion"
                    id="crear_sancion"
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <label
                    htmlFor="crear_sancion"
                    className="text-sm font-bold text-red-700 cursor-pointer select-none"
                  >
                    Asociar Multa
                  </label>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="codigo_sancion"
                    placeholder="Código (Ej: A-05)"
                    className="w-full p-2 bg-white rounded-lg border border-red-200 text-xs outline-none focus:border-red-400"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      name="precio_multa"
                      placeholder="Valor"
                      className="w-full pl-6 p-2 bg-white rounded-lg border border-red-200 text-xs outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              </div>

              <SubmitButton
                type="submit"
                loadingText="Guardando..."
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-transform active:scale-95 shadow-md"
              >
                {esAdmin ? "Promulgar Ley (Sede)" : "Agregar Norma Local"}
              </SubmitButton>
            </form>
          </div>
        </div>

        {/* --- COLUMNA 2: LISTA VIGENTE --- */}
        <div className="lg:col-span-2 space-y-6">
          {articulos.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-400">No hay leyes registradas.</p>
            </div>
          )}

          {articulos.map((art) => (
            <ArticuloCard
              key={art.id}
              art={art}
              esAdmin={esAdmin}
              miCasaId={perfil.casa_id}
              casasDisponibles={casasDisponibles}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
