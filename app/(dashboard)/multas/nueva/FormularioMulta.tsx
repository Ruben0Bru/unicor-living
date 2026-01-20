'use client'

import { useState } from 'react'
import { User, Gavel, AlignLeft, Camera, Calendar, Info, CheckCircle, ChevronDown } from 'lucide-react'
import { crearMulta } from '@/app/(dashboard)/multas/actions'

// Definimos los tipos correctamente según tu Base de Datos
type Vecino = { id: string, apodo: string | null, nombre_completo: string | null }
type Sancion = { 
  id: string, 
  codigo_referencia: string, // <--- La clave correcta
  valor_base: number | null 
}

export function FormularioMulta({ vecinos, sanciones }: { vecinos: Vecino[], sanciones: Sancion[] }) {
  const [precioEstimado, setPrecioEstimado] = useState<number>(0)
  const [fotoNombre, setFotoNombre] = useState<string | null>(null)

  // Actualizar precio al cambiar selección
  const handleSancionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sancionId = e.target.value
    const sancionEncontrada = sanciones.find(s => s.id === sancionId)
    setPrecioEstimado(sancionEncontrada?.valor_base || 0)
  }

  // Mostrar nombre del archivo al subir foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoNombre(e.target.files[0].name)
    }
  }

  // Clases comunes para inputs (Estilo Unicor)
  const inputContainerClass = "relative group"
  const iconClass = "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-unicor-primary transition-colors pointer-events-none"
  const inputClass = "w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all text-gray-700 font-medium appearance-none cursor-pointer hover:bg-white"

  return (
    <form action={crearMulta} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-8">
        
      {/* 1. SELECCIÓN DEL INFRACTOR */}
      <div>
        <label className="block text-sm font-bold text-unicor-primary mb-2 ml-1">¿Quién cometió la falta?</label>
        <div className={inputContainerClass}>
          <User className={iconClass} size={20} />
          
          <select name="residente_id" required className={inputClass}>
            <option value="">-- Selecciona un compañero --</option>
            {vecinos.map(v => (
              <option key={v.id} value={v.id}>
                {v.apodo ? `${v.apodo} (${v.nombre_completo})` : v.nombre_completo}
              </option>
            ))}
          </select>
          
          {/* Flecha personalizada */}
          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* 2. TIPO DE INFRACCIÓN (Catálogo) */}
      <div>
        <label className="block text-sm font-bold text-unicor-primary mb-2 ml-1">Tipo de Infracción</label>
        <div className={inputContainerClass}>
          <Gavel className={iconClass} size={20} />
          
          <select name="sancion_id" required onChange={handleSancionChange} className={inputClass}>
            <option value="">-- Buscar en el catálogo oficial --</option>
            {sanciones.map(s => (
              <option key={s.id} value={s.id}>
                {/* AQUI MOSTRAMOS EL NOMBRE CORRECTO */}
                {s.codigo_referencia}
              </option>
            ))}
          </select>

          {/* Flecha personalizada */}
          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* 3. VISUALIZADOR DE VALOR (Card Dinámica) */}
      <div className={`p-6 rounded-2xl flex items-center gap-5 border transition-all duration-500 transform ${precioEstimado > 0 ? 'bg-green-50 border-green-200 scale-105 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-80'}`}>
        <div className={`p-3 rounded-full shrink-0 transition-colors ${precioEstimado > 0 ? 'bg-white text-unicor-primary shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
          <Info size={28} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Reglamentario</p>
          <div className="flex items-baseline gap-1">
             <span className="text-4xl font-black text-unicor-primary tracking-tight">
                ${precioEstimado.toLocaleString()}
             </span>
             <span className="text-sm font-medium text-gray-500">COP</span>
          </div>
          <p className="text-xs text-unicor-secondary mt-1 font-medium">
            *Este valor es automático según el reglamento.
          </p>
        </div>
      </div>

      {/* 4. FECHA DEL INCIDENTE */}
      <div>
        <label className="block text-sm font-bold text-unicor-primary mb-2 ml-1">Fecha y Hora</label>
        <div className={inputContainerClass}>
          <Calendar className={iconClass} size={20} />
          <input type="datetime-local" name="fecha_incidente"
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary outline-none text-gray-700 font-medium hover:bg-white transition-all" />
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1 italic">Recuerda la regla de las 24 horas para reportar.</p>
      </div>

      {/* 5. DESCRIPCIÓN */}
      <div>
        <label className="block text-sm font-bold text-unicor-primary mb-2 ml-1">Detalles Adicionales</label>
        <div className={inputContainerClass}>
          <AlignLeft className="absolute left-4 top-6 text-gray-400 group-focus-within:text-unicor-primary transition-colors pointer-events-none" size={20} />
          <textarea name="descripcion_personalizada" rows={3} placeholder="Describe brevemente qué pasó..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary outline-none resize-none hover:bg-white transition-all"></textarea>
        </div>
      </div>

      {/* 6. EVIDENCIA FOTOGRÁFICA (Drag & Drop Look) */}
      <div className="relative">
        <input 
          type="file" 
          name="evidencia" 
          id="evidencia-file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
        <label htmlFor="evidencia-file" 
          className={`
            border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
            ${fotoNombre 
              ? 'border-unicor-secondary bg-green-50' 
              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-unicor-primary hover:shadow-md'
            }
          `}
        >
          {fotoNombre ? (
            <>
              <div className="bg-white p-2 rounded-full shadow-sm mb-2">
                 <CheckCircle className="text-unicor-secondary" size={32} />
              </div>
              <p className="font-bold text-unicor-primary">¡Evidencia cargada!</p>
              <p className="text-xs text-gray-500 mt-1 font-mono bg-white px-2 py-1 rounded border border-green-100">{fotoNombre}</p>
            </>
          ) : (
            <>
              <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:bg-unicor-base transition-colors">
                 <Camera className="text-gray-400 group-hover:text-unicor-primary transition-colors" size={28} />
              </div>
              <p className="font-medium text-gray-600 group-hover:text-unicor-primary transition-colors">Tocar para adjuntar foto</p>
              <p className="text-xs text-gray-400 mt-1">Formatos: JPG, PNG (Opcional)</p>
            </>
          )}
        </label>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <button type="submit" 
        className="w-full bg-unicor-primary hover:bg-unicor-secondary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-lg">
        <span>Registrar Reporte</span>
        <Gavel size={20} />
      </button>

    </form>
  )
}