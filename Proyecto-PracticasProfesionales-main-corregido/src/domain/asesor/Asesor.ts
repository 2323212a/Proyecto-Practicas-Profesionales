export interface AlumnoAsignadoAsesor {
  id_asignacion: number;
  id_alumno: number | null;
  nombre: string;
  correo: string | null;
  matricula: string | null;
  carrera: string;
  empresa: string;
  horas_actuales: number;
  horas_meta: number;
  reportes_entregados: number;
  reportes_meta: number;
  reportes_pendientes: number;
  estado: string;
  ultimo_reporte: string;
  estado_asignacion: string;
  fecha_asignacion: string;
}

export interface ResumenAsesor {
  total: number;
  pendientes: number;
  observaciones: number;
  cierre: number;
}

export interface AlumnosAsignadosAsesorResponse {
  resumen: ResumenAsesor;
  alumnos: AlumnoAsignadoAsesor[];
}

export type EstadoReporteAsesor = "Pendiente" | "Aprobado" | "Rechazado";
export type TipoReporteAsesor = "Parcial" | "Final";

export interface ReporteAsesor {
  id_reporte: number;
  id_asignacion: number;
  id_alumno: number | null;
  alumno: string;
  matricula: string | null;
  carrera: string;
  empresa: string;
  tipo_reporte: TipoReporteAsesor | null;
  titulo: string;
  descripcion: string | null;
  archivo: string;
  url: string | null;
  fecha_entrega: string;
  estado: EstadoReporteAsesor;
}

export interface ResumenReportesAsesor {
  total: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
}

export interface ReportesAsesorResponse {
  resumen: ResumenReportesAsesor;
  reportes: ReporteAsesor[];
}

export interface EvaluacionDocente {
  id_evaluacion: number;
  calificacion: number;
  comentarios: string | null;
  fecha_evaluacion: string;
}

export interface AlumnoEvaluacionDocente {
  id_asignacion: number;
  id_alumno: number | null;
  alumno: string;
  matricula: string | null;
  carrera: string;
  empresa: string;
  horas_aprobadas: number;
  reportes_pendientes: number;
  reportes_rechazados: number;
  puede_evaluar: boolean;
  motivo_bloqueo: string | null;
  evaluacion: EvaluacionDocente | null;
}

export interface ResumenEvaluacionesDocente {
  total: number;
  evaluados: number;
  pendientes: number;
  bloqueados: number;
}

export interface EvaluacionesDocenteResponse {
  resumen: ResumenEvaluacionesDocente;
  alumnos: AlumnoEvaluacionDocente[];
}

export interface GuardarEvaluacionDocenteInput {
  id_asignacion: number;
  calificacion: number;
  comentarios?: string;
}
