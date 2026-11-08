import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signout } from "@/app/login/actions";
import { LogOut, UserCircle, Menu } from "lucide-react";
import { SidebarNav } from "@/components/dashboard/SideBarNav";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*, roles(nombre)")
    .eq("id", user.id)
    .single();

  // 1. CHECKPOINT DE SEGURIDAD (ADMISIONES)
  if (perfil && !perfil.autorizado) {
    redirect("/espera");
  }

  // --- LÓGICA DE PERMISOS ---
  const rawRol = perfil?.roles as any;
  const nombreRol = (rawRol?.nombre || rawRol?.[0]?.nombre || "").toLowerCase();

  // Roles Estándar
  const puedeVerFiscalia =
    nombreRol.includes("fiscal") ||
    nombreRol.includes("admin") ||
    nombreRol.includes("representante");
  const puedeVerTesoreria =
    nombreRol.includes("tesorero") ||
    nombreRol.includes("admin") ||
    nombreRol.includes("representante");
  const puedeVerSecretaria =
    nombreRol.includes("secretario") ||
    nombreRol.includes("admin") ||
    nombreRol.includes("representante");
  const puedeVerEstrado =
    nombreRol.includes("representante") || nombreRol.includes("admin");

  // Roles Especiales
  const esBienestar = nombreRol.includes("bienestar");
  const esAdmin = nombreRol.includes("admin");

  // 2. ENCAPSULACIÓN DEL SIDEBAR (Resuelve el error ts(2304) y el conflicto de Antigravity)
  const sidebar = (
    <>
      <aside className="w-64 bg-unicor-primary text-white flex flex-col shadow-2xl h-full">
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-unicor-secondary/30 shrink-0">
          <h1 className="text-2xl font-bold tracking-wider truncate">
            UNICOR<span className="text-unicor-accent">LIVING</span>
          </h1>
        </div>

        {/* Perfil */}
        <div className="border-b border-unicor-secondary/30 bg-black/10 shrink-0">
          <Link
            href="/perfil"
            className="block p-6 flex flex-col items-center hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-full border-4 border-unicor-secondary overflow-hidden mb-3 shadow-lg group-hover:scale-105 transition-transform shrink-0">
              {perfil?.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                  <UserCircle size={40} />
                </div>
              )}
            </div>

            <p className="font-bold text-lg text-center leading-tight group-hover:text-unicor-accent transition-colors">
              {perfil?.apodo || "Funcionario"}
            </p>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-unicor-accent uppercase tracking-wide font-bold">
                {esAdmin
                  ? "Administrador"
                  : esBienestar
                    ? "Bienestar Univ."
                    : perfil?.es_adjudicado
                      ? "Residente Oficial"
                      : "En Prueba"}
              </span>
            </div>
          </Link>
        </div>

        {/* PERMISOS */}
        <SidebarNav
          esFiscal={puedeVerFiscalia}
          esTesorero={puedeVerTesoreria}
          esSecretario={puedeVerSecretaria}
          esRepresentante={puedeVerEstrado}
          esBienestar={esBienestar}
          esAdmin={esAdmin}
        />

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-unicor-secondary/30 mt-auto shrink-0">
          <form action={signout}>
            <button className="flex w-full items-center justify-center space-x-2 bg-red-900/30 hover:bg-red-600/80 text-red-200 hover:text-white py-3 md:py-3 px-4 rounded-lg transition-all duration-300 group touch-manipulation">
              <LogOut
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );

  return (
    <div className="flex h-screen bg-unicor-base text-gray-800 overflow-hidden relative">
      <DashboardLayoutClient sidebar={sidebar} esAdmin={esAdmin}>
        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-8 md:pt-8 relative min-w-0">
          {/* Decoración de fondo */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2 ${esAdmin ? "bg-slate-500/10" : "bg-unicor-secondary/5"}`}
          ></div>

          {children}
        </main>
      </DashboardLayoutClient>
    </div>
  );
}
