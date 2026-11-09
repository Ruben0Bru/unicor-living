import { GeneradorAseosPayload, AsignacionAseoInsert } from "@/types/aseos";

// Función para mezclar el orden de las tareas cada día
function shuffleArray(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function generarMatrizAseos(
  payload: GeneradorAseosPayload,
): AsignacionAseoInsert[] {
  const { casa_id, mes, anio, pools } = payload;
  const resultados: AsignacionAseoInsert[] = [];

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const punteros = {
    casa: 0,
    bano1: 0,
    bano2: 0,
    nevera1: 0,
    nevera2: 0,
    cocina: 0,
    basura: 0,
  };

  // 1. ZONA HORARIA
  const hoyString = new Date().toLocaleString("en-US", {
    timeZone: "America/Bogota",
  });
  const hoy = new Date(hoyString);
  let diaInicio = 1;

  if (anio === hoy.getFullYear() && mes === hoy.getMonth()) {
    diaInicio = hoy.getDate() + 1;
    if (diaInicio > diasEnMes) return [];
  } else if (
    anio < hoy.getFullYear() ||
    (anio === hoy.getFullYear() && mes < hoy.getMonth())
  ) {
    return [];
  }

  for (let dia = diaInicio; dia <= diasEnMes; dia++) {
    const fechaActual = new Date(anio, mes, dia);
    const diaSemana = fechaActual.getDay();

    const y = fechaActual.getFullYear();
    const m = String(fechaActual.getMonth() + 1).padStart(2, "0");
    const d = String(fechaActual.getDate()).padStart(2, "0");
    const stringFecha = `${y}-${m}-${d}`;

    const asignadosHoy = new Set<string>();

    const tareasDelDia = ["cocina", "casa", "bano1", "bano2"];
    if ([2, 4, 6].includes(diaSemana)) tareasDelDia.push("basura");

    // Las neveras se limpian los sábados
    if (diaSemana === 6) {
      tareasDelDia.push("nevera1", "nevera2");
    }

    const tareasMezcladas = shuffleArray(tareasDelDia);

    const nombresBD: Record<string, string> = {
      cocina: "Cocina",
      casa: "Casa",
      bano1: "Baño 1",
      bano2: "Baño 2",
      basura: "Basura",
      nevera1: "Nevera 1",
      nevera2: "Nevera 2",
    };

    const despachar = (zonaKey: keyof typeof pools, zonaDB: string) => {
      const pool = pools[zonaKey];
      if (!pool || pool.length === 0) return; // Válvula de seguridad

      let asignado = false;

      // Buscar a alguien que NO tenga aseo hoy
      for (let intentos = 0; intentos < pool.length; intentos++) {
        const index = (punteros[zonaKey] + intentos) % pool.length;
        const residenteCandidato = pool[index];

        if (!asignadosHoy.has(residenteCandidato)) {
          asignadosHoy.add(residenteCandidato);
          resultados.push({
            casa_id,
            residente_id: residenteCandidato,
            tipo_aseo: zonaDB,
            fecha_asignada: stringFecha,
            realizado: false,
            verificado: false,
          } as AsignacionAseoInsert);

          // Avanza el puntero saltándose a los que estaban ocupados
          punteros[zonaKey] += intentos + 1;
          asignado = true;
          break;
        }
      }

      // Si todos los de la lista están ocupados, permitimos doble aseo al que le toca el turno
      if (!asignado) {
        const index = punteros[zonaKey] % pool.length;
        const residenteCandidato = pool[index];
        resultados.push({
          casa_id,
          residente_id: residenteCandidato,
          tipo_aseo: zonaDB,
          fecha_asignada: stringFecha,
          realizado: false,
          verificado: false,
        } as AsignacionAseoInsert);

        punteros[zonaKey]++;
      }
    };

    // Ejecutamos el despacho en el orden aleatorio de hoy
    tareasMezcladas.forEach((zonaKey) => {
      despachar(zonaKey as keyof typeof pools, nombresBD[zonaKey]);
    });
  }

  return resultados;
}
