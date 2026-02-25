import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Wallet, User, Megaphone, PlusCircle, DollarSign, Filter, CheckCircle2, Landmark, Eye } from 'lucide-react'
import Link from 'next/link'
import { generarCuotasMensuales, generarCuotaSemestre } from './actions'

export default async function TesoreriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. PERMISOS
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*, roles(nombre)')
    .eq('id', user.id)
    .single()

  const nombreRol = miPerfil?.roles?.nombre?.toLowerCase() || ''
  const esTesorero = nombreRol.includes('tesorero') || nombreRol.includes('admin') || nombreRol.includes('representante')

  if (!esTesorero) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
            <h1 className="text-xl font-bold text-gray-700">Zona Restringida</h1>
        </div>
    )
  }

  // 2. RESIDENTES
  const { data: residentes } = await supabase
    .from('perfiles')
    .select('id, apodo, nombre_completo, avatar_url, es_adjudicado')
    .eq('casa_id', miPerfil.casa_id)
    .order('apodo', { ascending: true })

  // 3. DEUDAS
  const { data: deudas } = await supabase
    .from('multas')
    .select('residente_id, valor, categoria')
    .eq('estado', 'aprobada') 

  // --- LÓGICA BOTONES ---
  
  // A. Mes Actual
  const fecha = new Date()
  fecha.setHours(fecha.getHours() - 5)
  const nombreMes = fecha.toLocaleString('es-CO', { month: 'long' })
  const anio = fecha.getFullYear()
  const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
  const conceptoMes = `Mensualidad ${mesCapitalizado} ${anio}`
  
  const { count: countMes } = await supabase.from('multas').select('*', { count: 'exact', head: true })
      .eq('casa_id', miPerfil.casa_id).eq('descripcion_personalizada', conceptoMes).eq('categoria', 'mensualidad')
  const yaCobroMes = countMes !== null && countMes > 0;

  // B. Semestre Actual
  const mesNum = fecha.getMonth() + 1
  const periodo = mesNum <= 6 ? '1' : '2'
  const conceptoSemestre = `Cuota Semestre ${anio}-${periodo}`

  const { count: countSemestre } = await supabase.from('multas').select('*', { count: 'exact', head: true })
      .eq('casa_id', miPerfil.casa_id).eq('descripcion_personalizada', conceptoSemestre).eq('categoria', 'semestre')
  const yaCobroSemestre = countSemestre !== null && countSemestre > 0;

  // ----------------------

  // 4. SALDOS
  const listaResidentes = residentes?.map(res => {
     const misDeudas = deudas?.filter(d => d.residente_id === res.id) || []
     const totalDeuda = misDeudas.reduce((sum, d) => sum + (d.valor || 0), 0)
     const conteoSanciones = misDeudas.filter(d => d.categoria === 'sancion').length
     const conteoMensualidades = misDeudas.filter(d => d.categoria === 'mensualidad').length
     const conteoSemestres = misDeudas.filter(d => d.categoria === 'semestre').length
     
     return { ...res, totalDeuda, conteoSanciones, conteoMensualidades, conteoSemestres }
  }) || []

  listaResidentes.sort((a, b) => b.totalDeuda - a.totalDeuda)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Wallet size={24} />
            </span>
            Tesorería
            </h1>
            <p className="text-gray-500">Gestión de cartera y cobros.</p>
        </div>

        {/* BOTONERA DOBLE */}
        <div className="flex flex-wrap gap-2">
             
             {/* 1. Botón MES */}
             {yaCobroMes ? (
                <button disabled className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-not-allowed border border-green-200 opacity-80">
                    <CheckCircle2 size={16} /> <span className="hidden sm:inline">{mesCapitalizado} OK</span>
                </button>
             ) : (
                <form action={generarCuotasMensuales}>
                    <button className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95">
                        <DollarSign size={16} /> <span className="hidden sm:inline">Cobrar {mesCapitalizado}</span>
                    </button>
                </form>
             )}

             {/* 2. Botón SEMESTRE */}
             {yaCobroSemestre ? (
                <button disabled className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-not-allowed border border-blue-200 opacity-80">
                    <CheckCircle2 size={16} /> <span className="hidden sm:inline">Semestre OK</span>
                </button>
             ) : (
                <form action={generarCuotaSemestre}>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95">
                        <Landmark size={16} /> <span className="hidden sm:inline">Cobrar Semestre</span>
                    </button>
                </form>
             )}
             
             <button className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
                 <Filter size={16} />
             </button>
        </div>
      </div>

      {/* TABLA RESIDENTES */}
      <div className="grid grid-cols-1 gap-4">
          {listaResidentes.map((res) => (
              <div key={res.id} className={`relative overflow-hidden rounded-2xl p-0.5 transition-all hover:scale-[1.01] ${res.totalDeuda > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-red-100' : 'bg-gray-100'}`}>
                  <div className="bg-white p-4 rounded-[14px] flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                {res.avatar_url ? <img src={res.avatar_url} alt="Av" className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-gray-400" />}
                            </div>
                            {res.totalDeuda > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full border-2 border-white animate-pulse"><Megaphone size={12} /></div>
                            )}
                          </div>
                          
                          <div className="text-center sm:text-left">
                              <h3 className="font-bold text-gray-800 text-lg leading-tight">{res.apodo}</h3>
                              <p className="text-xs text-gray-400">{res.nombre_completo || "Sin nombre"}</p>
                              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                                  {res.conteoSanciones > 0 && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">{res.conteoSanciones} Multas</span>}
                                  {res.conteoMensualidades > 0 && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">{res.conteoMensualidades} Meses</span>}
                                  {res.conteoSemestres > 0 && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">Semestre</span>}
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
                          <div className="text-right">
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Deuda Total</p>
                              <p className={`text-2xl font-black ${res.totalDeuda > 0 ? 'text-red-500' : 'text-green-500'}`}>${res.totalDeuda.toLocaleString()}</p>
                          </div>
                          <Link href={`/tesoreria/${res.id}`} className="bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 p-3 rounded-xl transition-colors">
                              <Eye size={24} />
                          </Link>
                      </div>
                  </div>
              </div>
          ))}
      </div>
      {listaResidentes.length === 0 && <p className="text-center text-gray-400 py-10">No hay residentes.</p>}
    </div>
  )
}