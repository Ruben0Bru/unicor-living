"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Verificar Permisos (Admin O Representante)
async function checkPermissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("casa_id, roles(nombre)")
    .eq("id", user.id)
    .single();

  if (!perfil) throw new Error("Perfil no encontrado");

  const rolesData = perfil.roles as any;
  const nombreRol = (
    Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData?.nombre || ""
  ).toLowerCase();

  const esAdmin = nombreRol.includes("admin");
  const esRepresentante = nombreRol.includes("representante");

  if (!esAdmin && !esRepresentante) {
    throw new Error("Acceso denegado: Se requiere ser Admin o Representante.");
  }

  return { supabase, perfil, esAdmin };
}

// 1. CREAR ARTÍCULO
export async function crearArticulo(formData: FormData) {
  const { supabase, perfil, esAdmin } = await checkPermissions();

  const capitulo = formData.get("capitulo") as string;
  const numero = formData.get("numero") as string;
  const titulo = formData.get("titulo") as string;
  const descripcion = formData.get("descripcion") as string;

  let casaDestinoId: string | null = perfil.casa_id;

  if (esAdmin) {
    const selectedCasa = formData.get("casa_id") as string;
    if (selectedCasa === "GLOBAL") {
      casaDestinoId = null;
    } else if (selectedCasa) {
      casaDestinoId = selectedCasa;
    }
  }

  const crearSancion = formData.get("crear_sancion") === "on";
  const precioMulta = formData.get("precio_multa");
  const codigoSancion = formData.get("codigo_sancion") as string;

  if (!numero || !titulo || !descripcion)
    throw new Error("Faltan datos obligatorios");

  const { data: articulo, error: errorArt } = await supabase
    .from("reglamento")
    .insert({
      casa_id: casaDestinoId,
      capitulo,
      numero_articulo: numero,
      titulo,
      descripcion_texto: descripcion,
    })
    .select()
    .single();

  if (errorArt) throw new Error("Error creando artículo: " + errorArt.message);

  if (crearSancion && articulo) {
    await supabase.from("sanciones").insert({
      casa_id: casaDestinoId,
      reglamento_id: articulo.id,
      codigo_referencia: codigoSancion || `ART-${numero}`,
      descripcion: `Violación al Art. ${numero}: ${titulo}`,
      valor_base: Number(precioMulta),
      categoria: "disciplinaria",
    });
  }

  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}

// 2. EDITAR ARTÍCULO
export async function editarArticulo(formData: FormData) {
  const { supabase, perfil, esAdmin } = await checkPermissions();

  const id = formData.get("id") as string;
  const capitulo = formData.get("capitulo") as string;
  const numero = formData.get("numero") as string;
  const titulo = formData.get("titulo") as string;
  const descripcion = formData.get("descripcion") as string;

  if (!id || !numero || !titulo || !descripcion) {
    throw new Error("Faltan datos obligatorios");
  }

  const { data: articuloActual, error: fetchError } = await supabase
    .from("reglamento")
    .select("casa_id")
    .eq("id", id)
    .single();

  if (fetchError || !articuloActual) throw new Error("Artículo no encontrado");

  if (!esAdmin && articuloActual.casa_id !== perfil.casa_id) {
    throw new Error(
      "No tienes permiso para editar normas globales o de otra casa.",
    );
  }

  let casaDestinoId: string | null = articuloActual.casa_id;
  if (esAdmin) {
    const selectedCasa = formData.get("casa_id") as string;
    casaDestinoId = selectedCasa === "GLOBAL" ? null : selectedCasa;
  }

  const { error: updateError } = await supabase
    .from("reglamento")
    .update({
      casa_id: casaDestinoId,
      capitulo,
      numero_articulo: numero,
      titulo,
      descripcion_texto: descripcion,
    })
    .eq("id", id);

  if (updateError)
    throw new Error("Error actualizando artículo: " + updateError.message);

  if (esAdmin && casaDestinoId !== articuloActual.casa_id) {
    await supabase
      .from("sanciones")
      .update({ casa_id: casaDestinoId })
      .eq("reglamento_id", id);
  }

  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}

// 3. ELIMINAR ARTÍCULO
export async function eliminarArticulo(id: string) {
  const { supabase, perfil, esAdmin } = await checkPermissions();

  if (!esAdmin) {
    const { data: articulo } = await supabase
      .from("reglamento")
      .select("casa_id")
      .eq("id", id)
      .single();

    if (!articulo || articulo.casa_id !== perfil.casa_id) {
      throw new Error("No puedes eliminar normas globales o de otra casa.");
    }
  }

  await supabase.from("reglamento").delete().eq("id", id);
  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}

// 4. AGREGAR SANCIÓN A ARTÍCULO EXISTENTE
export async function agregarSancionExtra(formData: FormData) {
  const { supabase, perfil, esAdmin } = await checkPermissions();

  const reglamentoId = formData.get("reglamento_id") as string;
  const codigo = formData.get("codigo") as string;
  const valor = formData.get("valor") as string;

  if (!reglamentoId || !codigo || !valor) throw new Error("Datos incompletos");

  const { data: articulo } = await supabase
    .from("reglamento")
    .select("casa_id, numero_articulo, titulo")
    .eq("id", reglamentoId)
    .single();

  if (!articulo) throw new Error("Artículo no encontrado");

  if (!esAdmin && articulo.casa_id !== perfil.casa_id) {
    throw new Error("No puedes editar normas globales o de otra casa.");
  }

  const { error } = await supabase.from("sanciones").insert({
    casa_id: articulo.casa_id,
    reglamento_id: reglamentoId,
    codigo_referencia: codigo,
    descripcion: `Violación al Art. ${articulo.numero_articulo}: ${articulo.titulo}`,
    valor_base: Number(valor),
    categoria: "disciplinaria",
  });

  if (error) {
    console.error("Error al insertar sanción:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}

// 5. EDITAR SANCIÓN INDIVIDUAL
export async function editarSancion(formData: FormData) {
  const { supabase, perfil, esAdmin } = await checkPermissions();

  const sancionId = formData.get("sancion_id") as string;
  const codigo = formData.get("codigo") as string;
  const valor = formData.get("valor") as string;

  if (!sancionId || !codigo || !valor) throw new Error("Datos incompletos");

  const { data: sancion } = await supabase
    .from("sanciones")
    .select("casa_id")
    .eq("id", sancionId)
    .single();

  if (!sancion) throw new Error("Sanción no encontrada");

  if (!esAdmin && sancion.casa_id !== perfil.casa_id) {
    throw new Error("No puedes editar sanciones globales o de otra casa.");
  }

  const { error } = await supabase
    .from("sanciones")
    .update({
      codigo_referencia: codigo,
      valor_base: Number(valor),
    })
    .eq("id", sancionId);

  if (error) throw new Error("Error actualizando sanción: " + error.message);

  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}

// 6. ELIMINAR SANCIÓN INDIVIDUAL
export async function eliminarSancion(sancionId: string) {
  const { supabase, perfil, esAdmin } = await checkPermissions();

  if (!esAdmin) {
    const { data: sancion } = await supabase
      .from("sanciones")
      .select("casa_id")
      .eq("id", sancionId)
      .single();

    if (!sancion || sancion.casa_id !== perfil.casa_id) {
      throw new Error("No puedes eliminar sanciones globales o de otra casa.");
    }
  }

  const { error } = await supabase
    .from("sanciones")
    .delete()
    .eq("id", sancionId);

  if (error) throw new Error("Error eliminando sanción: " + error.message);

  revalidatePath("/admin/reglamento");
  revalidatePath("/reglamento");
}
