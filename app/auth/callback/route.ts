import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // El "searchParams" aquí contiene el código que envía Supabase
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // "next" es a donde queremos ir después (por defecto al home /)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // Intercambiamos el código por una sesión activa
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si todo sale bien, redirigimos al usuario adentro de la app
      // Nota: Aquí es donde luego redirigiremos al 'Setup' si no tiene casa asignada
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, lo devolvemos al login con error
  return NextResponse.redirect(`${origin}/login?message=Error al verificar código`)
}