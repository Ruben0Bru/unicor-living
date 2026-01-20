'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function crearMulta(formData: FormData) {
  const supabase = await createClient()
  
  // ... (Validación de usuario y perfil igual que antes) ...
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfilAcusador } = await supabase
    .from('perfiles')
    .select('casa_id, rol_id')
    .eq('id', user.id)
    .single()

  if (!perfilAcusador) throw new Error("Perfil no encontrado")

  // Recolección de datos
  const residente_id = formData.get('residente_id') as string
  const sancion_id = formData.get('sancion_id') as string
  const descripcion_personalizada = formData.get('descripcion_personalizada') as string
  const fechaInput = formData.get('fecha_incidente') as string
  const evidenciaFile = formData.get('evidencia') as File

  // --- 👮 REGLA DE LAS 24 HORAS (NUEVO) ---
  
  // 1. Determinar fecha del incidente (Si no pone nada, asumimos "ahora")
  const fechaIncidente = fechaInput ? new Date(fechaInput) : new Date()
  const ahora = new Date()

  // 2. Calcular diferencia en horas
  // (Resta en milisegundos / 1000 / 60 / 60 = Horas)
  const diferenciaMs = ahora.getTime() - fechaIncidente.getTime()
  const horasTranscurridas = diferenciaMs / (1000 * 60 * 60)

  // 3. Validar prescripción
  if (horasTranscurridas > 24) {
    // Si pasaron más de 24h, rechazamos y devolvemos error específico
    console.error("Intento de multa prescrita")
    return redirect('/multas/nueva?error=prescrita') 
  }
  // ------------------------------------------

  // ... (El resto del código de cálculo de precio, subida de foto e insert sigue IGUAL) ...
  
  const { data: sancion } = await supabase
    .from('sanciones')
    .select('valor_base')
    .eq('id', sancion_id)
    .single()
    
  let valorFinal = sancion?.valor_base || 0

  // Subida de foto...
  let evidencia_url = null
  if (evidenciaFile && evidenciaFile.size > 0) {
     // ... (tu lógica de upload)
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
      estado: 'pendiente', 
      es_bienestar: false, 
      fecha_incidente: fechaIncidente.toISOString() // Guardamos la fecha parseada
    })

  if (error) {
    return redirect('/multas/nueva?error=true')
  }

  return redirect('/multas')
}