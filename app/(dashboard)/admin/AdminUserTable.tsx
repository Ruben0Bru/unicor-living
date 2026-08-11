'use client'

import { useState } from 'react'
import { 
    Search, Shield, User, CheckCircle2, XCircle, UserPlus, Trash2, 
    UserCheck, AlertCircle, Filter, Home, Briefcase, MapPin, ChevronDown 
} from 'lucide-react'
import { aprobarSolicitud, eliminarUsuario, adjudicarUsuario, actualizarRol, actualizarCasa } from './actions'
import { useRouter } from 'next/navigation'

type Usuario = {
    id: string
    apodo: string
    nombre_completo: string | null
    email: string
    rol_id: number
    casa_id: string | null
    es_adjudicado: boolean
    autorizado: boolean
    avatar_url: string
}

type Rol = { id: number; nombre: string }
type Casa = { id: string; nombre: string; genero?: string }

export function AdminUsersTable({ usuarios, roles, casas }: { usuarios: Usuario[], roles: Rol[], casas: Casa[] }) {
    const [tab, setTab] = useState<'pendientes' | 'activos'>('pendientes')
    const [busqueda, setBusqueda] = useState('')
    const [filtroCasa, setFiltroCasa] = useState('all')
    const [loading, setLoading] = useState<string | null>(null)
    
    // Estados temporales para la aprobación
    const [tempCasa, setTempCasa] = useState<string>('')
    const [tempRol, setTempRol] = useState<string>('')
    
    const router = useRouter()

    const getCasaLabel = (nombre: string, genero?: string) => {
        const g = (genero || '').toLowerCase();
        let suffix = '';
        if (g.startsWith('m') && g.includes('asc')) suffix = 'Varones';
        else if (g.startsWith('f')) suffix = 'Mujeres';
        else if (g.includes('mix')) suffix = 'Mixta';
        return suffix ? `${nombre} (${suffix})` : nombre;
    }

    // Filtros
    const solicitudes = usuarios.filter(u => !u.autorizado)
    const activos = usuarios.filter(u => u.autorizado)
    const listaActual = tab === 'pendientes' ? solicitudes : activos
    
const usuariosFiltrados = listaActual.filter(u => {
        // Protección contra valores nulos inyectando strings vacíos
        const apodoSeguro = u.apodo || ''
        const emailSeguro = u.email || ''

        const matchTexto = 
            apodoSeguro.toLowerCase().includes(busqueda.toLowerCase()) || 
            emailSeguro.toLowerCase().includes(busqueda.toLowerCase())
        const matchCasa = filtroCasa === 'all' || u.casa_id === filtroCasa
        return matchTexto && matchCasa
    })
    // --- HANDLERS ---
    const handleAprobar = async (uid: string) => {
        if (!tempCasa || !tempRol) {
            alert("⚠️ Debes asignar una CASA y un ROL antes de aprobar.")
            return
        }
        if(!confirm("¿Confirmas el ingreso de este usuario?")) return;
        setLoading(uid)
        try {
            await aprobarSolicitud(uid, tempCasa, parseInt(tempRol))
            setTempCasa('')
            setTempRol('')
            router.refresh()
        } catch(e) { alert('Error al aprobar') } 
        finally { setLoading(null) }
    }

    const handleEliminar = async (uid: string, esRechazo: boolean) => {
        if(!confirm(esRechazo ? "¿Rechazar solicitud?" : "⚠️ ¿EXPULSAR USUARIO?")) return;
        setLoading(uid)
        try {
            await eliminarUsuario(uid)
            router.refresh()
        } catch(e) { alert('Error al eliminar') } 
        finally { setLoading(null) }
    }

    const handleAdjudicar = async (uid: string) => {
        if(!confirm("¿Confirmas la ADJUDICACIÓN? Esto es permanente.")) return;
        setLoading(uid)
        try {
            await adjudicarUsuario(uid)
            router.refresh()
        } catch(e) { alert('Error al adjudicar') } 
        finally { setLoading(null) }
    }

    const handleChangeRol = async (uid: string, nuevoRolId: string) => {
        if(!confirm("¿Cambiar el rol de este usuario?")) return;
        setLoading(uid)
        try {
            await actualizarRol(uid, parseInt(nuevoRolId))
            router.refresh()
        } catch(e) { alert('Error al cambiar rol') } 
        finally { setLoading(null) }
    }

    const handleChangeCasa = async (uid: string, nuevaCasaId: string) => {
        if(!confirm("¿Mudar usuario a otra casa?")) return;
        setLoading(uid)
        try {
            await actualizarCasa(uid, nuevaCasaId)
            router.refresh()
        } catch(e) { alert('Error al cambiar casa') } 
        finally { setLoading(null) }
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
            
            {/* TABS HEADER */}
            <div className="flex border-b border-gray-100">
                <button 
                    onClick={() => setTab('pendientes')}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${tab === 'pendientes' ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <UserPlus size={18} /> Solicitudes ({solicitudes.length})
                </button>
                <button 
                    onClick={() => setTab('activos')}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${tab === 'activos' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <UserCheck size={18} /> Directorio Activo ({activos.length})
                </button>
            </div>

            {/* TOOLBAR */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o correo..." 
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <select 
                        className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-colors"
                        value={filtroCasa}
                        onChange={(e) => setFiltroCasa(e.target.value)}
                    >
                        <option value="all">🏡 Todas las Sedes</option>
                        {casas.map(c => (
                            <option key={c.id} value={c.id}>{getCasaLabel(c.nombre, c.genero)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABLA */}
            <div className="overflow-auto flex-1 custom-scrollbar p-4 bg-gray-50/30">
                {usuariosFiltrados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <AlertCircle size={48} className="mb-2" />
                        <p>No se encontraron resultados.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {usuariosFiltrados.map(u => (
                            <div key={u.id} className={`flex flex-row items-center justify-between gap-4 p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md min-w-[900px]
                                ${loading === u.id ? 'opacity-50 pointer-events-none' : ''} 
                                ${tab === 'pendientes' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-gray-100'}`}
                            >
                                
                                {/* 1. INFO USUARIO */}
                                <div className="flex items-center gap-4 w-full sm:w-auto sm:min-w-[280px]">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                        <img src={u.avatar_url} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{u.apodo}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{u.nombre_completo || u.email}</p>
                                        
                                        {/* Badge de Estado (Solo visible en Activos) */}
                                        {tab === 'activos' && (
                                            <div className="mt-1">
                                                {u.es_adjudicado ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        <Shield size={10} /> Oficial
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        En Prueba
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. ZONA DE ACCIONES (El corazón del rediseño) */}
                                {tab === 'pendientes' ? (
                                    // MODO SOLICITUDES (Se mantiene limpio)
                                    <div className="flex flex-row gap-2 flex-1 items-center justify-end">
                                        <div className="flex gap-2 w-auto">
                                            <select 
                                                className="flex-none p-2 rounded-xl border border-amber-200 bg-white text-xs font-bold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none"
                                                onChange={(e) => setTempCasa(e.target.value)} defaultValue=""
                                            >
                                                <option value="" disabled>🏡 Asignar Casa...</option>
                                                {casas.map(c => <option key={c.id} value={c.id}>{getCasaLabel(c.nombre, c.genero)}</option>)}
                                            </select>
                                            <select 
                                                className="flex-none p-2 rounded-xl border border-amber-200 bg-white text-xs font-bold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none"
                                                onChange={(e) => setTempRol(e.target.value)} defaultValue=""
                                            >
                                                <option value="" disabled>👮 Asignar Rol</option>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEliminar(u.id, true)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><XCircle size={20} /></button>
                                            <button onClick={() => handleAprobar(u.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-1 transition-transform hover:scale-105 min-h-[44px]"><CheckCircle2 size={14} /> Aprobar</button>
                                        </div>
                                    </div>
                                ) : (
                                    // MODO ACTIVOS - 🔥 EL CAMBIO ESTÉTICO 🔥
                                    <div className="flex flex-row items-center gap-3 justify-end flex-1">
                                        
                                        {/* SELECTOR DE CASA (Estilo Badge Interactivo) */}
                                        <div className="relative group w-auto">
                                            <div className="flex items-center justify-start gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm rounded-xl px-3 py-2 cursor-pointer transition-all w-[200px]">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="bg-indigo-50 p-1 rounded text-indigo-500"><MapPin size={12} /></div>
                                                    <span className="text-xs font-bold text-gray-700 truncate">
                                                        {(() => {
                                                            const c = casas.find(casa => casa.id === u.casa_id);
                                                            return c ? getCasaLabel(c.nombre, c.genero) : 'Sin Casa';
                                                        })()}
                                                    </span>
                                                </div>
                                                <ChevronDown size={12} className="text-gray-300" />
                                            </div>
                                            {/* Select nativo invisible encima */}
                                            <select 
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                value={u.casa_id || ''}
                                                onChange={(e) => handleChangeCasa(u.id, e.target.value)}
                                            >
                                                <option value="" disabled>Mudar usuario...</option>
                                                {casas.map(c => <option key={c.id} value={c.id}>{getCasaLabel(c.nombre, c.genero)}</option>)}
                                            </select>
                                        </div>

                                        {/* SELECTOR DE ROL (Estilo Badge Interactivo) */}
                                        <div className="relative group w-auto">
                                            <div className="flex items-center justify-start gap-2 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-sm rounded-xl px-3 py-2 cursor-pointer transition-all w-[140px]">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="bg-purple-50 p-1 rounded text-purple-500"><Briefcase size={12} /></div>
                                                    <span className="text-xs font-bold text-gray-700 truncate">
                                                        {roles.find(r => r.id === u.rol_id)?.nombre}
                                                    </span>
                                                </div>
                                                <ChevronDown size={12} className="text-gray-300" />
                                            </div>
                                            {/* Select nativo invisible encima */}
                                            <select 
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                value={u.rol_id}
                                                onChange={(e) => handleChangeRol(u.id, e.target.value)}
                                            >
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                            </select>
                                        </div>

                                        <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

                                        {/* BOTONES DE ACCIÓN */}
                                        <div className="flex items-center gap-1 w-auto justify-end">
                                            {!u.es_adjudicado && (
                                                <button 
                                                    onClick={() => handleAdjudicar(u.id)}
                                                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase rounded-xl border border-indigo-200 transition-colors min-h-[44px]"
                                                    title="Ascender a Residente Oficial"
                                                >
                                                    Adjudicar
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleEliminar(u.id, false)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" 
                                                title="Expulsar del sistema"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}