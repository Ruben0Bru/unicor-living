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

  // Testigos dinámicos (1 o más)
  const testigosRaw = formData.getAll("testigos") as string[];
  const testigosUnicos = Array.from(
    new Set(
      testigosRaw.filter(
        (id) => id && id.trim() !== "" && id !== residente_id && id !== user.id,
      ),
    ),
  );

  // Identificar si es Bienestar (Rol ID 6 en tu base de datos)
  const esBienestar = perfilAcusador.rol_id === 6;

  // Validar mínimo 1 testigo si no es Bienestar
  if (!esBienestar && testigosUnicos.length === 0) {
    return redirect("/multas/nueva?error=sin_testigos");
  }

  // --- 👮 REGLA DE LAS 24 HORAS ---
  const fechaIncidente = fechaInput ? new Date(fechaInput) : new Date();
  const ahora = new Date();
  const diferenciaMs = ahora.getTime() - fechaIncidente.getTime();
  const horasTranscurridas = diferenciaMs / (1000 * 60 * 60);

  if (horasTranscurridas > 24) {
    console.error("Intento de multa prescrita");
    return redirect("/multas/nueva?error=prescrita");
  }

  // --- 🛡️ ESCUDO ANTI-DUPLICADOS (15 segundos) ---
  const hace15Segundos = new Date(Date.now() - 15 * 1000).toISOString();
  const { data: multaReciente } = await supabase
    .from("multas")
    .select("id")
    .eq("acusador_id", user.id)
    .eq("residente_id", residente_id)
    .eq("sancion_id", sancion_id)
    .gte("created_at", hace15Segundos)
    .limit(1);

  if (multaReciente && multaReciente.length > 0) {
    // Ya se registró hace unos segundos, redirigimos sin duplicar
    return redirect("/multas");
  }

  // 2. CALCULAR VALOR (LÓGICA BIENESTAR x2) ⚖️
  const { data: sancion } = await supabase
    .from("sanciones")
    .select("valor_base")
    .eq("id", sancion_id)
    .single();

  let valorFinal = sancion?.valor_base || 0;

  if (esBienestar) {
    valorFinal = valorFinal * 2; // 🔥 DOBLE CASTIGO
  }

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
    .select("id")
    .single();

  if (errorMulta || !nuevaMulta) {
    console.error("Error al crear multa:", errorMulta);
    return redirect("/multas/nueva?error=true");
  }

  // 4. ASIGNAR TESTIGOS (Solo si no es Bienestar)
  if (!esBienestar && testigosUnicos.length > 0) {
    const testimonios = testigosUnicos.map((testigoId) => ({
      multa_id: nuevaMulta.id,
      testigo_id: testigoId,
      estado: "pendiente",
    }));

    const { error: errorTestigos } = await supabase
      .from("testimonios_multas")
      .insert(testimonios);

    if (errorTestigos) {
      console.error("Error al asignar testigos:", errorTestigos);
    }
  }

  return redirect("/multas");
}
