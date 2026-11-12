import { createClient } from "@/utils/supabase/server";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { AlertasDeuda } from "@/components/dashboard/AlertasDeuda";
import { TareasEspeciales } from "@/components/dashboard/TareasEspeciales";
import { MisionesDiarias } from "@/components/dashboard/MisionesDiarias";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // --- ZONA HORARIA ---
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const hoy = formatter.format(new Date());

  // 1. EJECUCIÓN PARALELA DE CONSULTAS (La clave de la velocidad ⚡)
  const [
    { data: perfil },
    { data: multasActivas },
    { data: asignacionesPendientes },
    { data: asignacionesHoy },
  ] = await Promise.all([
    supabase
      .from("perfiles")
      .select("*, casas(nombre), roles(nombre)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("multas")
      .select("valor, estado, sanciones(codigo_referencia)")
      .eq("residente_id", user.id)
      .in("estado", ["pendiente", "aprobada"])
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("asignaciones")
      .select("*")
      .eq("residente_id", user.id)
      .eq("realizado", false),
    supabase
      .from("asignaciones")
      .select("*")
      .eq("residente_id", user.id)
      .eq("fecha_asignada", hoy),
  ]);

  // 2. REDIRECCIÓN BASADA EN ROLES
  const nombreRol = (perfil?.roles?.nombre || "").toLowerCase();
  if (nombreRol.includes("admin")) redirect("/admin");
  if (nombreRol.includes("bienestar")) redirect("/bienestar");

  // 3. PROCESAMIENTO DE DATOS
  const deudasReales =
    multasActivas?.filter((m) => m.estado === "aprobada") || [];
  const totalDeuda = deudasReales.reduce(
    (acc, curr) => acc + (curr.valor || 0),
    0,
  );

  const TIPOS_COMUNES = [
    "Cocina",
    "Casa",
    "Baño 1",
    "Baño 2",
    "Nevera 1",
    "Nevera 2",
    "Basura",
  ];
  const misionesDiarias =
    asignacionesHoy?.filter((t) => TIPOS_COMUNES.includes(t.tipo_aseo)) || [];
  const pendientesDiarios = misionesDiarias.filter((t) => !t.realizado);
  const enRevision = misionesDiarias.filter(
    (t) => t.realizado && !t.verificado,
  );
  const aprobadas = misionesDiarias.filter((t) => t.realizado && t.verificado);
  const especialesPendientes =
    asignacionesPendientes?.filter(
      (t) => !TIPOS_COMUNES.includes(t.tipo_aseo),
    ) || [];

  return (
    <div className="space-y-8 w-full max-w-full overflow-x-hidden pb-10">
      {/* GRID SUPERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-center min-w-0">
          <AlertasDeuda totalDeuda={totalDeuda} />
          <WelcomeCard
            apodo={perfil?.apodo}
            casa={perfil?.casas?.nombre}
            es_adjudicado={perfil?.es_adjudicado}
          />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <TareasEspeciales especialesPendientes={especialesPendientes} />
        </div>
      </div>

      {/* SECCIÓN CENTRAL: MISIONES DIARIAS */}
      <MisionesDiarias
        pendientesDiarios={pendientesDiarios}
        enRevision={enRevision}
        aprobadas={aprobadas}
        perfil={perfil}
      />

      {/* GRID INFERIOR (Dejado aquí para no crear tantos archivos pequeños, es muy estático) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
        {/* Mis Multas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} /> Pendientes
            </h3>
            <Link
              href="/multas"
              className="text-xs text-unicor-primary font-bold hover:underline"
            >
              Ver todo
            </Link>
          </div>
          {multasActivas && multasActivas.length > 0 ? (
            <div className="space-y-3 flex-1">
              {multasActivas.map((m, i) => {
                const sancionesRaw = m.sanciones as any;
                const nombreSancion = Array.isArray(sancionesRaw)
                  ? sancionesRaw[0]?.codigo_referencia
                  : sancionesRaw?.codigo_referencia;

                return (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-sm text-gray-800 truncate">
                        {nombreSancion || "Sanción"}
                      </p>
                      <p className="text-[10px] text-red-600 uppercase font-bold tracking-wide">
                        {m.estado}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-gray-700 text-sm whitespace-nowrap">
                      ${m.valor?.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <CheckCircle2 size={48} className="text-green-100 mb-2" />
              <p className="text-sm font-medium text-gray-500">Estás al día</p>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] flex flex-col justify-between group hover:border-unicor-primary/30 transition-colors">
          <div>
            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
              <ShieldAlert className="text-blue-500" size={20} /> Acciones
              Rápidas
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              ¿Viste algo fuera de lugar? Reporta para mantener el orden.
            </p>
          </div>
          <Link
            href="/multas/nueva"
            className="w-full bg-gray-50 hover:bg-unicor-primary group-hover:bg-unicor-primary group-hover:text-white text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200 group-hover:border-unicor-primary"
          >
            <PlusCircle size={20} />
            <span>Reportar Infracción</span>
            <ArrowRight
              size={18}
              className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
