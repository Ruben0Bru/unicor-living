'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function crearMulta(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. OBTENER PERFIL Y ROL
  const { data: perfilAcusador } = await supabase
    .from('perfiles')
    .select('casa_id, rol_id, roles(nombre)') // Importante: rol_id y nombre por si acaso
    .eq('id', user.id)
    .single()

  if (!perfilAcusador) throw new Error("Perfil no encontrado")

  // Recolección de datos del formulario
  const residente_id = formData.get('residente_id') as string
  const sancion_id = formData.get('sancion_id') as string
  const descripcion_personalizada = formData.get('descripcion_personalizada') as string
  const fechaInput = formData.get('fecha_incidente') as string
  const evidenciaFile = formData.get('evidencia') as File

  // --- 👮 REGLA DE LAS 24 HORAS ---
  const fechaIncidente = fechaInput ? new Date(fechaInput) : new Date()
  const ahora = new Date()
  const diferenciaMs = ahora.getTime() - fechaIncidente.getTime()
  const horasTranscurridas = diferenciaMs / (1000 * 60 * 60)

  if (horasTranscurridas > 24) {
    console.error("Intento de multa prescrita")
    return redirect('/multas/nueva?error=prescrita') 
  }
  // --------------------------------

  // 2. CALCULAR VALOR (LÓGICA BIENESTAR x2) ⚖️
  const { data: sancion } = await supabase
    .from('sanciones')
    .select('valor_base')
    .eq('id', sancion_id)
    .single()
    
  let valorFinal = sancion?.valor_base || 0

  // Identificar si es Bienestar (Rol ID 6)
  const esBienestar = perfilAcusador.rol_id === 6 
  
  if (esBienestar) {
    valorFinal = valorFinal * 2 // 🔥 DOBLE CASTIGO
  }

  // 🔥 LÓGICA DE PODER SUPREMO:
  // Si es Bienestar, la multa nace 'aprobada' (no requiere juez).
  // Si es otro rol (Fiscal, Tesorero, Residente), nace 'pendiente' (va al Estrado).
  const estadoInicial = esBienestar ? 'aprobada' : 'pendiente'

  // Subida de foto...
  let evidencia_url = null
  if (evidenciaFile && evidenciaFile.size > 0) {
      const fileExt = evidenciaFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('evidencia').upload(fileName, evidenciaFile)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
           .from('evidencia').getPublicUrl(fileName)
        evidencia_url = publicUrl
      }
  }

  // 3. INSERTAR
  const { error } = await supabase
    .from('multas')
    .insert({
      casa_id: perfilAcusador.casa_id,
      acusador_id: user.id,
      residente_id: residente_id,
      sancion_id: sancion_id,
      valor: valorFinal, 
      descripcion_personalizada: descripcion_personalizada,
      evidencia_url: evidencia_url,
      
      // ✅ Aquí aplicamos el estado dinámico:
      estado: estadoInicial, 
      
      es_bienestar: esBienestar,
      fecha_incidente: fechaIncidente.toISOString()
    })

  if (error) {
    console.error("Error al crear multa:", error)
    return redirect('/multas/nueva?error=true')
  }

  return redirect('/multas')
}