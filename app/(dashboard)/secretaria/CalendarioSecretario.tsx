'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Utensils, Home, Trash2, Bath, Plus, User } from 'lucide-react'
import { ModalAsignacion } from './ModalAsignacion' // <--- Componente Nuevo (Paso 3)

// Tipos para TypeScript
type Asignacion = {
  id?: string
  tipo_aseo: string
  residente_id: string | null
  residente?: { apodo: string }
  realizado: boolean
  fecha_asignada: string
}

export function CalendarioSecretario({ residentes, asignacionesIniciales }: { residentes: any[], asignacionesIniciales: any[] }) {
  // Estado del Mes
  const [fechaActual, setFechaActual] = useState(new Date())
  // Estado del Modal
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  // --- 1. GENERAR DÍAS DEL MES ---
  const diasCalendario = useMemo(() => {
    const year = fechaActual.getFullYear()
    const month = fechaActual.getMonth()
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1)
    // Último día del mes
    const ultimoDia = new Date(year, month + 1, 0)
    
    // Relleno inicial (días del mes anterior para cuadrar lunes/domingo)
    const diaSemanaInicio = primerDia.getDay() // 0 = Domingo
    const paddingInicial = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1 // Ajuste para empezar en Lunes

    const dias = []
    
    // Días vacíos previos
    for (let i = 0; i < paddingInicial; i++) {
        dias.push(null)
    }
    
    // Días reales
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
        dias.push(new Date(year, month, i))
    }
    
    return dias
  }, [fechaActual])

  // --- 2. HELPERS VISUALES ---
  const cambiarMes = (delta: number) => {
    const nueva = new Date(fechaActual)
    nueva.setMonth(nueva.getMonth() + delta)
    setFechaActual(nueva)
  }

  const getAsignacionesDia = (fecha: Date) => {
    const fechaIso = fecha.toISOString().split('T')[0]
    return asignacionesIniciales.filter(a => a.fecha_asignada === fechaIso)
  }

  const handleClickDia = (dia: Date) => {
    setDiaSeleccionado(dia)
    setModalAbierto(true)
  }

  const renderIconoTarea = (tipo: string, asignado: boolean) => {
    const size = 14
    const baseClass = `p-1 rounded-full ${asignado ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-300'}`
    
    switch(tipo) {
        case 'Cocina': return <div className={baseClass} title="Cocina"><Utensils size={size}/></div>
        case 'Casa': return <div className={baseClass} title="Casa"><Home size={size}/></div>
        case 'Baño': return <div className={baseClass} title="Baño"><Bath size={size}/></div>
        case 'Basura': return <div className={`${baseClass} ${asignado ? 'bg-orange-100 text-orange-700' : ''}`} title="Basura"><Trash2 size={size}/></div>
        default: return null
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[800px]">
        
        {/* HEADER DEL CALENDARIO */}
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 capitalize flex items-center gap-2">
                {fechaActual.toLocaleString('es-CO', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
                <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft /></button>
                <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight /></button>
            </div>
        </div>

        {/* GRILLA SEMANAL (Lunes - Domingo) */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
            ))}
        </div>

        {/* GRILLA DE DÍAS */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
            {diasCalendario.map((dia, index) => {
                if (!dia) return <div key={`empty-${index}`} className="bg-gray-50/50" />
                
                const tareas = getAsignacionesDia(dia)
                const esHoy = dia.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                
                // ¿Qué tareas ya están cubiertas?
                const tieneCocina = tareas.some(t => t.tipo_aseo === 'Cocina')
                const tieneCasa = tareas.some(t => t.tipo_aseo === 'Casa')
                const tieneBano = tareas.some(t => t.tipo_aseo === 'Baño')
                const tieneBasura = tareas.some(t => t.tipo_aseo === 'Basura')

                return (
                    <div 
                        key={dia.toISOString()} 
                        onClick={() => handleClickDia(dia)}
                        className={`bg-white hover:bg-purple-50 transition-colors cursor-pointer p-2 flex flex-col gap-1 group relative ${esHoy ? 'bg-purple-50/30' : ''}`}
                    >
                        {/* Número del día */}
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1
                            ${esHoy ? 'bg-purple-600 text-white shadow-md' : 'text-gray-700 group-hover:bg-white'}
                        `}>
                            {dia.getDate()}
                        </span>

                        {/* Indicadores de Tareas (Bolitas de colores) */}
                        <div className="flex gap-1 flex-wrap content-start">
                           {renderIconoTarea('Cocina', tieneCocina)}
                           {renderIconoTarea('Casa', tieneCasa)}
                           {renderIconoTarea('Baño', tieneBano)}
                           {renderIconoTarea('Basura', tieneBasura)}
                        </div>

                        {/* Botón flotante al hacer hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[1px]">
                            <Plus className="text-purple-600 drop-shadow-sm" size={32} />
                        </div>
                    </div>
                )
            })}
        </div>

        {/* EL MODAL DE EDICIÓN */}
        {modalAbierto && diaSeleccionado && (
            <ModalAsignacion 
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                fecha={diaSeleccionado}
                residentes={residentes}
                asignacionesDelDia={getAsignacionesDia(diaSeleccionado)}
            />
        )}
    </div>
  )
}