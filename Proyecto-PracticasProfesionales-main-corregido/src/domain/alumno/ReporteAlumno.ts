export type EstadoReporteAlumno = "Pendiente" | "Aprobado" | "Rechazado";
export type TipoReporteAlumno = "Parcial" | "Final";

export interface AsignacionReporteAlumno {
  id_asignacion: number;
  empresa: string;
  vacante: string;
  fecha_inicio: string;
  estado_asignacion: string;
}

export interface ReporteAlumno {
  id_reporte: number;
  id_asignacion: number;
  tipo_reporte: TipoReporteAlumno | null;
  titulo: string;
  descripcion: string | null;
  archivo: string;
  url: string;
  fecha_entrega: string;
  estado: EstadoReporteAlumno;
  calificacion: number | null;
  observacion_asesor: string | null;
  fecha_revision?: string | null;
}

export interface ResumenReportesAlumno {
  total: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
}

export interface EspacioReporteAlumno {
  tipo_reporte: TipoReporteAlumno;
  titulo: string;
  descripcion: string;
  horas_requeridas: number;
  horas_actuales: number;
  desbloqueado: boolean;
  puede_enviar: boolean;
  motivo_bloqueo: string | null;
  reporte: ReporteAlumno | null;
}

export interface ReportesAlumnoResponse {
  puede_subir: boolean;
  motivo_bloqueo: string | null;
  estado_alumno: string;
  horas_actuales: number;
  horas_meta: number;
  origen_regla: "regla_practica_carrera" | "tipo_practica" | "sin_configurar";
  advertencia_regla: string | null;
  asignacion: AsignacionReporteAlumno | null;
  resumen: ResumenReportesAlumno;
  espacios: EspacioReporteAlumno[];
  reportes: ReporteAlumno[];
}

export interface SubirReporteAlumnoInput {
  tipo_reporte: TipoReporteAlumno;
  descripcion?: string;
  nombre_archivo: string;
  contenido_base64: string;
  mime_type: string;
}
