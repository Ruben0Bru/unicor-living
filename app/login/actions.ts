'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?message=Credenciales incorrectas')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error(error)
    return redirect('/login?message=Error al registrarse')
  }

  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/espera') 
  }

  return redirect('/login?message=Revisa tu correo para confirmar')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function solicitarRecuperacion(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  let origin = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    origin = headersList.get('origin') || origin
  } catch (e) {
    // Fallback silencioso
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Redirigimos al callback, y le decimos que el destino final es resetear-password
    redirectTo: `${origin}/auth/callback?next=/resetear-password`,
  })

  if (error) {
    return redirect('/recuperar?message=No se pudo enviar el correo de recuperación. Verifica la dirección.')
  }

  return redirect('/recuperar?message=Revisa tu correo para recuperar tu contraseña')
}

export async function actualizarPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return redirect('/resetear-password?message=Las contraseñas no coinciden')
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return redirect('/resetear-password?message=Error al actualizar la contraseña')
  }

  // Contraseña actualizada con éxito. Destruimos la sesión temporal y forzamos login normal
  await supabase.auth.signOut()
  return redirect('/login?message=Contraseña actualizada con éxito. Inicia sesión.')
}