'use client'

import { useState } from 'react'
import { X, Save, Utensils, Home, Bath, Trash2, Sparkles, PlusCircle, Trash, Users } from 'lucide-react'
import { guardarAsignacionesDia } from './actions'

type Residente = {
    id: string
    apodo: string
    es_adjudicado: boolean
    equipo_aseo: string
}

const TIPOS_FIJOS = [
    { id: 'Cocina', label: 'Cocina', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Casa', label: 'Casa General', icon: Home, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Baño', label: 'Baños', icon: Bath, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { id: 'Basura', label: 'Basura', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
]

export function ModalAsignacion({ isOpen, onClose, fecha, residentes, asignacionesDelDia }: any) {
    if (!isOpen) return null
    
    const [loading, setLoading] = useState(false)
    const fechaIso = fecha.toISOString().split('T')[0]

    const [seleccion, setSeleccion] = useState<Record<string, string>>(() => {
        const inicial: Record<string, string> = {}
        asignacionesDelDia.forEach((a: any) => {
            const tipoId = a.tipo_aseo 
            if (TIPOS_FIJOS.find(t => t.id === tipoId)) {
                inicial[tipoId] = a.residente_id
            }
        })
        return inicial
    })

    const [tareasGenerales, setTareasGenerales] = useState<{ id: string, nombre: string, limite: string }[]>(() => {
        const nombresUnicos = new Set<string>()
        asignacionesDelDia.forEach((a: any) => {
            const tipoId = a.tipo_aseo
            if (!TIPOS_FIJOS.find(t => t.id === tipoId)) {
                nombresUnicos.add(tipoId)
            }
        })
        return Array.from(nombresUnicos).map(nombre => ({
            id: Math.random().toString(),
            nombre: nombre,
            limite: fechaIso
        }))
    })

    const getCandidatosFijos = (tipoAseo: string) => {
        return (residentes as Residente[]).filter((r) => {
            if (tipoAseo === 'Basura') return r.es_adjudicado === true
            if (tipoAseo === 'Cocina') return r.equipo_aseo === 'cocina' || r.equipo_aseo === 'general'
            if (tipoAseo === 'Casa') return r.equipo_aseo === 'casa' || r.equipo_aseo === 'general'
            return true 
        })
    }

    const handleChangeFija = (tipo: string, id: string) => {
        setSeleccion(prev => ({ ...prev, [tipo]: id }))
    }

    const agregarGeneral = () => {
        setTareasGenerales(prev => [...prev, { id: Math.random().toString(), nombre: "", limite: fechaIso }])
    }

    const updateGeneral = (id: string, campo: 'nombre' | 'limite', valor: string) => {
        setTareasGenerales(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t))
    }

    const borrarGeneral = (id: string) => {
        setTareasGenerales(prev => prev.filter(t => t.id !== id))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const payloadFijas = Object.entries(seleccion).map(([tipo, residenteId]) => {
                if (!residenteId) return null
                return {
                    residente_id: residenteId,
                    tipo_aseo: tipo, 
                    descripcion: `Aseo de ${TIPOS_FIJOS.find(t => t.id === tipo)?.label || tipo}`,
                    fecha_asignada: fechaIso,
                    fecha_limite: fechaIso,
                    realizado: false
                }
            }).filter(Boolean)

            const payloadGenerales: any[] = []
            
            tareasGenerales.forEach(tarea => {
                if (!tarea.nombre.trim()) return

                (residentes as Residente[]).forEach(residente => {
                    payloadGenerales.push({
                        residente_id: residente.id,
                        tipo_aseo: tarea.nombre, 
                        descripcion: "Aseo General Programado",
                        fecha_asignada: fechaIso,
                        fecha_limite: tarea.limite, 
                        realizado: false
                    })
                })
            })

            const payloadTotal = [...payloadFijas, ...payloadGenerales]
            await guardarAsignacionesDia(fechaIso, payloadTotal)
            onClose()
        } catch (error) {
            alert('Error al guardar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold">Asignar Tareas</h3>
                        <p className="text-gray-400 text-sm capitalize">
                            {fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    <div className="space-y-4">
                        {TIPOS_FIJOS.map((tipo) => {
                            const Icon = tipo.icon
                            const candidatos = getCandidatosFijos(tipo.id)
                            const valorActual = seleccion[tipo.id] || ""

                            return (
                                <div key={tipo.id} className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tipo.bg} ${tipo.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                                            {tipo.label} {tipo.id === 'Basura' && <span className="text-red-400 text-[10px]">(Adjudicados)</span>}
                                        </label>
                                        <select
                                            value={valorActual}
                                            onChange={(e) => handleChangeFija(tipo.id, e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                                        >
                                            <option value="">-- Sin Asignar --</option>
                                            {candidatos.map((r) => (
                                                <option key={r.id} value={r.id}>{r.apodo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                <Users size={18} className="text-purple-600" /> 
                                Aseos Generales
                            </h4>
                            <button onClick={agregarGeneral} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors flex items-center gap-1">
                                <PlusCircle size={14} /> Nueva Orden
                            </button>
                        </div>

                        {tareasGenerales.length === 0 ? (
                             <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                                <p className="text-xs text-gray-400 italic">No hay órdenes generales para hoy.</p>
                             </div>
                        ) : (
                            <div className="space-y-3">
                                {tareasGenerales.map((tarea) => (
                                    <div key={tarea.id} className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 flex flex-col gap-2 animate-in slide-in-from-left-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white p-2 rounded-lg text-purple-500 shadow-sm shrink-0">
                                                <Sparkles size={18} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Descripción (Ej: Aseo de Gabeta)" 
                                                value={tarea.nombre}
                                                onChange={(e) => updateGeneral(tarea.id, 'nombre', e.target.value)}
                                                className="w-full text-sm bg-transparent border-none p-0 focus:ring-0 font-bold text-gray-700 placeholder:text-gray-400 outline-none"
                                                autoFocus
                                            />
                                            <button onClick={() => borrarGeneral(tarea.id)} className="text-red-300 hover:text-red-500 p-2 transition-colors">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 pl-11">
                                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Vence:</span>
                                            <input 
                                                type="date"
                                                value={tarea.limite}
                                                min={fechaIso}
                                                onChange={(e) => updateGeneral(tarea.id, 'limite', e.target.value)}
                                                className="bg-white border border-purple-200 text-purple-700 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                             <Users size={10} />
                             <span>Se asignará a todos los residentes automáticamente.</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center gap-2">
                        {loading ? '...' : <><Save size={20} /> Guardar Todo</>}
                    </button>
                </div>
            </div>
        </div>
    )
}