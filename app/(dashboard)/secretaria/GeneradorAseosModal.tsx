'use client'

import { useState, useEffect } from 'react'
import { Settings, X, Calendar, CheckSquare, Square, Loader2 } from 'lucide-react'
import { generarAseosMensuales } from './actions'

type Residente = {
  id: string
  apodo: string
  es_adjudicado: boolean
}

export function GeneradorAseosModal({ residentes }: { residentes: Residente[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())

  const [pools, setPools] = useState({
    casa: [] as string[],
    bano: [] as string[],
    cocina: [] as string[],
    basura: [] as string[]
  })

  useEffect(() => {
    if (isOpen) {
      const todosIds = residentes.map(r => r.id)
      const adjudicadosIds = residentes.filter(r => r.es_adjudicado).map(r => r.id)

      setPools({
        casa: [...todosIds],
        bano: [...todosIds],
        cocina: [...adjudicadosIds],
        basura: [...adjudicadosIds]
      })
      setError('')
    }
  }, [isOpen, residentes])

  const toggleResidente = (zona: keyof typeof pools, id: string) => {
    setPools(prev => {
      const arr = prev[zona] || []
      return {
        ...prev,
        [zona]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]
      }
    })
  }

  const handleGenerar = async () => {
    setLoading(true)
    setError('')
    try {
      if (Object.values(pools).some(arr => arr.length === 0)) {
        throw new Error("Todas las zonas deben tener al menos un residente asignado.")
      }

      await generarAseosMensuales({
        casa_id: '', 
        mes,
        anio,
        pools
      })
      
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message || 'Error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  const ListaCheck = ({ titulo, zona, listaFiltrada }: { titulo: string, zona: keyof typeof pools, listaFiltrada: Residente[] }) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
      <h4 className="text-xs font-black text-gray-500 uppercase mb-2 tracking-wider">{titulo}</h4>
      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {listaFiltrada.map(r => {
          const isChecked = pools[zona]?.includes(r.id)
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleResidente(zona, r.id)}
              className="flex items-center gap-2 w-full text-left p-1.5 hover:bg-gray-200 rounded transition-colors"
            >
              {isChecked ? <CheckSquare size={16} className="text-purple-600" /> : <Square size={16} className="text-gray-400" />}
              <span className={`text-sm ${isChecked ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>{r.apodo}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 active:scale-95"
      >
        <Settings size={18} /> Automatizar Mes
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Calendar size={24} /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Generador de Aseos</h2>
                  <p className="text-sm text-slate-500">Configura el ciclo operativo mensual.</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-xl transition-colors"><X size={24}/></button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{error}</div>}
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mes Objetivo</label>
                  <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-bold text-slate-700">
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/3">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Año</label>
                  <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-slate-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ListaCheck titulo="Aseo General" zona="casa" listaFiltrada={residentes} />
                <ListaCheck titulo="Baños (2/día)" zona="bano" listaFiltrada={residentes} />
                <ListaCheck titulo="Cocina" zona="cocina" listaFiltrada={residentes.filter(r => r.es_adjudicado)} />
                <ListaCheck titulo="Basura" zona="basura" listaFiltrada={residentes.filter(r => r.es_adjudicado)} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button 
                onClick={handleGenerar} 
                disabled={loading}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Procesando...</> : 'Generar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}