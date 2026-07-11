export interface AlumnoUnidad {
  id_asignacion: number;
  id_alumno: number;
  nombre: string;
  matricula: string;
  carrera: string;
  semestre: number | null;
  grupo: string | null;
  proyecto: string;
  vacante: string;
  horas_aprobadas: number;
  horas_pendientes: number;
  total_horas: number;
  avance: number;
  estado: string;
  asesor: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo_asignacion: string;
}

export interface AlumnosUnidadResponse {
  id_empresa: number;
  empresa: string;
  estado_empresa: string;
  alumnos: AlumnoUnidad[];
}
