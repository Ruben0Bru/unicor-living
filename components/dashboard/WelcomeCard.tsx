import { UserCircle, Home, Award } from 'lucide-react';

// Definimos qué datos necesitamos recibir
interface WelcomeCardProps {
  apodo: string | null;
  casa: string | null;
  es_adjudicado: boolean;
}

export function WelcomeCard({ apodo, casa, es_adjudicado }: WelcomeCardProps) {
  // Lógica simple para el saludo según la hora
  const hour = new Date().getHours();
  let greeting = "Hola";
  if (hour < 12) greeting = "Buenos días";
  else if (hour < 18) greeting = "Buenas tardes";
  else greeting = "Buenas noches";

  return (
    <div suppressHydrationWarning className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
      
      {/* Contenido Principal */}
      <div className="z-10">
        <h2 className="text-3xl font-bold text-unicor-primary mb-2">
          {greeting}, <span className="text-unicor-accent">{apodo || "Residente"}</span>.
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-gray-600 mt-2">
          <div className="flex items-center gap-1 bg-unicor-base px-3 py-1 rounded-full whitespace-nowrap">
            <Home size={16} className="text-unicor-secondary shrink-0" />
            <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{casa || "Sin asignar"}</span>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full whitespace-nowrap ${es_adjudicado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            <Award size={16} className="shrink-0" />
            <span className="font-medium text-sm sm:text-base">{es_adjudicado ? "Residente Oficial" : "En Periodo de Prueba"}</span>
          </div>
        </div>
      </div>

      {/* Decoración (Icono gigante de fondo) */}
      <UserCircle className="absolute -right-10 -bottom-10 text-unicor-base opacity-50" size={150} />
    </div>
  );
}