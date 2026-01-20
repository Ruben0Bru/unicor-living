import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
// Importamos el nuevo componente de vista en vivo
import { SetupLivePreview } from '@/components/setup/SetupLivePreview' 

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Traer las casas disponibles
const { data: casas } = await supabase
    .from('casas')
    .select('id, nombre, genero') // <--- AGREGAMOS 'genero' AQUÍ
    .order('nombre')

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8">
      {/* Pasamos los datos actualizados, TS puede quejarse si no actualizamos el componente hijo primero */}
      <SetupLivePreview casas={casas || []} />
    </div>
  )
}