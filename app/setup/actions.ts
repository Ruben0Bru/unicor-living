'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completarPerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // 1. Recolección de Datos Básicos
  const apodo = formData.get('apodo') as string
  const nombre_completo = formData.get('nombre_completo') as string
  const documento_identidad = formData.get('documento_identidad') as string
  const tipo_sangre = formData.get('tipo_sangre') as string
  const casa_id = formData.get('casa_id') as string
  const biografia = formData.get('biografia') as string
  // 👇 CAMBIO 1: Capturamos el teléfono del formulario
  const telefono = formData.get('telefono') as string 
  const avatarFile = formData.get('avatar') as File
  
  // 2. Recolección de Datos Académicos y Personales
  const programa_academico = formData.get('programa_academico') as string
  const semestre_actual = formData.get('semestre_actual') as string
  const fecha_nacimiento = formData.get('fecha_nacimiento') as string
  const hobbiesRaw = formData.get('hobbies') as string | null

  // 3. Procesar Hobbies
  const hobbies = hobbiesRaw 
    ? hobbiesRaw.split(',').map(h => h.trim()).filter(h => h.length > 0)
    : []

  // 4. Subir Avatar (Si el usuario subió uno nuevo)
  let avatar_url = null
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars') 
      .upload(fileName, avatarFile)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      avatar_url = publicUrl
    }
  }

  // 5. UPSERT (Guardar en Base de Datos)
  const { error } = await supabase
    .from('perfiles')
    .upsert({  
      id: user.id, 
      apodo,
      nombre_completo,
      documento_identidad,
      tipo_sangre,
      casa_id,
      biografia,
      // 👇 CAMBIO 2: Guardamos el teléfono en la base de datos
      telefono: telefono, 
      ...(avatar_url && { avatar_url }), 
      programa_academico,
      semestre_actual: Number(semestre_actual),
      fecha_nacimiento, 
      hobbies,           
      es_adjudicado: false,
      updated_at: new Date().toISOString() 
    })

  if (error) {
    console.error('Error al guardar perfil:', error)
    return redirect('/setup?error=true')
  }

  // 6. Limpiar caché y redirigir al Dashboard
  revalidatePath('/', 'layout')
  return redirect('/')
}