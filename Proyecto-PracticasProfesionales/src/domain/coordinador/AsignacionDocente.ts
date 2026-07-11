export interface DocenteDisponible {
  id_docente: number;
  id_usuario: number;
  nombre: string;
  correo: string | null;
  departamento: string;
  asignaciones_activas: number;
}

export interface AsignacionParaDocente {
  id_asignacion: number;
  id_docente: number | null;
  alumno: string;
  matricula: string | null;
  carrera: string;
  empresa: string;
  vacante: string;
  docente: string;
  estado_asignacion: string;
  fecha_asignacion: string;
}

export interface AsignacionDocenteResponse {
  docentes: DocenteDisponible[];
  asignaciones: AsignacionParaDocente[];
}
