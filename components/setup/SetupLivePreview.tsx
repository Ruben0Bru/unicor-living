'use client'

import { useState } from 'react'
// Agregamos 'Phone'
import { Camera, User, FileText, Hash, Droplet, CheckCircle2, ArrowRight, GraduationCap, Calendar, Heart, LogOut, Phone } from 'lucide-react'
import { completarPerfil } from '@/app/setup/actions'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { signout } from '@/app/login/actions'

type Casa = { id: string, nombre: string, genero: string }

type InitialData = {
  apodo?: string;
  nombre_completo?: string;
  documento_identidad?: string;
  telefono?: string; // <--- NUEVO CAMPO
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
    telefono: initialData?.telefono || '', // <--- ESTADO INICIAL
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

  const hobbiesArray = formState.hobbies.split(',').map(h => h.trim()).filter(h => h.length > 0);
  const nombreCasaSeleccionada = casas.find(c => c.id === formState.casa_id)?.nombre
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
          <h1 className="text-2xl font-bold text-unicor-primary">
            {initialData ? 'Editar Perfil' : 'Construye tu Perfil'}
          </h1>
          <p className="text-gray-500">
            {initialData ? 'Actualiza tus datos para mantener al día a la comunidad.' : 'Estos datos ayudarán a tus compañeros a conocerte mejor.'}
          </p>
        </div>

        <form action={completarPerfil} className="space-y-8">
          
          {/* FOTO */}
          <div className="flex items-center gap-4 p-4 bg-unicor-base rounded-xl border border-unicor-primary/20">
             <div className="w-16 h-16 rounded-full bg-unicor-primary/10 flex items-center justify-center text-unicor-primary shrink-0 overflow-hidden">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} />
                )}
             </div>
             <div>
                <label htmlFor="avatar-upload" className="text-sm font-bold text-unicor-primary cursor-pointer hover:underline">
                   {initialData ? 'Cambiar foto' : 'Sube tu mejor foto'}
                </label>
                <p className="text-xs text-gray-500">Será tu rostro en la app.</p>
             </div>
             <input type="file" name="avatar" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Información Básica</h3>
              
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
                    <input type="text" name="apodo" placeholder="Apodo" required 
                      className={inputClass} 
                      value={formState.apodo} 
                      onChange={handleInputChange} 
                      maxLength={20} 
                    />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative group">
                  <FileText className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="text" name="documento_identidad" placeholder="Cédula / ID" required 
                    className={inputClass} 
                    value={formState.documento_identidad} 
                    onChange={handleInputChange} 
                  />
                 </div>
                 {/* NUEVO INPUT TELÉFONO */}
                 <div className="relative group">
                  <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="tel" name="telefono" placeholder="WhatsApp" 
                    className={inputClass} 
                    value={formState.telefono} 
                    onChange={handleInputChange} 
                  />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative group">
                  <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="date" name="fecha_nacimiento" required 
                    className={inputClass} 
                    value={formState.fecha_nacimiento} 
                    onChange={handleInputChange} 
                   />
                 </div>
                 <div className="relative group">
                  <Droplet className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <select name="tipo_sangre" required 
                    className={`${inputClass} appearance-none`} 
                    value={formState.tipo_sangre} 
                    onChange={handleInputChange}
                  >
                    <option value="">Tipo de Sangre</option>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                 </div>
              </div>

              <div className="relative group">
                 <select name="casa_id" required 
                   className={`${inputClass} appearance-none`} 
                   value={formState.casa_id} 
                   onChange={handleInputChange}
                 >
                   <option value="">-- Tu Casa Universitaria --</option>
                   {casas.map(casa => {
                       const generoRaw = casa.genero?.toUpperCase() || '';
                       let etiquetaGenero = casa.genero; 
                       if (generoRaw === 'M' || generoRaw === 'MASCULINO') etiquetaGenero = 'Varones';
                       if (generoRaw === 'F' || generoRaw === 'FEMENINO') etiquetaGenero = 'Mujeres';
                       
                       return (
                           <option key={casa.id} value={casa.id}>
                               {casa.nombre} ({etiquetaGenero})
                           </option>
                       )
                   })}
                 </select>
              </div>
          </div>

          {/* SECCIÓN 2: VIDA ACADÉMICA Y HOBBIES */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-2">Vida Universitaria</h3>
              
              <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 relative group">
                    <GraduationCap className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input type="text" name="programa_academico" placeholder="Programa" required 
                      className={inputClass} 
                      value={formState.programa_academico} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="relative group">
                    <input type="number" name="semestre_actual" placeholder="Sem" min="1" max="12" required 
                      className={`${inputClass} px-4`} 
                      value={formState.semestre_actual} 
                      onChange={handleInputChange} 
                    />
                  </div>
              </div>

              <div className="relative group">
                <Heart className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input type="text" name="hobbies" placeholder="Hobbies (Fútbol, Leer...)" 
                  className={inputClass} 
                  value={formState.hobbies} 
                  onChange={handleInputChange} 
                />
              </div>

              <div>
                <textarea name="biografia" rows={3} placeholder="Escribe una breve biografía..." 
                  className={`${inputClass} resize-none`} 
                  value={formState.biografia} 
                  onChange={handleInputChange} 
                  maxLength={100}
                ></textarea>
                <p className="text-xs text-right text-gray-400 mt-1">{formState.biografia.length}/100</p>
              </div>
          </div>

          <button type="submit" className="w-full bg-unicor-primary hover:bg-unicor-secondary text-white font-bold py-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
            <span>{initialData ? 'Guardar Cambios' : 'Guardar Perfil Completo'}</span>
            <ArrowRight size={24} />
          </button>
        </form>
      </div>

      {/* --- PREVIEW --- */}
      <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-8 order-1 lg:order-2">
         <div className="mb-4 text-center">
            <p className="text-sm font-bold text-unicor-primary uppercase tracking-wider flex items-center justify-center gap-2">
               <CheckCircle2 size={16} /> Así te verán tus compañeros
            </p>
         </div>
         
         <ProfileCard 
           fotoUrl={fotoPreview}
           apodo={formState.apodo || "Tu Apodo"}
           nombreCompleto={formState.nombre_completo || "Tu Nombre Real"}
           biografia={formState.biografia}
           nombreCasa={nombreCasaSeleccionada}
           tipoSangre={formState.tipo_sangre}
           programa={formState.programa_academico}
           semestre={formState.semestre_actual}
           fechaNacimiento={formState.fecha_nacimiento}
           hobbies={hobbiesArray}
           esPreview={true}
         />
      </div>
    </div>
  )
}