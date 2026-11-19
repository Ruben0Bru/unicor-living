import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  GraduationCap,
  Droplet,
  Cake,
  Sparkles,
  Shield,
  Quote,
  Heart,
} from "lucide-react";

function calcularEdad(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export default async function PerfilResidentePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: residente, error } = await supabase
    .from("perfiles")
    .select("*, casas(nombre), roles(nombre)")
    .eq("id", id)
    .single();

  if (error || !residente) notFound();

  const casaRaw = residente.casas as any;
  const nombreCasa = Array.isArray(casaRaw)
    ? casaRaw[0]?.nombre
    : casaRaw?.nombre;

  const rolRaw = residente.roles as any;
  const nombreRol = Array.isArray(rolRaw) ? rolRaw[0]?.nombre : rolRaw?.nombre;

  const edad = calcularEdad(residente.fecha_nacimiento);
  const hobbies: string[] = Array.isArray(residente.hobbies)
    ? residente.hobbies
    : [];
  const esMiPerfil = user.id === residente.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Navegación */}
      <Link
        href="/comunidad"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-unicor-primary transition-colors group"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Volver a Comunidad
      </Link>

      {/* Tarjeta Principal del Perfil */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner superior */}
        <div className="h-36 bg-gradient-to-r from-unicor-primary to-unicor-secondary relative">
          {esMiPerfil && (
            <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
              Tu perfil
            </span>
          )}
        </div>

        {/* Avatar y encabezado */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16 mb-6 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 shrink-0">
              {residente.avatar_url ? (
                <img
                  src={residente.avatar_url}
                  alt={residente.apodo || "Residente"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-unicor-primary bg-green-50">
                  {(residente.apodo || "R")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 sm:pb-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {residente.apodo}
              </h1>
              {residente.nombre_completo && (
                <p className="text-gray-500 font-medium">
                  {residente.nombre_completo}
                </p>
              )}
            </div>
          </div>

          {/* Badges de Casa, Estado y Rol */}
          <div className="flex flex-wrap gap-2 mb-8">
            {nombreCasa && (
              <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold">
                <Home size={14} className="text-unicor-primary" />
                {nombreCasa}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                residente.es_adjudicado
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
              }`}
            >
              {residente.es_adjudicado ? (
                <Shield size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {residente.es_adjudicado
                ? "Residente Oficial"
                : "En Periodo de Prueba"}
            </span>

            {nombreRol && !nombreRol.toLowerCase().includes("residente") && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold">
                {nombreRol}
              </span>
            )}
          </div>

          {/* Biografía completa */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-2">
              <Quote size={14} /> Sobre mí
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line italic">
              {residente.biografia
                ? `"${residente.biografia}"`
                : "Este residente aún no ha escrito su biografía."}
            </p>
          </div>

          {/* Datos rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1.5 mb-1">
                <GraduationCap size={14} className="text-unicor-primary" />
                Programa
              </p>
              <p className="font-bold text-gray-800 text-sm">
                {residente.programa_academico || "No registrado"}
              </p>
              {residente.semestre_actual && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Semestre {residente.semestre_actual}°
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1.5 mb-1">
                <Cake size={14} className="text-amber-500" />
                Edad
              </p>
              <p className="font-bold text-gray-800 text-sm">
                {edad !== null ? `${edad} años` : "No registrada"}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <p className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1.5 mb-1">
                <Droplet size={14} className="text-red-500" />
                Tipo de Sangre
              </p>
              <p className="font-bold text-gray-800 text-sm">
                {residente.tipo_sangre || "No registrado"}
              </p>
            </div>
          </div>

          {/* Hobbies completos */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-3">
              <Heart size={14} className="text-rose-400" /> Intereses & Hobbies
            </h2>
            {hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hobbies.map((hobby, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-50 text-amber-800 border border-amber-200/70 px-3.5 py-1.5 rounded-full text-xs font-bold"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Sin intereses registrados todavía.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
