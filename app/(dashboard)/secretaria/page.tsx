import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CalendarioSecretario } from "./CalendarioSecretario";
import { obtenerDatosPlanificacion } from "./actions";
import { GeneradorAseosModal } from "./GeneradorAseosModal";

export default async function SecretariaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("roles(nombre)")
    .eq("id", user.id)
    .single();

  const rol = (perfil?.roles as any)?.nombre?.toLowerCase() || "";

  // 1. Calculamos los permisos de forma segura
  const esSecretario = rol.includes("secretario") || rol.includes("admin");
  const esRepresentante =
    rol.includes("representante") || rol.includes("admin");

  const { residentes, asignaciones } = await obtenerDatosPlanificacion();

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-4xl shadow-sm shrink-0">
            📅
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Mesa del Secretario
            </h1>
            <p className="text-gray-500 font-medium">
              Gestión del cronograma operativo de limpieza.
            </p>
          </div>
        </div>

        {/* 2. Ocultamos la herramienta destructiva si no es el secretario */}
        {esSecretario && (
          <div className="flex-shrink-0">
            <GeneradorAseosModal residentes={residentes} />
          </div>
        )}
      </div>

      {/* 3. Le pasamos los permisos al calendario para que sepa cómo reaccionar */}
      <CalendarioSecretario
        residentes={residentes}
        asignacionesIniciales={asignaciones}
        esSecretario={esSecretario}
        esRepresentante={esRepresentante}
      />
    </div>
  );
}
