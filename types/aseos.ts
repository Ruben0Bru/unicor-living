export type GeneradorAseosPayload = {
  casa_id: string;
  mes: number;
  anio: number;
  pools: {
    casa: string[];
    bano1: string[];
    bano2: string[];
    nevera1: string[];
    nevera2: string[];
    cocina: string[];
    basura: string[];
  };
};

export type AsignacionAseoInsert = {
  casa_id: string;
  residente_id: string;
  tipo_aseo:
    | "Casa"
    | "Baño 1"
    | "Baño 2"
    | "Cocina"
    | "Basura"
    | "Nevera 1"
    | "Nevera 2";
  fecha_asignada: string;
  realizado: boolean;
  verificado: boolean;
};
