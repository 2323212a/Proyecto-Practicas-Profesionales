export type EstadoHoraUnidad = "Pendiente" | "Aprobada" | "Rechazada";

export interface HoraUnidad {
  id_horas: number;
  id_asignacion: number;
  id_alumno: number;
  alumno: string;
  matricula: string;
  carrera: string;
  proyecto: string;
  fecha: string;
  horas: number;
  actividad: string;
  estado: EstadoHoraUnidad;
  observaciones: string | null;
  evidencia_archivo: string | null;
  fecha_registro: string | null;
}

export interface ResumenHorasUnidad {
  total_registros: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  horas_aprobadas: number;
  horas_pendientes: number;
}

export interface HorasUnidadResponse {
  id_empresa: number;
  empresa: string;
  resumen: ResumenHorasUnidad;
  horas: HoraUnidad[];
}
