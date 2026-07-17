export type PrioridadIncidencia = "Baja" | "Media" | "Alta";
export type EstadoIncidencia = "Abierta" | "En seguimiento" | "Resuelta" | "Cerrada";

export interface AsignacionSeguimiento {
  id_asignacion: number;
  id_alumno: number;
  alumno: string;
  matricula: string | null;
  carrera: string;
  empresa: string;
  vacante: string;
}

export interface CierreSeguimiento {
  horas_aprobadas: number;
  reportes_pendientes: number;
  reportes_rechazados: number;
  puede_evaluar: boolean;
  motivo_bloqueo: string | null;
}

export interface EvaluacionAlumnoEmpresa {
  id_evaluacion_empresa_alumno: number;
  calificacion: number;
  respuestas: Record<string, string>;
  incidencias_detectadas: string[];
  comentarios: string | null;
  fecha_evaluacion: string;
}

export interface EvaluacionEmpresaAlumno {
  id_evaluacion: number;
  calificacion: number;
  comentarios: string | null;
  fecha_evaluacion: string;
}

export interface IncidenciaPractica {
  id_incidencia: number;
  id_asignacion: number;
  alumno: string;
  matricula: string | null;
  empresa: string;
  reportante: "Alumno" | "Empresa" | "Docente" | "Coordinacion";
  tipo_incidencia: string;
  prioridad: PrioridadIncidencia;
  descripcion: string;
  estado: EstadoIncidencia;
  respuesta_coordinacion: string | null;
  fecha_reporte: string | null;
  fecha_actualizacion: string | null;
}

export interface SeguimientoAlumnoResponse {
  asignacion: AsignacionSeguimiento | null;
  cierre: CierreSeguimiento | null;
  evaluacion_empresa: EvaluacionAlumnoEmpresa | null;
  incidencias: IncidenciaPractica[];
}

export interface SeguimientoUnidadAlumno extends AsignacionSeguimiento, CierreSeguimiento {
  evaluacion_alumno: EvaluacionEmpresaAlumno | null;
  incidencias: number;
}

export interface SeguimientoUnidadResponse {
  resumen: {
    total: number;
    evaluados: number;
    pendientes: number;
  };
  alumnos: SeguimientoUnidadAlumno[];
}

export interface IncidenciasCoordinadorResponse {
  resumen: {
    total: number;
    abiertas: number;
    seguimiento: number;
    resueltas: number;
  };
  incidencias: IncidenciaPractica[];
}

export interface PreguntaEvaluacion {
  id: string;
  texto: string;
}

export interface PlantillaEvaluacionAlumnoEmpresa {
  preguntas: PreguntaEvaluacion[];
  respuestas: string[];
  incidencias_sugeridas: string[];
}

export interface CrearIncidenciaInput {
  tipo_incidencia: string;
  prioridad: PrioridadIncidencia;
  descripcion: string;
}

export interface EvaluacionAlumnoEmpresaInput {
  calificacion: number;
  respuestas: Record<string, string>;
  incidencias_detectadas?: string[];
  comentarios?: string;
}

export interface EvaluacionEmpresaAlumnoInput {
  id_asignacion: number;
  calificacion: number;
  comentarios?: string;
}
