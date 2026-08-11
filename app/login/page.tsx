import Link from 'next/link'
import { login, signup } from './actions'
import { UserCircle2 } from 'lucide-react'
import { PasswordInput } from './PasswordInput'

// DEFINICIÓN CORRECTA PARA NEXT.JS 15+
export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  // 1. Desempaquetamos la promesa (El await es clave aquí)
  const searchParams = await props.searchParams
  const message = searchParams.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-unicor-base p-4">
      <div className="w-full max-w-md">
        
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-unicor-primary tracking-wider">
            UNICOR<span className="text-unicor-accent">LIVING</span>
          </h1>
          <p className="text-gray-500 mt-2">Bienvenido a tu hogar universitario</p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Iniciar Sesión</h2>

          <form className="space-y-5">
            {/* Email */}
            <div className="relative group">
              <UserCircle2 className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="email" name="email" placeholder="Correo Institucional" required 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all" />
            </div>

            {/* Password */}
            <PasswordInput />
            
            {/* Botones de Acción */}
            <div className="flex flex-col gap-3 mt-6">
              <button formAction={login} className="w-full bg-unicor-primary hover:bg-unicor-secondary text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
                Entrar
              </button>
              {/* Nota: signup intentará crear usuario nuevo. Si ya existe, dará error (como viste en tus logs) */}
              <button formAction={signup} className="w-full bg-white hover:bg-gray-50 text-unicor-primary font-bold py-3 rounded-xl border-2 border-unicor-primary transition-all">
                Registrarse
              </button>
            </div>
            
            {/* MENSAJE DE ERROR (Ahora sí se muestra bien) */}
            {message && (
              <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg text-sm mt-4 border border-red-100">
                {message}
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Olvidaste tu contraseña? <Link href="/recuperar" className="text-unicor-primary hover:underline font-medium">Recupérala aquí</Link>
        </p>
      </div>
    </div>
  )
}