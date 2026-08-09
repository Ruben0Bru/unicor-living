import { actualizarPassword } from '@/app/login/actions'
import { Lock } from 'lucide-react'

export default async function ResetearPasswordPage(props: {
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
          <p className="text-gray-500 mt-2">Seguridad del Sistema</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Nueva Contraseña</h2>

          <form className="space-y-5">
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="password" name="password" placeholder="Nueva Contraseña" required minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="password" name="confirmPassword" placeholder="Confirmar Contraseña" required minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all" />
            </div>

            <button formAction={actualizarPassword} className="w-full bg-unicor-accent hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
              Guardar y Continuar
            </button>
            
            {message && (
              <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg text-sm mt-4 border border-red-100">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}