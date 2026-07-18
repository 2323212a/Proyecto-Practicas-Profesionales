export interface EmpresaVacantesUnidad {
  id_empresa: number;
  nombre_empresa: string;
  estado_empresa: string;
  tipo_tramite?: string | null;
  puede_publicar: boolean;
  documentacion_legal_aprobada?: boolean;
  convenio_vigente?: boolean;
  convenio_estado?: string | null;
  puede_capturar_vacantes?: boolean;
  motivo_bloqueo: string | null;
}

export interface VacanteUnidad {
  id_vacante: number;
  id_empresa: number;
  id_convocatoria: number;
  id_tipo_practica: number;
  titulo: string;
  descripcion: string | null;
  actividades: string | null;
  requisitos: string | null;
  cupos: number;
  estado_vacante: string;
  visible_padron?: boolean;
  periodo?: "Semestral" | "Cuatrimestral" | null;
  tipo_practica?: string | null;
  observaciones?: string | null;
}

export interface VacantesUnidadResponse {
  empresa: EmpresaVacantesUnidad;
  vacantes: VacanteUnidad[];
}

export interface CrearVacanteUnidadInput {
  id_convocatoria: number;
  id_tipo_practica: number;
  titulo: string;
  descripcion?: string;
  actividades?: string;
  requisitos?: string;
  cupos: number;
}

export interface ConvocatoriaBasica {
  id_convocatoria: number;
  nombre: string;
  tipo_periodo: "Semestral" | "Cuatrimestral";
  estado: string;
  fase_actual?: string;
}
