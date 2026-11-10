"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function crearMulta(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. OBTENER PERFIL Y ROL
  const { data: perfilAcusador } = await supabase
    .from("perfiles")
    .select("casa_id, rol_id, roles(nombre)")
    .eq("id", user.id)
    .single();

  if (!perfilAcusador) throw new Error("Perfil no encontrado");

  // Recolección de datos del formulario
  const residente_id = formData.get("residente_id") as string;
  const sancion_id = formData.get("sancion_id") as string;
  const descripcion_personalizada = formData.get(
    "descripcion_personalizada",
  ) as string;
  const fechaInput = formData.get("fecha_incidente") as string;

  // Testigos (Vienen vacíos si el que multa es Bienestar)
  const testigo1_id = formData.get("testigo1_id") as string;
  const testigo2_id = formData.get("testigo2_id") as string;

  // --- 👮 REGLA DE LAS 24 HORAS ---
  const fechaIncidente = fechaInput ? new Date(fechaInput) : new Date();
  const ahora = new Date();
  const diferenciaMs = ahora.getTime() - fechaIncidente.getTime();
  const horasTranscurridas = diferenciaMs / (1000 * 60 * 60);

  if (horasTranscurridas > 24) {
    console.error("Intento de multa prescrita");
    return redirect("/multas/nueva?error=prescrita");
  }
  // --------------------------------

  // 2. CALCULAR VALOR (LÓGICA BIENESTAR x2) ⚖️
  const { data: sancion } = await supabase
    .from("sanciones")
    .select("valor_base")
    .eq("id", sancion_id)
    .single();

  let valorFinal = sancion?.valor_base || 0;

  // Identificar si es Bienestar (Rol ID 6 en tu base de datos)
  const esBienestar = perfilAcusador.rol_id === 6;

  if (esBienestar) {
    valorFinal = valorFinal * 2; // 🔥 DOBLE CASTIGO
  }

  // Lógica de Poder Supremo
  const estadoInicial = esBienestar ? "aprobada" : "pendiente";

  // 3. INSERTAR LA MULTA PRINCIPAL
  const { data: nuevaMulta, error: errorMulta } = await supabase
    .from("multas")
    .insert({
      casa_id: perfilAcusador.casa_id,
      acusador_id: user.id,
      residente_id: residente_id,
      sancion_id: sancion_id,
      valor: valorFinal,
      descripcion_personalizada: descripcion_personalizada,
      estado: estadoInicial,
      es_bienestar: esBienestar,
      fecha_incidente: fechaIncidente.toISOString(),
    })
    .select("id") // Pedimos que nos devuelva el ID recién creado
    .single();

  if (errorMulta || !nuevaMulta) {
    console.error("Error al crear multa:", errorMulta);
    return redirect("/multas/nueva?error=true");
  }

  // 4. ASIGNAR TESTIGOS (Solo si no es Bienestar)
  if (!esBienestar && testigo1_id && testigo2_id) {
    const testimonios = [
      { multa_id: nuevaMulta.id, testigo_id: testigo1_id, estado: "pendiente" },
      { multa_id: nuevaMulta.id, testigo_id: testigo2_id, estado: "pendiente" },
    ];

    const { error: errorTestigos } = await supabase
      .from("testimonios_multas")
      .insert(testimonios);

    if (errorTestigos) {
      console.error("Error al asignar testigos:", errorTestigos);
    }
  }

  return redirect("/multas");
}
