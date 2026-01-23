'use client'

import { useState, useMemo } from 'react'
import { crearMulta } from '../actions'
import { User, DollarSign, FileText, Camera, AlertOctagon, Building2, Ticket, Gavel } from 'lucide-react'

type Vecino = { id: string; apodo: string; nombre_completo: string | null; casa_id?: string }
type Sancion = { id: string; codigo_referencia: string; descripcion: string; valor_base: number }
type Casa = { id: string; nombre: string; genero?: string }

export function FormularioMulta({ 
    vecinos, 
    sanciones,
    casas = [] 
}: { 
    vecinos: Vecino[], 
    sanciones: Sancion[],
    casas?: Casa[] 
}) {
  
  const [acusadoId, setAcusadoId] = useState('')
  const [sancionId, setSancionId] = useState('')
  const [evidencia, setEvidencia] = useState<File | null>(null)
  const [casaSeleccionada, setCasaSeleccionada] = useState('')

  // 🧠 Lógica de Filtrado
  const listaResidentesVisibles = useMemo(() => {
      if (casas.length > 0 && casaSeleccionada) {
          return vecinos.filter(v => v.casa_id === casaSeleccionada)
      }
      if (casas.length > 0 && !casaSeleccionada) {
          return [] 
      }
      return vecinos
  }, [vecinos, casas, casaSeleccionada])

  const sancionSeleccionada = sanciones.find(s => s.id === sancionId)
  const esBienestarMode = casas.length > 0 // Si hay casas, es Bienestar/Admin

  // 🧠 Lógica de Precio: Si es Bienestar, vale DOBLE
  const valorOriginal = sancionSeleccionada?.valor_base || 0
  const valorFinal = esBienestarMode ? valorOriginal * 2 : valorOriginal

  // Helper visual para género
  const getCasaLabel = (nombre: string, genero?: string) => {
      const g = (genero || '').toLowerCase();
      let suffix = '';
      if (g.startsWith('m') && g.includes('asc')) suffix = 'Varones';
      else if (g.startsWith('f')) suffix = 'Mujeres';
      else if (g.includes('mix')) suffix = 'Mixta';
      return suffix ? `${nombre} (${suffix})` : nombre;
  }

  return (
    <form action={crearMulta} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* HEADER VISUAL: Cambia de color si es Bienestar */}
      <div className={`h-2 bg-gradient-to-r ${esBienestarMode ? 'from-indigo-600 to-purple-600' : 'from-red-500 to-orange-500'}`}></div>

      <div className="p-8 space-y-8">
        
        {/* --- 1. SELECCIÓN DE CASA (SOLO BIENESTAR) --- */}
        {esBienestarMode && (
             <div className="space-y-2 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-indigo-800 uppercase tracking-wide flex items-center gap-2">
                    <Building2 size={18} /> Paso 1: Seleccionar Sede
                </label>
                <div className="relative">
                    <select 
                        className="w-full p-4 bg-white border border-indigo-200 rounded-xl appearance-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        onChange={(e) => {
                            setCasaSeleccionada(e.target.value)
                            setAcusadoId('') 
                        }}
                        required
                        defaultValue=""
                    >
                        <option value="" disabled>-- Elige una casa --</option>
                        {casas.map(casa => (
                            <option key={casa.id} value={casa.id}>
                                {getCasaLabel(casa.nombre, casa.genero)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* --- 2. SELECCIÓN DEL ACUSADO --- */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <User size={18} /> {esBienestarMode ? 'Paso 2: Residente' : '¿Quién cometió la falta?'}
            </label>
            <div className="relative group">
                <select 
                    name="residente_id" 
                    required 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-bold text-gray-700 focus:ring-2 focus:ring-unicor-primary outline-none transition-all cursor-pointer disabled:opacity-50"
                    onChange={(e) => setAcusadoId(e.target.value)}
                    value={acusadoId}
                    disabled={esBienestarMode && !casaSeleccionada}
                >
                    <option value="" disabled>
                        {esBienestarMode && !casaSeleccionada 
                            ? 'Primero selecciona una casa...' 
                            : '-- Selecciona al infractor --'}
                    </option>
                    {listaResidentesVisibles.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.apodo} {v.nombre_completo ? `(${v.nombre_completo})` : ''}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* --- 3. SELECCIÓN DE INFRACCIÓN --- */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <AlertOctagon size={18} /> ¿Qué hizo?
            </label>
            <div className="relative group">
                <select 
                    name="sancion_id" 
                    required 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium text-gray-700 focus:ring-2 focus:ring-unicor-primary outline-none transition-all cursor-pointer"
                    onChange={(e) => setSancionId(e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>-- Selecciona la falta del catálogo --</option>
                    {sanciones.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.codigo_referencia}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
            </div>
            
            {/* 👇 CARD DE VALOR CON LÓGICA X2 👇 */}
            {sancionSeleccionada && (
                <div className={`mt-4 border-2 rounded-2xl p-5 shadow-lg flex justify-between items-center gap-4 animate-in zoom-in-95 duration-200 relative overflow-hidden group
                    ${esBienestarMode 
                        ? 'bg-indigo-50 border-indigo-200 shadow-indigo-500/10' // Estilo Bienestar
                        : 'bg-white border-unicor-primary/10 shadow-unicor-primary/5' // Estilo Normal
                    }
                `}>
                    
                    {/* Decoración de fondo */}
                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500
                        ${esBienestarMode ? 'bg-indigo-200/20' : 'bg-unicor-primary/5'}
                    `}></div>

                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {esBienestarMode ? (
                                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider">
                                    <Gavel size={12} /> Sanción de Autoridad
                                </span>
                            ) : (
                                <div className="flex items-center gap-2 text-unicor-primary">
                                    <Ticket size={16} />
                                    <h4 className="font-bold text-xs uppercase tracking-wider">Detalle de Sanción</h4>
                                </div>
                            )}
                        </div>
                        <p className={`text-sm italic leading-snug mt-1 ${esBienestarMode ? 'text-indigo-800' : 'text-gray-600'}`}>
                            "{sancionSeleccionada.descripcion}"
                        </p>
                        {esBienestarMode && (
                            <p className="text-[10px] text-indigo-500 font-bold mt-2">
                                * Incluye recargo x2 por intervención de Bienestar.
                            </p>
                        )}
                    </div>

                    <div className={`relative z-10 text-right shrink-0 border-l pl-4 ${esBienestarMode ? 'border-indigo-200' : 'border-gray-100'}`}>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Valor a Pagar</span>
                        
                        {/* Precio Tachado (Solo si es Bienestar) */}
                        {esBienestarMode && (
                             <span className="block text-xs text-gray-400 line-through font-medium">
                                ${valorOriginal.toLocaleString()}
                             </span>
                        )}

                        <span className={`block text-3xl font-black tracking-tight
                             ${esBienestarMode ? 'text-indigo-700' : 'text-unicor-primary'}
                        `}>
                            ${valorFinal.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* --- 4. EVIDENCIA --- */}
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Camera size={18} /> Evidencia (Opcional)
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer group">
                <input 
                    type="file" 
                    name="evidencia" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setEvidencia(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-unicor-primary">
                    {evidencia ? (
                        <>
                            <FileText size={32} className="text-green-500" />
                            <span className="font-bold text-green-600">{evidencia.name}</span>
                        </>
                    ) : (
                        <>
                            <Camera size={32} />
                            <span className="text-sm font-medium">Toca para subir foto o archivo</span>
                        </>
                    )}
                </div>
            </div>
        </div>

        <button 
            type="submit" 
            disabled={!acusadoId || !sancionId}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed
                ${esBienestarMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' 
                    : 'bg-unicor-primary hover:bg-unicor-secondary'
                }
            `}
        >
            <DollarSign size={24} />
            <span>Generar Multa</span>
        </button>

      </div>
    </form>
  )
}