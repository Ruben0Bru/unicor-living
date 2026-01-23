'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sentenciarMulta(multaId: string, veredicto: 'aprobada' | 'rechazada') {
    const supabase = await createClient()
    
    // Validar que sea el Representante (Rol 5)
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;

    const { data: perfil } = await supabase.from('perfiles').select('rol_id').eq('id', user.id).single()
    
    // Rol 5 = Representante de Casa, Rol 7 = Admin
    if (perfil?.rol_id !== 5 && perfil?.rol_id !== 7) {
        throw new Error("No tienes potestad para dictar sentencia.")
    }

    const { error } = await supabase
        .from('multas')
        .update({ 
            estado: veredicto,
            updated_at: new Date().toISOString()
        })
        .eq('id', multaId)

    if (error) throw new Error("Error al dictar sentencia")

    revalidatePath('/estrado')
    revalidatePath('/multas')
}