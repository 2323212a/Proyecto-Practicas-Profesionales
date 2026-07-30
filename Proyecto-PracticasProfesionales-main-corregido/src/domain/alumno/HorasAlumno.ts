export interface AsignacionHorasAlumno {
  id_asignacion: number;
  empresa: string;
  vacante: string;
  fecha_inicio: string;
  estado_asignacion: string;
}

export interface ResumenHorasAlumno {
  total_meta: number;
  aprobadas: number;
  pendientes: number;
  rechazadas: number;
  progreso: number;
  origen_regla: "regla_practica_carrera" | "tipo_practica" | "sin_configurar";
  advertencia_regla: string | null;
}

export interface RegistroHorasAlumno {
  id_horas: number;
  id_asignacion: number;
  fecha: string;
  horas_realizadas: number;
  actividad: string;
  evidencia_archivo: string | null;
  estado_horas: string;
  observaciones: string | null;
  fecha_registro: string;
}

export interface SemanaHorasAlumno {
  semana: string;
  horas: number;
}

export interface HorasAlumnoResponse {
  asignacion: AsignacionHorasAlumno | null;
  resumen: ResumenHorasAlumno;
  horas: RegistroHorasAlumno[];
  semanas: SemanaHorasAlumno[];
}

export interface CrearHorasAlumnoRequest {
  fecha: string;
  horas_realizadas: number;
  actividad: string;
  evidencia_archivo?: string | null;
}
