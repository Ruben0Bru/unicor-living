import { UserCircle2, Hash, Droplet, Home, GraduationCap, Heart, Calendar } from 'lucide-react';

interface ProfileCardProps {
  fotoUrl: string | null;
  apodo: string;
  nombreCompleto?: string;
  biografia: string;
  nombreCasa?: string;
  tipoSangre?: string;
  programa?: string;
  semestre?: string | number;
  fechaNacimiento?: string;
  hobbies?: string[];
  esPreview?: boolean;
  variant?: 'full' | 'compact'; // <--- NUEVA PROP para controlar el tamaño
}

export function ProfileCard({
  fotoUrl,
  apodo,
  nombreCompleto,
  biografia,
  nombreCasa,
  tipoSangre,
  programa,
  semestre,
  fechaNacimiento,
  hobbies = [],
  esPreview = false,
  variant = 'full' // Por defecto es grande
}: ProfileCardProps) {
  
  const edad = fechaNacimiento 
    ? new Date().getFullYear() - new Date(fechaNacimiento).getFullYear()
    : null;

  // Ajustes de estilos según la variante
  const isCompact = variant === 'compact';
  const headerHeight = isCompact ? 'h-20' : 'h-32';
  const avatarSize = isCompact ? 'w-20 h-20' : 'w-32 h-32';
  const avatarTop = isCompact ? 'top-10' : 'top-16';
  const paddingTop = isCompact ? 'pt-12' : 'pt-20';

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      
      {/* HEADER */}
      <div className={`${headerHeight} bg-gradient-to-r from-unicor-primary to-unicor-secondary relative overflow-hidden transition-all`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:20px_20px]"></div>
        {esPreview && (
           <div className="absolute top-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">Vista Previa</div>
        )}
      </div>

      {/* FOTO */}
      <div className={`absolute ${avatarTop} left-1/2 transform -translate-x-1/2 p-1 bg-white rounded-full transition-all`}>
        <div className={`${avatarSize} rounded-full border-4 border-unicor-base overflow-hidden bg-gray-100 flex items-center justify-center shadow-md`}>
          {fotoUrl ? (
            <img src={fotoUrl} alt={apodo} className="w-full h-full object-cover" />
          ) : (
            <UserCircle2 size={isCompact ? 60 : 80} className="text-gray-300" />
          )}
        </div>
      </div>

      {/* CUERPO */}
      <div className={`${paddingTop} pb-6 px-4 text-center flex-1 flex flex-col gap-3`}>
        
        {/* Identidad */}
        <div>
            <h2 className={`${isCompact ? 'text-lg' : 'text-2xl'} font-bold text-gray-800 tracking-tight leading-none`}>
                {apodo || "Sin Apodo"}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1 text-gray-500 text-xs font-medium">
                {nombreCompleto && <span className="truncate max-w-[150px]">{nombreCompleto}</span>}
                {edad && (
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600 border border-gray-200">
                        {edad} años
                    </span>
                )}
            </div>
        </div>

        {/* Info Académica (Versión Compacta: Solo texto / Versión Full: Badge) */}
        {(programa || semestre) && (
            <div className={`flex items-center justify-center gap-1.5 text-unicor-primary ${isCompact ? 'text-xs' : 'bg-green-50 py-2 px-4 rounded-lg mx-auto w-fit text-sm'}`}>
                <GraduationCap size={isCompact ? 14 : 18} />
                <span className="font-bold truncate max-w-[200px]">
                    {programa} {semestre ? `| ${semestre}°` : ''}
                </span>
            </div>
        )}

        {/* Biografía (Limitada en compact) */}
        <div className="relative px-2">
           <p className={`text-gray-600 italic text-sm leading-relaxed ${isCompact ? 'line-clamp-2' : ''}`}>
            "{biografia || "..."}"
           </p>
        </div>

        {/* Hobbies (Limitados en compact) */}
        {hobbies && hobbies.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-auto pt-2">
                {(isCompact ? hobbies.slice(0, 3) : hobbies).map((hobby, index) => (
                    <span key={index} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full border border-yellow-100 flex items-center gap-1">
                        {hobby}
                    </span>
                ))}
                {isCompact && hobbies.length > 3 && (
                    <span className="text-[10px] text-gray-400 font-medium">+{hobbies.length - 3}</span>
                )}
            </div>
        )}

        {/* Footer (Casa) */}
        {!isCompact && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-center gap-3 opacity-80">
            {nombreCasa && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Home size={14} /> <span>{nombreCasa}</span>
                </div>
            )}
            </div>
        )}

      </div>
      
      {/* Footer Compacto (Solo Casa) */}
      {isCompact && nombreCasa && (
          <div className="bg-gray-50 py-2 px-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
              <Home size={12} />
              <span>{nombreCasa}</span>
          </div>
      )}
    </div>
  );
}