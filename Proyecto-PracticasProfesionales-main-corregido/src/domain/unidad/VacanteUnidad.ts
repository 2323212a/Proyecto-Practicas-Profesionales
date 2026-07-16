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
  id_carrera: number;
  carrera?: string;
  titulo: string;
  descripcion: string | null;
  modalidad: "Presencial" | "Virtual" | "Hibrida";
  horario: string | null;
  cupo_total: number;
  cupo_disponible: number;
  estado_vacante: string;
  visible_padron?: boolean;
  periodo?: "Semestral" | "Cuatrimestral" | null;
  id_tipo_practica?: number | null;
  tipo_practica?: string | null;
  observaciones?: string | null;
}

export interface VacantesUnidadResponse {
  empresa: EmpresaVacantesUnidad;
  vacantes: VacanteUnidad[];
}

export interface CrearVacanteUnidadInput {
  id_carrera: number;
  titulo: string;
  descripcion?: string;
  modalidad: "Presencial" | "Virtual" | "Hibrida";
  horario?: string;
  cupo_total: number;
  periodo: "Semestral" | "Cuatrimestral";
  id_tipo_practica: number;
}

export type ActualizarVacanteUnidadInput = CrearVacanteUnidadInput;

export interface CarreraBasica {
  id_carrera: number;
  clave: string;
  nombre: string;
}
