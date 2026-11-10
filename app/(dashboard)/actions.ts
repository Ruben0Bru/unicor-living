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
