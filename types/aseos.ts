export type GeneradorAseosPayload = {
  casa_id: string;
  mes: number; 
  anio: number;
  pools: {
    casa: string[];    
    bano: string[];    // Unificado y sin ñ
    cocina: string[];  
    basura: string[];  
  }
}

export type AsignacionAseoInsert = {
  casa_id: string;
  residente_id: string;
  tipo_aseo: 'Casa' | 'Baño' | 'Cocina' | 'Basura';
  fecha_asignada: string; 
  realizado: boolean;
  verificado: boolean;
}