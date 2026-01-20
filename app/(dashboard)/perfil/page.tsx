import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SetupLivePreview } from '@/components/setup/SetupLivePreview' 

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Traer casas (para el select)
  const { data: casas } = await supabase
    .from('casas')
    .select('id, nombre, genero')
    .order('nombre')

  // 2. Traer MIS datos actuales
  const { data: miPerfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8">
      {/* Reutilizamos el mismo componente, pero le pasamos 'initialData' */}
      <SetupLivePreview 
        casas={casas || []} 
        initialData={miPerfil} 
      />
    </div>
  )
}