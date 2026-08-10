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
        .select('apodo, autorizado')
        .eq('id', user.id)
        .single()

      // Si el perfil es null, significa que el Administrador RECHAZÓ (eliminó) la solicitud.
      // Lo mandamos al login con un mensaje claro.
      if (!perfil) {
        return redirectWithCookies('/login?message=Tu solicitud de ingreso fue rechazada o eliminada.')
      }

      const isSetupPage = request.nextUrl.pathname.startsWith('/setup')
      const isEsperaPage = request.nextUrl.pathname.startsWith('/espera')
      
      const isProfileComplete = Boolean(perfil?.apodo)
      const isAutorizado = Boolean(perfil?.autorizado)

      // ESTADO A: No autorizado -> Siempre a la sala de espera
      if (!isAutorizado && !isEsperaPage) {
        return redirectWithCookies('/espera')
      }

      // ESTADO B: Autorizado pero sin perfil -> Siempre al setup
      if (isAutorizado && !isProfileComplete && !isSetupPage) {
        return redirectWithCookies('/setup')
      }

      // ESTADO C: Autorizado y con perfil (Usuario Funcional)
      // Si intenta regresar a espera o setup, lo forzamos al Dashboard
      if (isAutorizado && isProfileComplete && (isEsperaPage || isSetupPage)) {
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