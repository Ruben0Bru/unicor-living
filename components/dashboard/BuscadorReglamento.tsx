'use client'

import { useState } from 'react'
import { Search, ScrollText, AlertTriangle, Book } from 'lucide-react'

// Exportamos los tipos para mantener TypeScript feliz
export type Sancion = {
    codigo_referencia: string
    valor_base: number
    descripcion: string | null
}

export type Articulo = {
    id: string
    numero_articulo: string
    titulo: string
    descripcion_texto: string
    capitulo: string | null
    sanciones: Sancion[]
}

export function BuscadorReglamento({ articulos }: { articulos: Articulo[] }) {
    const [busqueda, setBusqueda] = useState('')

    // 1. Filtrado Dinámico (Algoritmo de búsqueda)
    const articulosFiltrados = articulos.filter(art => {
        const termino = busqueda.toLowerCase()
        return (
            art.titulo.toLowerCase().includes(termino) || 
            art.descripcion_texto.toLowerCase().includes(termino) ||
            art.numero_articulo.toString().includes(termino) ||
            (art.capitulo && art.capitulo.toLowerCase().includes(termino))
        )
    })

    // 2. Agrupación por Capítulos (POST-Filtrado)
    const capitulos: Record<string, Articulo[]> = {}
    
    articulosFiltrados.forEach((art) => {
        const cap = art.capitulo || "Disposiciones Generales"
        if (!capitulos[cap]) capitulos[cap] = []
        capitulos[cap].push(art)
    })

    return (
        <div className="space-y-8">
            
            {/* INPUT DE BÚSQUEDA */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por artículo, título o palabra clave (ej: fumar, visitas)..." 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-unicor-primary outline-none shadow-sm text-gray-700 bg-white"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* CONTENIDO DEL REGLAMENTO */}
            {Object.keys(capitulos).length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(capitulos).map(([nombreCapitulo, listaArticulos], index) => (
                        <div key={index} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            
                            {/* Título Capítulo */}
                            <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center gap-3">
                                <ScrollText className="text-unicor-primary" />
                                <h2 className="text-xl font-bold text-gray-800">{nombreCapitulo}</h2>
                            </div>

                            {/* Lista de Artículos */}
                            <div className="divide-y divide-gray-100">
                                {listaArticulos.map((art) => (
                                    <div key={art.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 mb-2">
                                                    Artículo {art.numero_articulo}: {art.titulo}
                                                </h3>
                                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                                    {art.descripcion_texto}
                                                </p>
                                            </div>

                                            {/* Sanciones Asociadas */}
                                            {art.sanciones && art.sanciones.length > 0 && (
                                                <div className="bg-red-50 rounded-xl p-3 border border-red-100 min-w-[200px]">
                                                    <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 mb-2">
                                                        <AlertTriangle size={12} /> Sanciones Relacionadas
                                                    </p>
                                                    <div className="space-y-2">
                                                        {art.sanciones.map((s, i) => (
                                                            <div key={i} className="text-xs">
                                                                <span className="font-bold text-gray-700">{s.codigo_referencia}</span>
                                                                <div className="flex justify-between text-gray-500">
                                                                    <span>Multa:</span>
                                                                    <span className="font-mono font-bold text-red-600">${s.valor_base.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Book size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">No se encontraron resultados</h3>
                    <p className="text-gray-400">Intenta buscar con otros términos.</p>
                </div>
            )}
        </div>
    )
}