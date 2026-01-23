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
  const casa_id = formData.get('casa_id') as string
  const biografia = formData.get('biografia') as string
  const telefono = formData.get('telefono') as string 
  const avatarFile = formData.get('avatar') as File
  
  // 2. Datos Opcionales (Residentes vs Administrativos)
  const docRaw = formData.get('documento_identidad') as string
  const sangreRaw = formData.get('tipo_sangre') as string
  const progRaw = formData.get('programa_academico') as string
  const semRaw = formData.get('semestre_actual') as string
  const nacRaw = formData.get('fecha_nacimiento') as string
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
  // IMPORTANTE: Asegúrate de haber corrido los ALTER TABLE para DROP NOT NULL en la BD
  const { error } = await supabase
    .from('perfiles')
    .upsert({  
      id: user.id, 
      apodo,
      nombre_completo,
      casa_id,
      biografia,
      telefono: telefono || null,
      
      // 👇 Si viene string vacío "", guardamos null
      documento_identidad: docRaw || null,
      tipo_sangre: sangreRaw || null,
      programa_academico: progRaw || null,
      semestre_actual: semRaw ? Number(semRaw) : null,
      fecha_nacimiento: nacRaw || null,
      
      ...(avatar_url && { avatar_url }), 
      hobbies,           
      es_adjudicado: false,
      updated_at: new Date().toISOString() 
    })

  if (error) {
    console.error('Error al guardar perfil:', error)
    return redirect('/setup?error=true')
  }

  // 6. Limpiar caché y redirigir
  revalidatePath('/', 'layout')
  return redirect('/')
}