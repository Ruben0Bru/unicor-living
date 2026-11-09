"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Función para que un residente "dé fe" de que el aseo de otro está limpio
export async function firmarAseoComoTestigo(asignacionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  // 1. Obtenemos el perfil del usuario actual (el testigo)
  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!miPerfil) throw new Error("Perfil no encontrado");

  // 2. Registramos su firma en la asignación
  const { error } = await supabase
    .from("asignaciones")
    .update({
      testigo_id: miPerfil.id,
    })
    .eq("id", asignacionId);

  if (error) {
    console.error("Error al firmar aseo:", error);
    throw new Error("No se pudo registrar la firma.");
  }

  // 3. Recargamos la página para que el botón cambie visualmente de inmediato
  revalidatePath("/");
}
