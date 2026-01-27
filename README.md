# 🏡 UnicorLiving - Sistema de Gestión de Residencias

Plataforma SaaS para la administración de residencias universitarias (Admisión, Tesorería, Convivencia y Legal).

## 🛠 Tech Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Lucide React.
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Lenguaje:** TypeScript.

## 📂 Estructura del Proyecto
- `/app/(dashboard)/admin`: Panel principal (KPIs, Usuarios).
- `/app/(dashboard)/admin/casas`: Gestión inmobiliaria (Precios, Capacidad).
- `/app/(dashboard)/admin/reglamento`: Editor legislativo (Leyes y Multas).
- `/app/(dashboard)/anuncios`: Cartelera digital.
- `/app/(dashboard)/tesoreria`: Cobros y gestión financiera.
- `/components/dashboard/SideBarNav.tsx`: Navegación lógica por roles.

## 🗄️ Base de Datos (Supabase)
El sistema se basa en 7 tablas principales con RLS (Row Level Security):
1. **perfiles**: Datos de usuario y rol.
2. **roles**: (Admin, Residente, Tesorero, Secretario, Fiscal, Representante).
3. **casas**: Configuración de sedes y tarifas.
4. **reglamento**: Artículos legales por casa.
5. **sanciones**: Tarifario de multas (disciplinarias/financieras).
6. **multas**: Relación residente-sanción.
7. **anuncios**: Comunicados oficiales.

## 🔐 Lógica Clave
- **Legislación:** Admin crea para todas las sedes; Representante solo para la suya.
- **Sanciones:** Se pueden agregar múltiples sanciones económicas a un mismo artículo.
- **Seguridad:** Todas las acciones de escritura (INSERT/UPDATE/DELETE) están protegidas por `checkPermissions` en el servidor y políticas RLS en la BD.

## 🚀 Estado Actual (v1.0)
Funcionalidad completa de gestión, convivencia y tesorería básica.