"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function firmarAseoComoTestigo(asignacionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("asignaciones")
    .update({ testigo_id: user.id })
    .eq("id", asignacionId)
    .select();

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    throw new Error("Bloqueo de seguridad: No se pudo registrar la firma.");
  }

  revalidatePath("/secretaria");
  revalidatePath("/fiscalia");
  revalidatePath("/");
}

export async function marcarTareaCompletada(asignacionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("asignaciones")
    .update({ realizado: true })
    .eq("id", asignacionId)
    .eq("residente_id", user.id); // Seguridad extra

  if (error) throw new Error("Error al marcar la tarea");

  revalidatePath("/");
}
