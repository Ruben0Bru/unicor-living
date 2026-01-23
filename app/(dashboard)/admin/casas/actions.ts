'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actualizarCasa(formData: FormData) {
    const supabase = await createClient()
    
    // 1. Verificar Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('roles(nombre)')
        .eq('id', user.id)
        .single()

    const rol = (perfil?.roles as any)?.nombre?.toLowerCase() || ''
    if (!rol.includes('admin')) throw new Error("No autorizado")

    // 2. Obtener datos
    const id = formData.get('id') as string
    const nombre = formData.get('nombre') as string
    const genero = formData.get('genero') as string
    const valor_mensual = formData.get('valor_mensual')
    const valor_semestre = formData.get('valor_semestre')
    const capacidad = formData.get('capacidad')

    // 3. Actualizar
    const { error } = await supabase
        .from('casas')
        .update({
            nombre,
            genero,
            valor_mensual: Number(valor_mensual),
            valor_semestre: Number(valor_semestre),
            capacidad: Number(capacidad)
        })
        .eq('id', id)

    if (error) {
        console.error(error)
        throw new Error("Error al actualizar la casa")
    }

    revalidatePath('/admin/casas')
    revalidatePath('/tesoreria') // Importante para actualizar precios
}