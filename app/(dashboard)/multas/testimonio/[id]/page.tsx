import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  AlertOctagon,
  Info,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

// ACTION: Guardar el testimonio
async function enviarDeclaracion(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const testimonioId = formData.get("testimonio_id") as string;
  const declaracion = formData.get("declaracion") as string;
  const accion = formData.get("accion") as string;

  const estadoFinal = accion === "aceptar" ? "aceptado" : "declinado";

  const { error } = await supabase
    .from("testimonios_multas")
    .update({
      declaracion: declaracion || null,
      estado: estadoFinal,
    })
    .eq("id", testimonioId)
    .eq("testigo_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/multas");
  redirect("/multas");
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TestimonioPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resolvedParams = await params;
  const testimonioId = resolvedParams.id;

  const { data: testimonio } = await supabase
    .from("testimonios_multas")
    .select(
      `
        id,
        estado,
        multa:multas (
            descripcion_personalizada,
            valor,
            sancion:sanciones(descripcion, codigo_referencia),
            acusador:perfiles!acusador_id(nombre_completo, apodo),
            acusado:perfiles!residente_id(nombre_completo, apodo)
        )
    `,
    )
    .eq("id", testimonioId)
    .eq("testigo_id", user.id)
    .single();

  if (!testimonio) {
    return (
      <div className="text-center py-20 text-gray-500">
        No tienes acceso a este testimonio o no existe.
      </div>
    );
  }

  if (testimonio.estado !== "pendiente") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Caso Cerrado
          </h2>
          <p className="text-gray-500 mb-6">
            Ya diste tu declaración para este llamado.
          </p>
          <Link
            href="/multas"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Volver a Justicia
          </Link>
        </div>
      </div>
    );
  }

  // Protección anti-nulls
  const multa = (testimonio.multa as any) || {};
  const sancion = multa.sancion || {};
  const acusador = multa.acusador || {};
  const acusado = multa.acusado || {};

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <Link
        href="/multas"
        className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors mb-6 group text-sm font-bold"
      >
        <ArrowLeft
          size={16}
          className="mr-2 group-hover:-translate-x-1 transition-transform"
        />
        Volver a la bandeja
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <UserCheck className="text-indigo-600" size={32} />
          Llamado al Estrado
        </h1>
        <p className="text-gray-500 mt-1">
          Has sido citado como testigo ocular. Tu versión es vital para la
          decisión del juez.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-slate-700 mb-2 inline-block">
              Datos del Caso
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              <span className="text-indigo-400">
                {acusador.apodo || "Desconocido"}
              </span>{" "}
              acusa a{" "}
              <span className="text-red-400">
                {acusado.apodo || "Desconocido"}
              </span>
            </h3>
          </div>
          <div className="text-right">
            <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Infracción
            </span>
            <span className="font-mono text-lg text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              {sancion.codigo_referencia || "Desconocida"}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
              <AlertOctagon size={14} className="text-slate-400" /> Falta
              Reportada
            </h4>
            <p className="text-slate-700 italic">
              "{sancion.descripcion || "Descripción no disponible."}"
            </p>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
            <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2 mb-3">
              <FileText size={14} className="text-indigo-400" /> Relato del
              Acusador
            </h4>
            <p className="text-gray-800 font-medium leading-relaxed">
              {multa.descripcion_personalizada || "Relato no disponible."}
            </p>
          </div>

          <form
            action={enviarDeclaracion}
            className="mt-8 border-t border-gray-100 pt-8"
          >
            <input type="hidden" name="testimonio_id" value={testimonio.id} />

            <div className="space-y-3 mb-8">
              <label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                Tu Declaración Jurada
              </label>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex gap-3 text-sm text-yellow-800 mb-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                  Narra lo que viste. Si vas a declinar por falta de pruebas,
                  explica brevemente por qué.
                </p>
              </div>
              <textarea
                name="declaracion"
                required
                placeholder="Yo presencié que..."
                className="w-full p-4 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[150px]"
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                name="accion"
                value="declinar"
                className="flex-1 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-bold py-4 rounded-xl transition-all"
              >
                Declinar Llamado
              </button>
              <button
                type="submit"
                name="accion"
                value="aceptar"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold py-4 rounded-xl transition-all transform hover:-translate-y-1"
              >
                Respaldar y Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
