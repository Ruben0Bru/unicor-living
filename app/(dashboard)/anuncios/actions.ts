'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// PUBLICAR ANUNCIO 📢
export async function publicarAnuncio(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // 1. Obtener Perfil y Rol
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('casa_id, roles(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil) throw new Error("Perfil no encontrado")
  
  const rawRol = perfil.roles as any
  const nombreRol = (rawRol?.nombre || rawRol?.[0]?.nombre || '').toLowerCase()
  const esBienestar = nombreRol.includes('bienestar')
  
  // SOLO ESTOS ROLES PUEDEN PUBLICAR:
  const puedePublicar = 
      esBienestar || 
      nombreRol.includes('representante') || 
      nombreRol.includes('admin')

  if (!puedePublicar) throw new Error("No tienes permiso para publicar anuncios.")
    
  // 2. Recolección de datos
  const titulo = formData.get('titulo') as string
  const contenido = formData.get('contenido') as string
  const tipo = formData.get('tipo') as string
  const fechaEventoRaw = formData.get('fecha_evento') as string
  const destino = formData.get('destino') as string // <--- CAPTURAMOS EL DESTINO

  // 3. Lógica de Destino (Casa vs Global)
  // Por defecto, se publica en la casa del usuario (para repres y admins de casa)
  let casaDestino = perfil.casa_id 

  if (esBienestar) {
      if (destino && destino !== 'global') {
          // Si eligió una casa específica
          casaDestino = destino
      } else {
          // Si eligió "Global" o no seleccionó nada -> NULL (Para todos)
          casaDestino = null
      }
  }

  const { error } = await supabase.from('anuncios').insert({
    casa_id: casaDestino, // UUID o NULL
    creado_por: user.id,
    titulo,
    contenido,
    tipo,
    fecha_evento: fechaEventoRaw ? new Date(fechaEventoRaw).toISOString() : null
  })

  if (error) {
      console.error("Error al publicar:", error.message)
      throw new Error("Error al guardar anuncio")
  }

  revalidatePath('/anuncios')
}

// BORRAR ANUNCIO 🗑️
export async function borrarAnuncio(anuncioId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { error } = await supabase.from('anuncios').delete().eq('id', anuncioId)
    
    if (error) {
        console.error("Error al borrar:", error.message)
        throw new Error("Error al borrar el anuncio")
    }
    revalidatePath('/anuncios')
}