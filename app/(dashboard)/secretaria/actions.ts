"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { GeneradorAseosPayload } from "@/types/aseos";
import { generarMatrizAseos } from "@/lib/aseosEngine";

// 1. OBTENER DATOS (FILTRADOS POR CASA 🏠)
export async function obtenerDatosPlanificacion() {
  const supabase = await createClient();

  // A. Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // B. Obtener la CASA del usuario
  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("casa_id")
    .eq("id", user.id)
    .single();

  if (!miPerfil?.casa_id) throw new Error("Usuario sin casa asignada");

  const casaId = miPerfil.casa_id;

  // C. Traer asignaciones SOLO de mi casa
  const { data: asignaciones } = await supabase
    .from("asignaciones")
    .select("*")
    .eq("casa_id", casaId);

  // D. Traer residentes SOLO de mi casa
  const { data: residentes } = await supabase
    .from("perfiles")
    .select(
      "id, nombre:nombre_completo, avatar_url, es_adjudicado, equipo_aseo",
    )
    .eq("casa_id", casaId)
    .order("nombre_completo");

  return { residentes: residentes || [], asignaciones: asignaciones || [] };
}

export async function guardarAsignacionesDia(
  fechaIso: string,
  nuevasAsignaciones: any[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("casa_id")
    .eq("id", user.id)
    .single();
  const casaId = miPerfil?.casa_id;
  if (!casaId) throw new Error("No tienes casa asignada");

  // 1. Obtener las tareas que ya existen hoy en la BD
  const { data: actuales } = await supabase
    .from("asignaciones")
    .select("id")
    .eq("fecha_asignada", fechaIso)
    .eq("casa_id", casaId);
  const idsActuales = actuales?.map((a) => a.id) || [];

  // 2. Separar las tareas
  const tareasExistentes: any[] = [];
  const tareasNuevas: any[] = [];
  const idsQueSeQuedan: string[] = [];

  for (const tarea of nuevasAsignaciones) {
    if (tarea.id !== null) {
      // Si tiene ID, ya existía. La guardamos para actualizarla.
      tareasExistentes.push({ ...tarea, casa_id: casaId });
      idsQueSeQuedan.push(tarea.id);
    } else {
      // Si el id es null, es NUEVA.
      // Extraemos todo menos el 'id' para que Supabase le asigne su UUID automáticamente.
      const { id, ...tareaLimpia } = tarea;
      tareasNuevas.push({ ...tareaLimpia, casa_id: casaId });
    }
  }
  // 3. Borrar solo las tareas que el secretario desasignó en el modal
  const idsBorrados = idsActuales.filter((id) => !idsQueSeQuedan.includes(id));
  if (idsBorrados.length > 0) {
    await supabase.from("asignaciones").delete().in("id", idsBorrados);
  }

  // 4. Actualizar las tareas que se mantienen (para no perder el progreso de los residentes)
  if (tareasExistentes.length > 0) {
    const { error } = await supabase
      .from("asignaciones")
      .upsert(tareasExistentes);
    if (error) throw new Error("Error al actualizar: " + error.message);
  }

  // 5. Insertar las tareas nuevas
  if (tareasNuevas.length > 0) {
    const { error } = await supabase.from("asignaciones").insert(tareasNuevas);
    if (error) throw new Error("Error al insertar: " + error.message);
  }

  revalidatePath("/secretaria");
  revalidatePath("/");
}

//Motor de generación masiva
export async function generarAseosMensuales(payload: GeneradorAseosPayload) {
  const supabase = await createClient();

  // 1. Verificación de Seguridad y Contexto
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("casa_id, roles(nombre)")
    .eq("id", user.id)
    .single();

  if (!perfil?.casa_id) throw new Error("Usuario sin casa asignada");

  const rol = (perfil.roles as any)?.nombre?.toLowerCase() || "";
  if (!rol.includes("admin") && !rol.includes("secretario")) {
    throw new Error("Privilegios insuficientes para generar aseos.");
  }

  // 2. Procesamiento Lógico (Inyectamos el casa_id seguro desde el servidor)
  const payloadSeguro = {
    ...payload,
    casa_id: perfil.casa_id,
  };

  const matrizAseos = generarMatrizAseos(payloadSeguro);

  if (matrizAseos.length === 0) {
    throw new Error("El motor no generó asignaciones. Revisa los parámetros.");
  }

  // 3. Ingesta Masiva en la DB
  const { error } = await supabase.from("asignaciones").insert(matrizAseos);

  if (error) {
    console.error("Error en la transacción DB:", error);
    throw new Error(`Fallo en base de datos al guardar: ${error.message}`);
  }

  // 4. Refrescar Vistas
  revalidatePath("/secretaria");
  revalidatePath("/");
}

export async function verificarAsignacion(asignacionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("asignaciones")
    .update({
      realizado: true,
      verificado_por: user.id,
    })
    .eq("id", asignacionId);

  if (error) throw new Error(error.message);
  revalidatePath("/secretaria");
}
