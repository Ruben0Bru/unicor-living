import Link from 'next/link'
import { solicitarRecuperacion } from '@/app/login/actions'
import { UserCircle2 } from 'lucide-react'

export default async function RecuperarPasswordPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams
  const message = searchParams.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-unicor-base p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-unicor-primary tracking-wider">
            UNICOR<span className="text-unicor-accent">LIVING</span>
          </h1>
          <p className="text-gray-500 mt-2">Recuperación de Acceso</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Encuentra tu cuenta</h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Ingresa tu correo institucional y te enviaremos un enlace seguro para restablecer tu contraseña.
          </p>

          <form className="space-y-5">
            <div className="relative group">
              <UserCircle2 className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="email" name="email" placeholder="Correo Institucional" required 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all" />
            </div>

            <button formAction={solicitarRecuperacion} className="w-full bg-unicor-primary hover:bg-unicor-secondary text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
              Enviar Enlace
            </button>
            
            {message && (
              <p className={`text-center p-3 rounded-lg text-sm mt-4 border ${message.includes('Revisa') ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-500 bg-red-50 border-red-100'}`}>
                {message}
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Recordaste tu contraseña? <Link href="/login" className="text-unicor-primary hover:underline font-medium">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}