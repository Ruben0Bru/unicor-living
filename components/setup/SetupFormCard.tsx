'use client'

import { useState } from 'react'
// IMPORTANTE: Agregamos 'Phone' a los imports
import { Camera, User, Home, FileText, Hash, Droplet, UserCircle2, CheckCircle2, Phone } from 'lucide-react'
import { completarPerfil } from '@/app/setup/actions'

type Casa = { id: string, nombre: string }

export function SetupFormCard({ casas }: { casas: Casa[] }) {
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [apodoPreview, setApodoPreview] = useState("Tu Apodo")
  const [bioPreview, setBioPreview] = useState("Escribe una breve biografía sobre ti...")

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unicor-primary focus:border-transparent outline-none transition-all text-gray-700 font-medium placeholder:font-normal placeholder:text-gray-400"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setFotoPreview(objectUrl)
    }
  }

  return (
    <form action={completarPerfil} className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden relative">
      
      {/* HEADER */}
      <div className="h-48 w-full bg-unicor-primary bg-gradient-to-r from-unicor-primary to-unicor-secondary relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] bg-[size:20px_20px]"></div>
      </div>

      {/* CÍRCULO FOTO */}
      <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-10">
        <div className="relative group">
          <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 size={80} className="text-gray-300" />
            )}
          </div>
          <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 bg-unicor-accent text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-unicor-primary transition-all hover:scale-110 active:scale-95 border-4 border-white">
            <Camera size={18} />
            <input type="file" name="avatar" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      {/* CUERPO */}
      <div className="pt-24 pb-12 px-8 md:px-12 mt-2">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{apodoPreview || "Tu Apodo"}</h2>
          <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm italic">"{bioPreview || "Sin biografía"}"</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 uppercase tracking-wider">
            <span>En Proceso de Registro</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="relative group">
              <User className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="text" name="nombre_completo" placeholder="Nombre Completo Real" required className={inputClass} />
            </div>

            <div className="relative group">
              <Hash className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="text" name="apodo" placeholder="Apodo" required 
                className={inputClass}
                onChange={(e) => setApodoPreview(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="relative group">
              <FileText className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="text" name="documento_identidad" placeholder="Documento de Identidad" required className={inputClass} />
            </div>

            {/* --- NUEVO CAMPO: TELÉFONO --- */}
            <div className="relative group">
              <Phone className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <input type="tel" name="telefono" placeholder="WhatsApp (Ej: 3001234567)" className={inputClass} />
            </div>
            {/* ----------------------------- */}

            <div className="relative group">
              <Droplet className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
              <div className="relative">
                <select name="tipo_sangre" required className={`${inputClass} appearance-none cursor-pointer`}>
                  <option value="">Tipo de Sangre</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <Home className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-unicor-primary transition-colors" size={20} />
            <div className="relative">
              <select name="casa_id" required className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="">-- Selecciona tu Casa Universitaria --</option>
                {casas.map(casa => (
                  <option key={casa.id} value={casa.id}>{casa.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea name="biografia" rows={3} placeholder="Escribe una breve biografía..."
              className={`${inputClass} resize-none`}
              onChange={(e) => setBioPreview(e.target.value)}
              maxLength={100}
            ></textarea>
            <p className="text-xs text-right text-gray-400 mt-1">{bioPreview.length}/100</p>
          </div>

        </div>

        <button type="submit" className="w-full mt-8 bg-unicor-primary hover:bg-unicor-secondary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg flex justify-center items-center gap-2">
          <CheckCircle2 size={20} />
          <span>Guardar y Crear Perfil</span>
        </button>

      </div>
    </form>
  )
}