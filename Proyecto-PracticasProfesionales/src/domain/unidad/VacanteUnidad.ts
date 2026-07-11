export interface EmpresaVacantesUnidad {
  id_empresa: number;
  nombre_empresa: string;
  estado_empresa: string;
  puede_publicar: boolean;
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
}

export interface CarreraBasica {
  id_carrera: number;
  clave: string;
  nombre: string;
}
