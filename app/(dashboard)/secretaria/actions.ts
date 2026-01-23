'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. OBTENER DATOS (FILTRADOS POR CASA 🏠)
export async function obtenerDatosPlanificacion() {
  const supabase = await createClient()
  
  // A. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // B. Obtener la CASA del usuario
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('casa_id')
    .eq('id', user.id)
    .single()

  if (!miPerfil?.casa_id) throw new Error("Usuario sin casa asignada")

  const casaId = miPerfil.casa_id

  // C. Traer asignaciones SOLO de mi casa
  const { data: asignaciones } = await supabase
    .from('asignaciones')
    .select('*')
    .eq('casa_id', casaId) 
  
  // D. Traer residentes SOLO de mi casa
  const { data: residentes } = await supabase
    .from('perfiles')
    .select('id, apodo, avatar_url, es_adjudicado, equipo_aseo')
    .eq('casa_id', casaId) // <--- EL FILTRO CLAVE
    .order('apodo')

  return { residentes: residentes || [], asignaciones: asignaciones || [] }
}

export async function guardarAsignacionesDia(fechaIso: string, nuevasAsignaciones: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { data: miPerfil } = await supabase.from('perfiles').select('casa_id').eq('id', user.id).single()
    const casaId = miPerfil?.casa_id
    if (!casaId) throw new Error("No tienes casa asignada")

    // A. Borrar
    await supabase.from('asignaciones').delete().eq('fecha_asignada', fechaIso).eq('casa_id', casaId)

    // B. Insertar
    if (nuevasAsignaciones.length > 0) {
        const asignacionesConDatosCompletos = nuevasAsignaciones.map(a => ({
            ...a,
            casa_id: casaId,
            // 🛑 CAMBIO CLAVE: Usamos la fecha_limite que viene del frontend, 
            // si no viene (tareas viejas), usamos fechaIso por defecto.
            fecha_limite: a.fecha_limite || fechaIso, 
            verificado_por: null,
            observaciones_fiscal: null
        }))

        const { error } = await supabase.from('asignaciones').insert(asignacionesConDatosCompletos)
        if (error) throw new Error(error.message)
    }

    revalidatePath('/secretaria')
    revalidatePath('/') 
}