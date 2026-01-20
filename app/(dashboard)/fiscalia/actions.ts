'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// APROBAR: El fiscal dice que está limpio
export async function aprobarAseo(asignacionId: string) {
  const supabase = await createClient()
  
  // Aquí deberíamos validar que el usuario sea Fiscal (rol), 
  // pero por ahora confiamos en la interfaz.

  const { error } = await supabase
    .from('asignaciones')
    .update({ verificado: true })
    .eq('id', asignacionId)

  if (error) throw new Error('Error al aprobar')
  revalidatePath('/') // Actualiza dashboard del residente
  revalidatePath('/fiscalia') // Actualiza dashboard del fiscal
}

// RECHAZAR: El fiscal dice que está sucio
export async function rechazarAseo(asignacionId: string) {
  const supabase = await createClient()

  // Devolvemos la tarea al estado inicial: No realizada y No verificada
  const { error } = await supabase
    .from('asignaciones')
    .update({ 
      realizado: false, 
      verificado: false 
    })
    .eq('id', asignacionId)

  if (error) throw new Error('Error al rechazar')
  
  revalidatePath('/')
  revalidatePath('/fiscalia')
}