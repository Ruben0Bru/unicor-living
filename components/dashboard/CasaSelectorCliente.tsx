'use client'

import { useRouter } from 'next/navigation'
import { Filter } from 'lucide-react'

// Definimos el tipo para que TS sepa que 'genero' existe
type Casa = {
    id: string;
    nombre: string;
    genero?: string;
}

export function CasaSelectorClient({ casas, casaActual }: { casas: Casa[], casaActual: string }) {
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        if (value === 'all') {
            router.push('/bienestar')
        } else {
            router.push(`/bienestar?casa=${value}`)
        }
    }

    // Función auxiliar para formatear bonito el género
    const formatGenero = (g?: string) => {
        if (!g) return '';
        const lower = g.toLowerCase();
        if (lower.startsWith('m') && lower.includes('asc')) return 'Varones'; // Masculino
        if (lower.startsWith('f')) return 'Mujeres'; // Femenino
        if (lower.includes('mix')) return 'Mixta';
        return g; // Fallback
    }

    return (
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                <Filter size={18} />
            </div>
            <select 
                value={casaActual} 
                onChange={handleChange}
                className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm py-1 pr-2 max-w-[200px] truncate"
            >
                <option value="all">🏢 Todas las Sedes</option>
                {casas.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.nombre} ({formatGenero(c.genero)})
                    </option>
                ))}
            </select>
        </div>
    )
}