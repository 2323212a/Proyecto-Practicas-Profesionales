export interface RequisitosLiberacion {
  expediente_aprobado: boolean;
  horas_completas: boolean;
  reportes_aprobados: boolean;
  evaluacion_asesor: boolean;
  evaluacion_empresa: boolean;
  evaluacion_alumno_empresa: boolean;
  incidencias_cerradas: boolean;
}

export interface LiberacionEmitida {
  id_liberacion: number;
  estado_liberacion: string;
  fecha_liberacion: string | null;
  documento_liberacion: string | null;
  documento_nombre: string | null;
  documento_url: string | null;
  observaciones: string | null;
}

export interface AlumnoLiberacion {
  id_asignacion: number;
  id_alumno: number;
  alumno: string;
  matricula: string | null;
  carrera: string;
  empresa: string;
  vacante: string;
  estado_alumno: string | null;
  estado_asignacion: string;
  horas_aprobadas: number;
  horas_meta: number;
  origen_regla: "regla_practica_carrera" | "tipo_practica" | "sin_configurar";
  advertencia_regla: string | null;
  reportes_pendientes: number;
  reportes_rechazados: number;
  incidencias_abiertas: number;
  requisitos: RequisitosLiberacion;
  faltantes: string[];
  listo_liberacion: boolean;
  liberacion: LiberacionEmitida | null;
}

export interface LiberacionResponse {
  resumen: {
    total: number;
    listos: number;
    bloqueados: number;
    liberados: number;
  };
  alumnos: AlumnoLiberacion[];
}

export interface LiberacionAlumnoResponse {
  alumno: AlumnoLiberacion | null;
}

export interface AnexarLiberacionPayload {
  nombre_archivo: string;
  contenido_base64: string;
  mime_type: string;
}
