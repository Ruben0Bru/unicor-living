'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Verificar Permisos (Admin O Representante)
async function checkPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('casa_id, roles(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil) throw new Error("Perfil no encontrado")

  const rolesData = perfil.roles as any
  const nombreRol = (Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData?.nombre || '').toLowerCase()
  
  const esAdmin = nombreRol.includes('admin')
  const esRepresentante = nombreRol.includes('representante')

  if (!esAdmin && !esRepresentante) {
      throw new Error("Acceso denegado: Se requiere ser Admin o Representante.")
  }
  
  return { supabase, perfil, esAdmin }
}

// 1. CREAR ARTÍCULO
export async function crearArticulo(formData: FormData) {
    const { supabase, perfil, esAdmin } = await checkPermissions()

    // DATOS DEL FORMULARIO
    const capitulo = formData.get('capitulo') as string
    const numero = formData.get('numero') as string
    const titulo = formData.get('titulo') as string
    const descripcion = formData.get('descripcion') as string
    
    // Lógica de Casa Destino
    let casaDestinoId = perfil.casa_id; 

    if (esAdmin) {
        const selectedCasa = formData.get('casa_id') as string
        if (selectedCasa) {
            casaDestinoId = selectedCasa
        }
    }

    // Datos sanción
    const crearSancion = formData.get('crear_sancion') === 'on'
    const precioMulta = formData.get('precio_multa')
    const codigoSancion = formData.get('codigo_sancion') as string

    if (!numero || !titulo || !descripcion) throw new Error("Faltan datos obligatorios")

    // INSERTAR ARTÍCULO
    const { data: articulo, error: errorArt } = await supabase
        .from('reglamento')
        .insert({
            casa_id: casaDestinoId,
            capitulo,
            numero_articulo: numero,
            titulo,
            descripcion_texto: descripcion
        })
        .select()
        .single()

    if (errorArt) throw new Error("Error creando artículo: " + errorArt.message)

    // INSERTAR SANCIÓN (Si aplica)
    if (crearSancion && articulo) {
        await supabase.from('sanciones').insert({
            casa_id: casaDestinoId,
            reglamento_id: articulo.id,
            codigo_referencia: codigoSancion || `ART-${numero}`,
            descripcion: `Violación al Art. ${numero}: ${titulo}`,
            valor_base: Number(precioMulta),
            categoria: 'disciplinaria' // 👈 CORREGIDO: Antes decía 'sancion'
        })
    }

    revalidatePath('/admin/reglamento')
    revalidatePath('/reglamento')
}

// 2. ELIMINAR ARTÍCULO
export async function eliminarArticulo(id: string) {
    const { supabase } = await checkPermissions()
    await supabase.from('reglamento').delete().eq('id', id)
    revalidatePath('/admin/reglamento')
    revalidatePath('/reglamento')
}

// 3. AGREGAR SANCIÓN A ARTÍCULO EXISTENTE
export async function agregarSancionExtra(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    // Verificar permisos manualmente para esta función
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('casa_id, roles(nombre)')
        .eq('id', user.id)
        .single()
    
    const rolesData = perfil?.roles as any
    const rol = (Array.isArray(rolesData) ? rolesData[0]?.nombre : rolesData?.nombre || '').toLowerCase()

    if (!rol.includes('admin') && !rol.includes('representante')) {
        throw new Error("No autorizado")
    }

    const reglamentoId = formData.get('reglamento_id') as string
    const codigo = formData.get('codigo') as string
    const valor = formData.get('valor') as string
    
    if (!reglamentoId || !codigo || !valor) throw new Error("Datos incompletos");

    // Obtener artículo original para sacar la casa correcta
    const { data: articulo } = await supabase
        .from('reglamento')
        .select('casa_id, numero_articulo, titulo')
        .eq('id', reglamentoId)
        .single()

    if (!articulo) throw new Error("Artículo no encontrado")

    // Seguridad: Representante solo edita su casa
    if (rol.includes('representante') && !rol.includes('admin')) {
        if (articulo.casa_id !== perfil?.casa_id) {
            throw new Error("No puedes editar normas de otra casa")
        }
    }

    const { error } = await supabase.from('sanciones').insert({
        casa_id: articulo.casa_id,
        reglamento_id: reglamentoId,
        codigo_referencia: codigo,
        descripcion: `Violación al Art. ${articulo.numero_articulo}: ${articulo.titulo}`,
        valor_base: Number(valor),
        categoria: 'disciplinaria' // 👈 CORREGIDO: Antes decía 'sancion'
    })

    if (error) {
        console.error("Error al insertar sanción:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/reglamento')
    revalidatePath('/reglamento')
}