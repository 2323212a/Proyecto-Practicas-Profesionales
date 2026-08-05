export interface AsesorDisponible {
  id_asesor: number;
  id_personal: number;
  id_usuario: number;
  nombre: string;
  correo: string | null;
  departamento: string;
  asignaciones_activas: number;
}

export interface AsignacionParaAsesor {
  id_asignacion: number;
  id_asesor: number | null;
  alumno: string;
  matricula: string | null;
  carrera: string;
  empresa: string;
  vacante: string;
  asesor: string;
  estado_asignacion: string;
  fecha_asignacion: string;
}

export interface AsignacionAsesorResponse {
  asesores: AsesorDisponible[];
  asignaciones: AsignacionParaAsesor[];
}
