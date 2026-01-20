import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Si NO hay usuario y quiere entrar a una ruta protegida -> Login
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si HAY usuario...
  if (user) {
    // Verificamos si ya completó el perfil
    // (Consultamos un dato clave, ej: apodo o casa_id)
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('apodo')
      .eq('id', user.id)
      .single()

    const isSetupPage = request.nextUrl.pathname.startsWith('/setup')
    const isProfileComplete = perfil?.apodo // Si tiene apodo, asumimos que completó el setup

    // CASO A: Tiene perfil incompleto y NO está en /setup -> Mandarlo a /setup
    if (!isProfileComplete && !isSetupPage) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    // CASO B: Ya tiene perfil completo e intenta entrar a /setup -> Mandarlo al Dashboard
    // (Opcional: puedes dejar que entre si quiere editarlo)
    if (isProfileComplete && isSetupPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, si las tienes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}