'use client'

import { useState } from 'react'
import { Home, Edit2, Save, X, DollarSign } from 'lucide-react'
import { actualizarCasa } from './actions'

export function CasaCard({ casa }: { casa: any }) {
    const [editando, setEditando] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        await actualizarCasa(formData)
        setLoading(false)
        setEditando(false)
    }

    return (
        <div className={`relative p-6 rounded-3xl border transition-all duration-300 ${editando ? 'bg-indigo-50 border-indigo-200 shadow-lg scale-[1.02]' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-100'}`}>
            
            {editando ? (
                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={casa.id} />
                    
                    <div className="flex justify-between items-center mb-4">
                        <div className="bg-indigo-200 p-3 rounded-xl text-indigo-700"><Home size={24} /></div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setEditando(false)} className="p-2 bg-white text-red-500 rounded-lg"><X size={20} /></button>
                            <button type="submit" disabled={loading} className="p-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 px-4 font-bold"><Save size={20} /> Guardar</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-indigo-800 uppercase">Nombre Sede</label>
                            <input name="nombre" defaultValue={casa.nombre} className="w-full p-2 rounded-lg border border-indigo-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-indigo-800 uppercase">Género</label>
                                <select name="genero" defaultValue={casa.genero} className="w-full p-2 rounded-lg border border-indigo-200 bg-white">
                                    <option value="masculino">Masculino</option>
                                    <option value="femenino">Femenino</option>
                                    <option value="mixto">Mixto</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-indigo-800 uppercase">Capacidad</label>
                                <input type="number" name="capacidad" defaultValue={casa.capacidad} className="w-full p-2 rounded-lg border border-indigo-200" />
                            </div>
                        </div>
                        <div className="pt-2 border-t border-indigo-200">
                            <p className="text-xs font-bold text-gray-500 mb-2">TARIFAS</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Mensualidad</label>
                                    <div className="relative">
                                        <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" name="valor_mensual" defaultValue={casa.valor_mensual} className="w-full pl-6 p-2 rounded-lg border border-indigo-200 text-sm font-bold" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Semestre</label>
                                    <div className="relative">
                                        <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" name="valor_semestre" defaultValue={casa.valor_semestre} className="w-full pl-6 p-2 rounded-lg border border-indigo-200 text-sm font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-gray-50 p-3 rounded-2xl text-gray-400"><Home size={32} /></div>
                        <button onClick={() => setEditando(true)} className="group flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600">
                            <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-indigo-50"><Edit2 size={18} /></div>
                        </button>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-gray-800 leading-tight">{casa.nombre}</h3>
                        <p className="text-gray-400 font-medium text-sm capitalize">{casa.genero} • {casa.capacidad} cupos</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase">Mensualidad</span>
                            <span className="text-lg font-black text-gray-700">${casa.valor_mensual?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase">Semestre</span>
                            <span className="text-lg font-black text-gray-700">${casa.valor_semestre?.toLocaleString()}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}