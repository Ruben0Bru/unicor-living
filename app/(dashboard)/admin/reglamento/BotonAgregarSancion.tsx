'use client'

import { useState } from 'react'
import { Plus, Check, X, Gavel } from 'lucide-react'
import { agregarSancionExtra } from './actions'

export function BotonAgregarSancion({ reglamentoId }: { reglamentoId: string }) {
    const [editando, setEditando] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        await agregarSancionExtra(formData)
        setLoading(false)
        setEditando(false)
    }

    if (editando) {
        return (
            <form action={handleSubmit} className="mt-3 bg-indigo-50 p-2 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95">
                <div className="flex-1 space-y-1">
                    <input 
                        name="codigo" 
                        placeholder="Cód (B-01)" 
                        required 
                        className="w-full text-xs p-1 rounded border border-indigo-200 outline-none"
                        autoFocus
                    />
                    <input 
                        name="valor" 
                        type="number" 
                        placeholder="$ Valor" 
                        required 
                        className="w-full text-xs p-1 rounded border border-indigo-200 outline-none"
                    />
                    <input type="hidden" name="reglamento_id" value={reglamentoId} />
                </div>
                <div className="flex flex-col gap-1">
                    <button type="submit" disabled={loading} className="bg-green-500 text-white p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-green-600">
                        <Check size={14} />
                    </button>
                    <button type="button" onClick={() => setEditando(false)} className="bg-red-400 text-white p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-red-500">
                        <X size={14} />
                    </button>
                </div>
            </form>
        )
    }

    return (
        <button 
            onClick={() => setEditando(true)}
            className="mt-2 text-[10px] text-indigo-500 font-bold hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-transparent hover:border-indigo-100"
        >
            <Plus size={12} /> Agregar Sanción
        </button>
    )
}