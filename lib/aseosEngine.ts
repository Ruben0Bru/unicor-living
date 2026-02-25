import { GeneradorAseosPayload, AsignacionAseoInsert } from '@/types/aseos';

export function generarMatrizAseos(payload: GeneradorAseosPayload): AsignacionAseoInsert[] {
  const { casa_id, mes, anio, pools } = payload;
  const resultados: AsignacionAseoInsert[] = [];
  
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const punteros = { casa: 0, bano: 0, cocina: 0, basura: 0 };

  const hoy = new Date();
  let diaInicio = 1;

  if (anio === hoy.getFullYear() && mes === hoy.getMonth()) {
    diaInicio = hoy.getDate() + 1; 
    if (diaInicio > diasEnMes) return []; 
  } else if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth())) {
    return []; 
  }

  for (let dia = diaInicio; dia <= diasEnMes; dia++) {
    const fechaActual = new Date(anio, mes, dia);
    const diaSemana = fechaActual.getDay(); 
    
    const y = fechaActual.getFullYear();
    const m = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const d = String(fechaActual.getDate()).padStart(2, '0');
    const stringFecha = `${y}-${m}-${d}`;
    
    const asignadosHoy = new Set<string>();

    const despachar = (zonaKey: keyof typeof pools, zonaDB: AsignacionAseoInsert['tipo_aseo']) => {
      const pool = pools[zonaKey];
      if (!pool || pool.length === 0) return; // Válvula de seguridad

      let intentos = 0;
      while (intentos < pool.length) {
        const index = punteros[zonaKey] % pool.length;
        const residenteCandidato = pool[index];
        
        punteros[zonaKey]++; 

        if (!asignadosHoy.has(residenteCandidato)) {
          asignadosHoy.add(residenteCandidato);
          resultados.push({
            casa_id,
            residente_id: residenteCandidato,
            tipo_aseo: zonaDB, 
            fecha_asignada: stringFecha,
            realizado: false,
            verificado: false
          });
          return; 
        }
        intentos++;
      }
    };

    despachar('cocina', 'Cocina');
    
    if ([2, 4, 6].includes(diaSemana)) {
      despachar('basura', 'Basura');
    }

    despachar('bano', 'Baño');
    despachar('bano', 'Baño');
    despachar('casa', 'Casa');
  }

  return resultados;
}