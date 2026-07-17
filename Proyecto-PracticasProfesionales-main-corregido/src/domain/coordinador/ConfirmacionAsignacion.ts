export interface VacanteConfirmacion {
  id_vacante: number;
  titulo: string;
  modalidad: string;
  horario: string | null;
  cupo_total: number;
  cupo_disponible: number;
}

export interface PreferenciaConfirmacion {
  id_seleccion: number;
  id_empresa: number;
  id_vacante: number | null;
  empresa: string;
  prioridad: number;
  estado_empresa: string;
  estado_seleccion: "Pendiente" | "Aprobada" | "Rechazada";
  observaciones: string | null;
  vacantes: VacanteConfirmacion[];
}

export interface AlumnoConfirmacion {
  id_alumno: number;
  nombre: string;
  matricula: string;
  carrera: string;
  estado_alumno: string;
  ya_asignado: boolean;
  id_asignacion: number | null;
  empresa_asignada: string | null;
  vacante_asignada: string | null;
  preferencias: PreferenciaConfirmacion[];
}

export interface ConfirmacionAsignacionesResponse {
  convocatoria_id: number | null;
  convocatoria: string | null;
  secretaria_academica: string;
  alumnos: AlumnoConfirmacion[];
}

export interface SecretariaAcademicaResponse {
  secretaria_academica: string;
}

export interface ConfirmarAsignacionRequest {
  id_alumno: number;
  id_empresa: number;
  id_vacante: number;
  id_docente?: number | null;
  tipo_asignacion?: string;
}

export interface RechazarSeleccionRequest {
  observaciones?: string | null;
}
