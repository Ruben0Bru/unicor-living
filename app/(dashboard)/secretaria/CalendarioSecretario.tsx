'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Utensils, Home, Trash2, Bath, Plus } from 'lucide-react'
import { ModalAsignacion } from './ModalAsignacion'

export function CalendarioSecretario({ residentes, asignacionesIniciales }: { residentes: any[], asignacionesIniciales: any[] }) {
  const [isMounted, setIsMounted] = useState(false)
  const [fechaActual, setFechaActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const diasCalendario = useMemo(() => {
    const year = fechaActual.getFullYear()
    const month = fechaActual.getMonth()
    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)
    const diaSemanaInicio = primerDia.getDay() 
    const paddingInicial = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1 

    const dias = []
    for (let i = 0; i < paddingInicial; i++) dias.push(null)
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
        dias.push(new Date(year, month, i, 12, 0, 0))
    }
    return dias
  }, [fechaActual])

  const cambiarMes = (delta: number) => {
    const nueva = new Date(fechaActual)
    nueva.setMonth(nueva.getMonth() + delta)
    setFechaActual(nueva)
  }

  const getFechaIsoLocal = (fecha: Date) => {
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    const d = String(fecha.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getAsignacionesDia = (fecha: Date) => {
    const fechaIsoLocal = getFechaIsoLocal(fecha)
    return asignacionesIniciales.filter(a => a.fecha_asignada === fechaIsoLocal)
  }

  const handleClickDia = (dia: Date) => {
    setDiaSeleccionado(dia)
    setModalAbierto(true)
  }

  const renderIconoTarea = (tipo: string, asignado: boolean) => {
    const size = 14
    switch(tipo) {
        case 'Cocina': return <div className={`p-1 rounded-full ${asignado ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-300'}`} title="Cocina"><Utensils size={size}/></div>
        case 'Casa': return <div className={`p-1 rounded-full ${asignado ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-300'}`} title="Casa"><Home size={size}/></div>
        case 'Baño': return <div className={`p-1 rounded-full ${asignado ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-300'}`} title="Baño"><Bath size={size}/></div>
        case 'Basura': return <div className={`p-1 rounded-full ${asignado ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-300'}`} title="Basura"><Trash2 size={size}/></div>
        default: return null
    }
  }

  // UN SOLO RETURN. El cascarón (las clases CSS del primer div) es idéntico siempre.
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-[800px] w-full overflow-hidden">
        
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 capitalize flex items-center gap-2">
                {isMounted ? fechaActual.toLocaleString('es-CO', { month: 'long', year: 'numeric' }) : '\u00A0'}
            </h2>
            <div className="flex gap-2">
                <button onClick={() => cambiarMes(-1)} disabled={!isMounted} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"><ChevronLeft /></button>
                <button onClick={() => cambiarMes(1)} disabled={!isMounted} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"><ChevronRight /></button>
            </div>
        </div>

        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{d}</div>
            ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
            {!isMounted ? (
                // Mientras carga, pintamos 35 cuadros vacíos para mantener la estructura
                Array.from({ length: 35 }).map((_, i) => <div key={`skel-${i}`} className="bg-white/50" />)
            ) : (
                // Cuando monta, pintamos el calendario real
                diasCalendario.map((dia, index) => {
                    if (!dia) return <div key={`empty-${index}`} className="bg-gray-50/50" />
                    
                    const tareas = getAsignacionesDia(dia)
                    const hoy = new Date()
                    const esHoy = dia.getDate() === hoy.getDate() && dia.getMonth() === hoy.getMonth() && dia.getFullYear() === hoy.getFullYear()
                    
                    const tieneCocina = tareas.some(t => t.tipo_aseo === 'Cocina')
                    const tieneCasa = tareas.some(t => t.tipo_aseo === 'Casa')
                    const tieneBano = tareas.some(t => t.tipo_aseo === 'Baño')
                    const tieneBasura = tareas.some(t => t.tipo_aseo === 'Basura')

                    return (
                        <div 
                            key={dia.toISOString()} 
                            onClick={() => handleClickDia(dia)}
                            className={`bg-white hover:bg-purple-50 transition-colors cursor-pointer p-1 md:p-4 flex flex-col gap-1 group relative ${esHoy ? 'bg-purple-50/30' : ''}`}
                        >
                            <span className={`text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full mb-1 ${esHoy ? 'bg-purple-600 text-white shadow-md' : 'text-gray-700 group-hover:bg-white'}`}>
                                {dia.getDate()}
                            </span>

                            <div className="flex gap-1 flex-wrap content-start">
                               {renderIconoTarea('Cocina', tieneCocina)}
                               {renderIconoTarea('Casa', tieneCasa)}
                               {renderIconoTarea('Baño', tieneBano)}
                               {renderIconoTarea('Basura', tieneBasura)}
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[1px]">
                                <Plus className="text-purple-600 drop-shadow-sm" size={32} />
                            </div>
                        </div>
                    )
                })
            )}
        </div>

        {isMounted && modalAbierto && diaSeleccionado && (
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