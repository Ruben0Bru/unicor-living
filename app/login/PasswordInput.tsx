'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

export function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative group">
      <Lock className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
      <input 
        type={showPassword ? "text" : "password"} 
        name="password" 
        placeholder="Contraseña" 
        required 
        className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all" 
      />
      <button 
        type="button" 
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center -mt-2 -mr-2 rounded-full"
        aria-label={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
}
