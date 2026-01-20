'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- 1. GENERAR MENSUALIDAD (Sin cambios, funciona bien) ---
export async function generarCuotasMensuales() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuario no autenticado")

  // Obtener mi perfil
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('id, casa_id')
    .eq('id', user.id)
    .single()

  if (!miPerfil) throw new Error("Perfil no encontrado")

  const casaId = miPerfil.casa_id
  const tesoreroId = miPerfil.id

  // Obtener valor mensualidad
  const { data: casa } = await supabase
    .from('casas')
    .select('valor_mensual')
    .eq('id', casaId)
    .single()

  const valorMensualidad = casa?.valor_mensual || 15000 

  // Sanción ID (Mensualidad)
  const { data: sancion } = await supabase
    .from('sanciones')
    .select('id')
    .eq('casa_id', casaId)
    .ilike('codigo_referencia', 'MENSUALIDAD')
    .single()
  const sancionId = sancion?.id || null 

  // Concepto
  const fecha = new Date()
  fecha.setHours(fecha.getHours() - 5) 
  const nombreMes = fecha.toLocaleString('es-CO', { month: 'long' })
  const anio = fecha.getFullYear()
  const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
  const conceptoCobro = `Mensualidad ${mesCapitalizado} ${anio}` 

  // Residentes
  const { data: residentes } = await supabase
    .from('perfiles')
    .select('id')
    .eq('casa_id', casaId)

  if (!residentes) return

  const cobros = []
  for (const res of residentes) {
    const { data: existe } = await supabase
      .from('multas')
      .select('id')
      .eq('residente_id', res.id)
      .eq('descripcion_personalizada', conceptoCobro)
      .eq('categoria', 'mensualidad')
      .single()

    if (!existe) {
      cobros.push({
        residente_id: res.id,
        casa_id: casaId,
        acusador_id: tesoreroId,
        sancion_id: sancionId, 
        valor: valorMensualidad,
        estado: 'aprobada',
        categoria: 'mensualidad',
        descripcion_personalizada: conceptoCobro,
        created_at: new Date().toISOString()
      })
    }
  }

  if (cobros.length > 0) {
    await supabase.from('multas').insert(cobros)
  }
  revalidatePath('/tesoreria')
  revalidatePath('/finanzas')
}

// --- 2. GENERAR SEMESTRE (CORREGIDO Y BLINDADO) 🛡️ ---
export async function generarCuotaSemestre() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuario no autenticado")

  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('id, casa_id')
    .eq('id', user.id)
    .single()

  if (!miPerfil) throw new Error("Perfil no encontrado")
  
  const casaId = miPerfil.casa_id
  const tesoreroId = miPerfil.id

  // 1. 🧹 AUTOLIMPIEZA: Eliminar cobros erróneos previos a Representantes
  // Esto arregla el problema de "La Jefa" sin usar SQL manual.
  
  // A. Buscamos los IDs de los representantes/admins
  const { data: vips } = await supabase
    .from('perfiles')
    .select('id, roles!inner(nombre)') // !inner asegura que tenga rol
    .eq('casa_id', casaId)
    .or('nombre.ilike.%representante%,nombre.ilike.%admin%') // Filtro directo en la DB
    .not('roles', 'is', null) // Asegurar que tenga rol

  if (vips && vips.length > 0) {
      const vipIds = vips.map(v => v.id)
      
      // B. Borramos cualquier multa de categoría 'semestre' que tengan estos usuarios
      await supabase
        .from('multas')
        .delete()
        .in('residente_id', vipIds)
        .eq('categoria', 'semestre')
        .eq('casa_id', casaId)
  }

  // --- FIN AUTOLIMPIEZA ---

  // 2. Obtener valor semestre
  const { data: casa } = await supabase
    .from('casas')
    .select('valor_semestre')
    .eq('id', casaId)
    .single()
  const valorSemestre = casa?.valor_semestre || 0

  // 3. Sanción ID (Semestre)
  const { data: sancion } = await supabase
    .from('sanciones')
    .select('id')
    .eq('casa_id', casaId)
    .ilike('codigo_referencia', 'SEMESTRE')
    .single()
  const sancionId = sancion?.id || null

  // 4. Calcular periodo
  const fecha = new Date()
  const anio = fecha.getFullYear()
  const mes = fecha.getMonth() + 1 
  const periodo = mes <= 6 ? '1' : '2'
  const concepto = `Cuota Semestre ${anio}-${periodo}`

  // 5. Traer residentes CON roles
  const { data: residentes } = await supabase
    .from('perfiles')
    .select('id, roles(nombre)')
    .eq('casa_id', casaId)

  if (!residentes) return

  const cobros = []

  for (const res of residentes) {
    // 🛠️ FIX DE TYPESCRIPT Y LOGICA 🛠️
    // Supabase devuelve un array en relaciones 1:N o M:1 a veces.
    // Usamos 'any' para evitar el error de TS y accedemos al índice 0.
    const rolesData = res.roles as any;
    
    let nombreRol = '';
    
    if (Array.isArray(rolesData) && rolesData.length > 0) {
        nombreRol = rolesData[0]?.nombre || ''; // Caso Array: [{nombre: '...'}]
    } else if (rolesData && typeof rolesData === 'object') {
        nombreRol = rolesData.nombre || '';     // Caso Objeto: {nombre: '...'}
    }

    const rolLower = nombreRol.toLowerCase();

    // 🚨 REGLA: LA JEFA (Representante) Y ADMINS NO PAGAN SEMESTRE 🚨
    if (rolLower.includes('representante') || rolLower.includes('admin')) {
        continue;
    }

    // Evitar duplicados
    const { data: existe } = await supabase
        .from('multas')
        .select('id')
        .eq('residente_id', res.id)
        .eq('descripcion_personalizada', concepto)
        .eq('categoria', 'semestre') 
        .single()

    if (!existe) {
        cobros.push({
            residente_id: res.id,
            casa_id: casaId,
            acusador_id: tesoreroId,
            sancion_id: sancionId,
            valor: valorSemestre,
            estado: 'aprobada',
            categoria: 'semestre', 
            descripcion_personalizada: concepto,
            created_at: new Date().toISOString()
        })
    }
  }

  if (cobros.length > 0) {
      await supabase.from('multas').insert(cobros)
  }

  revalidatePath('/tesoreria')
  revalidatePath('/finanzas')
}
// --- 3. REGISTRAR PAGO (LEGALIZAR) 💵 ---
export async function registrarPago(formData: FormData) {
  const supabase = await createClient()
  
  // Obtenemos los IDs y los convertimos explícitamente a string para evitar errores de tipo
  const rawIds = formData.getAll('multa_id')
  const multasIds = rawIds.map(id => id.toString())

  if (!multasIds || multasIds.length === 0) {
      return // No seleccionó nada
  }

  // Debug: Ver en la terminal qué estamos intentando pagar
  console.log("Intentando pagar multas IDs:", multasIds)

  // Actualizamos el estado a 'pagada'
  const { error } = await supabase
    .from('multas')
    .update({ 
        estado: 'pagada',
        updated_at: new Date().toISOString()
    })
    .in('id', multasIds)

  if (error) {
      // Importante: Mostrar el mensaje REAL de Supabase en la consola del servidor
      console.error("Error Supabase registrando pago:", error.message, error.details)
      throw new Error(`Error registrando pago: ${error.message}`)
  }

  // Refrescamos todo
  revalidatePath('/tesoreria')
  revalidatePath('/finanzas')
}