import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 🛠️ HELPER: Redirige sin perder las modificaciones de cookies (creadas o borradas por Supabase)
  const redirectWithCookies = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirectResponse = NextResponse.redirect(url)
    
    // Traspasamos las cookies (especialmente las que Supabase intentó borrar)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, { ...cookie })
    })
    
    return redirectResponse
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()

const isPublicRoute = 
  request.nextUrl.pathname.startsWith('/login') || 
  request.nextUrl.pathname.startsWith('/auth') ||
  request.nextUrl.pathname.startsWith('/recuperar') ||
  request.nextUrl.pathname.startsWith('/resetear-password')

    // 1. No hay usuario y la ruta es protegida -> Redirigir a Login con cookies purgadas
    if (!user && !isPublicRoute) {
      return redirectWithCookies('/login')
    }

    // 2. Lógica cuando HAY usuario
    if (user) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('apodo')
        .eq('id', user.id)
        .single()

      const isSetupPage = request.nextUrl.pathname.startsWith('/setup')
      const isProfileComplete = Boolean(perfil?.apodo)

      if (!isProfileComplete && !isSetupPage) {
        return redirectWithCookies('/setup')
      }

      if (isProfileComplete && isSetupPage) {
        return redirectWithCookies('/')
      }
    }

    return supabaseResponse

  } catch (error) {
    // Si hay un fallo catastrófico en la red o tokens, rompemos el loop aquí
    return redirectWithCookies('/login')
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}