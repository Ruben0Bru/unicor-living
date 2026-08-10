'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, User, CalendarClock, MessageSquareWarning, X } from 'lucide-react'
import { aprobarAseo, rechazarAseo } from './actions'

export function TareaFiscal({ tarea, perfil }: { tarea: any, perfil: any }) {
  const [loading, setLoading] = useState(false)
  const [modoRechazo, setModoRechazo] = useState(false) // ¿Está abierto el modal de rechazo?
  const [observacion, setObservacion] = useState("")

  // ✅ APROBACIÓN RÁPIDA
  const handleAprobar = async () => {
    setLoading(true)
    try {
        await aprobarAseo(tarea.id, "Verificado y Aprobado ✅") // Mensaje por defecto
    } catch (e) {
        alert("Error al aprobar")
    } finally {
        setLoading(false)
    }
  }

  // ❌ RECHAZO CON JUSTIFICACIÓN
  const handleConfirmarRechazo = async () => {
    if (!observacion.trim()) {
        alert("Por favor escribe por qué rechazas la tarea.")
        return
    }
    setLoading(true)
    try {
        await rechazarAseo(tarea.id, observacion)
        setModoRechazo(false)
    } catch (e) {
        alert("Error al rechazar")
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
        {/* TARJETA VISUAL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-row gap-6 items-center justify-between group hover:border-blue-200 transition-all min-w-[700px]">
            
            {/* Info del Residente (Igual que antes) */}
            <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                        {perfil?.avatar_url ? (
                            <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : <User className="w-full h-full p-2 text-gray-400" />}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 text-lg">{perfil?.apodo || "Usuario"}</h3>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                            Por Verificar
                        </span>
                    </div>
                    <p className="text-gray-600 font-medium mt-1">{tarea.tipo_aseo}</p>
                    <p className="text-sm text-gray-400 italic">"{tarea.descripcion}"</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                        <CalendarClock size={12} />
                        <span>Asignado: {new Date(tarea.fecha_asignada).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center gap-3 w-auto">
                {/* Botón Rechazar (Abre Modal) */}
                <button 
                    onClick={() => setModoRechazo(true)}
                    disabled={loading}
                    className="w-auto px-4 py-3 rounded-xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                    <XCircle size={18} />
                    <span>Rechazar</span>
                </button>

                {/* Botón Aprobar (Directo) */}
                <button 
                    onClick={handleAprobar}
                    disabled={loading}
                    className="w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                    {loading ? '...' : <CheckCircle2 size={18} />}
                    <span>Aprobar</span>
                </button>
            </div>
        </div>

        {/* --- MODAL DE RECHAZO --- */}
        {modoRechazo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-red-600">
                            <MessageSquareWarning size={24} />
                            <h3 className="text-xl font-bold">Justificar Rechazo</h3>
                        </div>
                        <button onClick={() => setModoRechazo(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-gray-500 text-sm mb-4">
                        Cuéntale a <strong>{perfil?.apodo}</strong> qué quedó mal para que pueda corregirlo.
                    </p>

                    <textarea
                        autoFocus
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Ej: El piso de la cocina quedó pegajoso..."
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none mb-4 bg-gray-50"
                    />

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setModoRechazo(false)}
                            className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmarRechazo}
                            disabled={loading || !observacion.trim()}
                            className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                        >
                            {loading ? 'Enviando...' : 'Confirmar Rechazo'}
                        </button>
                    </div>

                </div>
            </div>
        )}
    </>
  )
}