'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// APROBAR: El fiscal firma y sella ✅
export async function aprobarAseo(asignacionId: string, observacion: string = "Todo en orden") {
  const supabase = await createClient()
  
  // 1. Obtener la identidad del Fiscal
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Debes iniciar sesión para verificar.")

  // 2. Actualizar con FIRMA y OBSERVACIÓN
  const { error } = await supabase
    .from('asignaciones')
    .update({ 
        verificado: true,
        verificado_por: user.id, // <--- Aquí queda la huella del fiscal
        observaciones_fiscal: observacion,
        realizado: true // Aseguramos que quede como realizado
    })
    .eq('id', asignacionId)

  if (error) {
    console.error("Error al aprobar:", error)
    throw new Error('No se pudo aprobar la tarea.')
  }

  revalidatePath('/') 
  revalidatePath('/fiscalia')
}

// RECHAZAR: El fiscal devuelve la tarea ❌
export async function rechazarAseo(asignacionId: string, observacion: string = "Rechazado por incumplimiento") {
  const supabase = await createClient()

  // 1. Obtener la identidad del Fiscal
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Debes iniciar sesión para verificar.")

  // 2. Devolver la tarea. 
  // IMPORTANTE: Dejamos 'verificado_por' y 'observacion' para que el residente sepa QUIÉN lo rechazó y POR QUÉ.
  const { error } = await supabase
    .from('asignaciones')
    .update({ 
      realizado: false, // Vuelve a estar pendiente
      verificado: false, // No está aprobada
      verificado_por: user.id, // Firma del rechazo
      observaciones_fiscal: observacion // "Quedó sucio el piso"
    })
    .eq('id', asignacionId)

  if (error) {
      console.error("Error al rechazar:", error)
      throw new Error('No se pudo rechazar la tarea.')
  }
  
  revalidatePath('/')
  revalidatePath('/fiscalia')
}