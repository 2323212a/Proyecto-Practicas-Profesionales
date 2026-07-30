export interface VacanteConfirmacion {
  id_vacante: number;
  id_empresa: number;
  empresa: string;
  id_convocatoria: number;
  convocatoria: string | null;
  id_tipo_practica: number;
  tipo_practica: string | null;
  titulo: string;
  descripcion: string | null;
  actividades: string | null;
  requisitos: string | null;
  cupos: number;
  cupos_usados: number;
  cupos_disponibles: number;
  periodo: string;
  estado_vacante: string;
}

export interface PreferenciaConfirmacion {
  id_seleccion: number;
  id_empresa: number;
  id_convocatoria: number;
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
  periodo_practica: string;
  ya_asignado: boolean;
  id_asignacion: number | null;
  empresa_asignada: string | null;
  vacante_asignada: string | null;
  es_rezagado: boolean;
  motivo_rezago: string | null;
  vacantes_disponibles: VacanteConfirmacion[];
  preferencias: PreferenciaConfirmacion[];
}

export interface AsesorInterno {
  id_asesor: number;
  id_usuario: number;
  nombre: string;
  correo: string | null;
  departamento: string | null;
  cargo: string | null;
}

export interface ConfirmacionAsignacionesResponse {
  convocatoria_id: number | null;
  convocatoria: string | null;
  secretaria_academica: string;
  asesores: AsesorInterno[];
  alumnos: AlumnoConfirmacion[];
}

export interface SecretariaAcademicaResponse {
  secretaria_academica: string;
}

export interface ConfirmarAsignacionRequest {
  id_alumno: number;
  id_empresa: number;
  id_vacante: number;
  id_asesor?: number | null;
  tipo_asignacion?: string;
  motivo?: string | null;
}

export interface RechazarSeleccionRequest {
  observaciones?: string | null;
}

export interface CambiarEmpresaAsignacionRequest {
  id_vacante_nueva: number;
  motivo: string;
  id_asesor?: number | null;
  notificar_alumno?: boolean;
  regenerar_documentos?: boolean;
}
