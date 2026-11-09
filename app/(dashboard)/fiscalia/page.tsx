import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ClipboardCheck, XCircle } from "lucide-react";
import { TareaFiscal } from "./TareaFiscal";

export default async function FiscaliaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("*, roles(nombre)")
    .eq("id", user.id)
    .single();

  const nombreRol = miPerfil?.roles?.nombre?.toLowerCase() || "";
  const esFiscal =
    nombreRol.includes("fiscal") ||
    nombreRol.includes("admin") ||
    nombreRol.includes("representante");

  if (!esFiscal) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <XCircle size={40} className="text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-700">Acceso Restringido</h1>
        <p className="text-gray-500 mt-2">No tienes permisos de Fiscal.</p>
      </div>
    );
  }

  // 3. TRAER TAREAS CON ALIAS PARA RESIDENTE Y TESTIGO 👇
  const { data: revisiones } = await supabase
    .from("asignaciones")
    .select(
      `
      *, 
      residente:perfiles!asignaciones_residente_id_fkey(apodo, avatar_url, nombre_completo),
      testigo:perfiles!asignaciones_testigo_id_fkey(nombre_completo)
    `,
    )
    .eq("casa_id", miPerfil.casa_id)
    .eq("realizado", true)
    .neq("verificado", true)
    .order("fecha_asignada", { ascending: true });

  const hayDatos = revisiones && revisiones.length > 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <ClipboardCheck size={24} />
          </span>
          Fiscalía
        </h1>
        <p className="text-gray-500">Solicitudes de verificación de aseo.</p>
      </div>

      {hayDatos ? (
        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
          <div className="grid gap-4">
            {revisiones.map((tarea: any) => {
              // Pasamos los objetos separados al componente visual 👇
              const perfilResidente = tarea.residente;
              const perfilTestigo = tarea.testigo;
              return (
                <TareaFiscal
                  key={tarea.id}
                  tarea={tarea}
                  perfil={perfilResidente}
                  testigo={perfilTestigo}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <ClipboardCheck size={48} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-600">Todo verificado</h3>
          <p className="text-sm text-gray-400">
            No hay tareas pendientes de revisión en este momento.
          </p>
        </div>
      )}
    </div>
  );
}
