'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('roles(nombre)')
    .eq('id', user.id)
    .single()

  const nombreRol = (perfil?.roles as any)?.nombre || ''
  if (!nombreRol.toLowerCase().includes('admin')) {
      throw new Error("Acceso Denegado.")
  }
  return supabase
}

// ✅ APROBAR INGRESO
export async function aprobarSolicitud(usuarioId: string, casaId: string, rolId: number) {
    const supabase = await verificarAdmin()
    
    const { error } = await supabase
        .from('perfiles')
        .update({ 
            autorizado: true,
            casa_id: casaId,
            rol_id: rolId
        })
        .eq('id', usuarioId)

    if (error) throw new Error("Error al aprobar usuario")
    revalidatePath('/admin')
}

// ❌ RECHAZAR O EXPULSAR (ELIMINAR)
export async function eliminarUsuario(usuarioId: string) {
    const supabase = await verificarAdmin()
    
    const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', usuarioId)

    if (error) throw new Error("Error al eliminar usuario")
    revalidatePath('/admin')
}

// 🎖️ ADJUDICAR (SOLO IDA -> NO SE PUEDE REVOCAR)
export async function adjudicarUsuario(usuarioId: string) {
    const supabase = await verificarAdmin()
    
    const { error } = await supabase
        .from('perfiles')
        .update({ es_adjudicado: true })
        .eq('id', usuarioId)

    if (error) throw new Error("Error al adjudicar")
    revalidatePath('/admin')
}

// 👇👇👇 AQUÍ ESTÁN LAS FUNCIONES QUE FALTABAN 👇👇👇

// 🔄 ACTUALIZAR ROL (Para usuarios ya activos)
export async function actualizarRol(usuarioId: string, nuevoRolId: number) {
    const supabase = await verificarAdmin()
    
    const { error } = await supabase
        .from('perfiles')
        .update({ rol_id: nuevoRolId })
        .eq('id', usuarioId)

    if (error) throw new Error("Error al actualizar el rol")
    revalidatePath('/admin')
}

// 🏠 ACTUALIZAR CASA (Mudanzas)
export async function actualizarCasa(usuarioId: string, nuevaCasaId: string) {
    const supabase = await verificarAdmin()
    
    const { error } = await supabase
        .from('perfiles')
        .update({ casa_id: nuevaCasaId })
        .eq('id', usuarioId)

    if (error) throw new Error("Error al cambiar de casa")
    revalidatePath('/admin')
}