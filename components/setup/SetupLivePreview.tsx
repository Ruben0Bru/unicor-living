'use client'

import { useState, useMemo } from 'react'
import { Camera, User, FileText, Hash, Droplet, CheckCircle2, ArrowRight, GraduationCap, Calendar, Heart, LogOut, Phone, Briefcase, BadgeCheck } from 'lucide-react'
import { completarPerfil } from '@/app/setup/actions'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { signout } from '@/app/login/actions'

type Casa = { id: string, nombre: string, genero: string }

type InitialData = {
  apodo?: string;
  nombre_completo?: string;
  documento_identidad?: string;
  telefono?: string;
  biografia?: string;
  tipo_sangre?: string;
  casa_id?: string;
  programa_academico?: string;
  semestre_actual?: string | number;
  fecha_nacimiento?: string;
  hobbies?: string[];
  avatar_url?: string;
}

export function SetupLivePreview({ 
  casas, 
  initialData 
}: { 
  casas: Casa[], 
  initialData?: InitialData | null 
}) {
  
  const [fotoPreview, setFotoPreview] = useState<string | null>(initialData?.avatar_url || null)
  
  const [formState, setFormState] = useState({
    apodo: initialData?.apodo || '',
    nombre_completo: initialData?.nombre_completo || '',
    documento_identidad: initialData?.documento_identidad || '',
    telefono: initialData?.telefono || '',
    biografia: initialData?.biografia || '',
    tipo_sangre: initialData?.tipo_sangre || '',
    casa_id: initialData?.casa_id || '',
    programa_academico: initialData?.programa_academico || '',
    semestre_actual: initialData?.semestre_actual || '',
    fecha_nacimiento: initialData?.fecha_nacimiento || '',
    hobbies: initialData?.hobbies ? initialData.hobbies.join(', ') : '' 
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFotoPreview(URL.createObjectURL(file))
  }

  // --- 🧠 LÓGICA DE BIENESTAR / ADMIN ---
  const casaObj = casas.find(c => c.id === formState.casa_id)
  const nombreCasaSeleccionada = casaObj?.nombre || ''
  
  // Detectamos si es la sede administrativa para activar el modo "Funcionario"
  const esAdministrativo = useMemo(() => {
     const nombre = nombreCasaSeleccionada.toLowerCase()
     return nombre.includes('administrativa') || nombre.includes('bienestar')
  }, [nombreCasaSeleccionada])

  const hobbiesArray = formState.hobbies.split(',').map(h => h.trim()).filter(h => h.length > 0);
  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all text-gray-700 font-medium placeholder:font-normal placeholder:text-gray-400"

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {!initialData && (
        <div className="absolute top-0 right-0 lg:hidden z-10">
          <form action={signout}>
              <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors bg-white/80 p-2 rounded-lg backdrop-blur-sm">
                <LogOut size={16} /> Salir
              </button>
          </form>
        </div>
      )}

      {/* --- FORMULARIO --- */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 order-2 lg:order-1 lg:col-span-7">
        <div className="mb-8 border-b pb-4">
          <div className="flex justify-between items-start">
             <div>
                <h1 className="text-2xl font-bold text-unicor-primary">
                  {initialData ? 'Editar Perfil' : 'Construye tu Perfil'}
                </h1>
                <p className="text-gray-500">
                  {esAdministrativo 
                    ? 'Configura tu credencial oficial de funcionario.' 
                    : 'Estos datos ayudarán a tus compañeros a conocerte mejor.'}
                </p>
             </div>
             {esAdministrativo && (
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-200 animate-in fade-in">
                    <BadgeCheck size={14} /> Modo Funcionario
                </span>
             )}
          </div>
        </div>

        <form action={completarPerfil} className="space-y-8">
          
          {/* FOTO */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${esAdministrativo ? 'bg-indigo-50 border-indigo-200' : 'bg-unicor-base border-unicor-primary/20'}`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${esAdministrativo ? 'bg-indigo-200 text-indigo-700' : 'bg-unicor-primary/10 text-unicor-primary'}`}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} />
                )}
             </div>
             <div>
                <label htmlFor="avatar-upload" className={`text-sm font-bold cursor-pointer hover:underline ${esAdministrativo ? 'text-indigo-700' : 'text-unicor-primary'}`}>
                   {initialData ? 'Cambiar foto oficial' : 'Sube tu foto de perfil'}
                </label>
                <p className="text-xs text-gray-500">Será tu rostro en la plataforma.</p>
             </div>
             <input type="file" name="avatar" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Identificación</h3>
              
              {/* Selección de Casa (Lo primero para activar el modo Admin) */}
              <div className="relative group">
                 <select name="casa_id" required 
                   className={`${inputClass} appearance-none font-bold cursor-pointer`} 
                   value={formState.casa_id} 
                   onChange={handleInputChange}
                 >
                   <option value="">-- Selecciona tu Sede / Casa --</option>
                   {casas.map(casa => {
                       const generoRaw = casa.genero?.toUpperCase() || '';
                       let etiquetaGenero = casa.genero; 
                       if (generoRaw === 'M' || generoRaw === 'MASCULINO') etiquetaGenero = 'Varones';
                       if (generoRaw === 'F' || generoRaw === 'FEMENINO') etiquetaGenero = 'Mujeres';
                       if (generoRaw === 'MIXTO') etiquetaGenero = 'Administrativo';
                       
                       return (
                           <option key={casa.id} value={casa.id}>
                               {casa.nombre} ({etiquetaGenero})
                           </option>
                       )
                   })}
                 </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input type="text" name="nombre_completo" placeholder="Nombre Completo" required 
                      className={inputClass} 
                      value={formState.nombre_completo} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="relative group">
                    <Hash className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input type="text" name="apodo" placeholder={esAdministrativo ? "Cargo o Título (Ej: Bienestar)" : "Apodo"} required 
                      className={inputClass} 
                      value={formState.apodo} 
                      onChange={handleInputChange} 
                      maxLength={20} 
                    />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* ID: Opcional si es Admin */}
                 <div className="relative group">
                   <FileText className="absolute left-3 top-3.5 text-gray-400" size={20} />
                   <input type="text" name="documento_identidad" placeholder="Cédula / ID" 
                     required={!esAdministrativo} // 🔓 RELAJADO PARA ADMIN
                     className={inputClass} 
                     value={formState.documento_identidad} 
                     onChange={handleInputChange} 
                   />
                 </div>
                 <div className="relative group">
                   <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                   <input type="tel" name="telefono" placeholder="WhatsApp / Contacto" 
                     className={inputClass} 
                     value={formState.telefono} 
                     onChange={handleInputChange} 
                   />
                 </div>
              </div>

              {/* 🙈 CAMPOS OCULTOS PARA ADMIN (Fecha y Sangre) */}
              {!esAdministrativo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="relative group">
                      <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                      <input type="date" name="fecha_nacimiento" required={!esAdministrativo}
                        className={inputClass} 
                        value={formState.fecha_nacimiento} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="relative group">
                      <Droplet className="absolute left-3 top-3.5 text-gray-400" size={20} />
                      <select name="tipo_sangre" required={!esAdministrativo}
                        className={`${inputClass} appearance-none cursor-pointer`} 
                        value={formState.tipo_sangre} 
                        onChange={handleInputChange}
                      >
                        <option value="">Tipo de Sangre</option>
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                </div>
              )}
          </div>

          {/* SECCIÓN 2: VIDA ACADÉMICA Y HOBBIES */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-2">
                {esAdministrativo ? 'Perfil Profesional' : 'Vida Universitaria'}
              </h3>
              
              {/* 🙈 CAMPOS OCULTOS PARA ADMIN (Programa y Semestre) */}
              {!esAdministrativo && (
                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="col-span-2 relative group">
                      <GraduationCap className="absolute left-3 top-3.5 text-gray-400" size={20} />
                      <input type="text" name="programa_academico" placeholder="Programa" required={!esAdministrativo}
                        className={inputClass} 
                        value={formState.programa_academico} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="relative group">
                      <input type="number" name="semestre_actual" placeholder="Sem" min="1" max="12" required={!esAdministrativo}
                        className={`${inputClass} px-4`} 
                        value={formState.semestre_actual} 
                        onChange={handleInputChange} 
                      />
                    </div>
                </div>
              )}

              <div className="relative group">
                {esAdministrativo ? (
                    <Briefcase className="absolute left-3 top-3.5 text-gray-400" size={20} />
                ) : (
                    <Heart className="absolute left-3 top-3.5 text-gray-400" size={20} />
                )}
                <input type="text" name="hobbies" 
                  placeholder={esAdministrativo ? "Áreas de enfoque (Ej: Convivencia, Psicología)" : "Hobbies (Fútbol, Leer...)"}
                  className={inputClass} 
                  value={formState.hobbies} 
                  onChange={handleInputChange} 
                />
              </div>

              <div>
                <textarea name="biografia" rows={3} placeholder={esAdministrativo ? "Mensaje para los residentes..." : "Escribe una breve biografía..."}
                  className={`${inputClass} resize-none`} 
                  value={formState.biografia} 
                  onChange={handleInputChange} 
                  maxLength={100}
                ></textarea>
                <p className="text-xs text-right text-gray-400 mt-1">{formState.biografia.length}/100</p>
              </div>
          </div>

          <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-lg ${esAdministrativo ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-unicor-primary hover:bg-unicor-secondary'}`}>
            <span>{initialData ? 'Guardar Cambios' : 'Confirmar Registro'}</span>
            <ArrowRight size={24} />
          </button>
        </form>
      </div>

      {/* --- PREVIEW --- */}
      <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-8 order-1 lg:order-2">
         <div className="mb-4 text-center">
            <p className={`text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${esAdministrativo ? 'text-indigo-600' : 'text-unicor-primary'}`}>
               <CheckCircle2 size={16} /> {esAdministrativo ? 'Credencial Oficial' : 'Así te verán tus compañeros'}
            </p>
         </div>
         
         <ProfileCard 
           // ✅ CORREGIDO: Usamos undefined si es normal, o "compact" si es admin
           variant={esAdministrativo ? "compact" : undefined} 
           
           fotoUrl={fotoPreview}
           apodo={formState.apodo || (esAdministrativo ? "Funcionario" : "Tu Apodo")}
           nombreCompleto={formState.nombre_completo || "Nombre Real"}
           biografia={formState.biografia}
           nombreCasa={nombreCasaSeleccionada}
           
           // Si es admin, pasamos undefined para que no pinte datos vacíos
           tipoSangre={esAdministrativo ? undefined : formState.tipo_sangre}
           programa={esAdministrativo ? undefined : formState.programa_academico}
           semestre={esAdministrativo ? undefined : formState.semestre_actual}
           fechaNacimiento={esAdministrativo ? undefined : formState.fecha_nacimiento}
           
           hobbies={hobbiesArray}
           esPreview={true}
         />
      </div>
    </div>
  )
}